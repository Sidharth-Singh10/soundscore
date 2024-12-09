import { Router } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
const router = Router();
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { workerAuthMiddleware } from "../middleware";
import { textSpanContainsTextSpan } from "typescript";
const prismaClient = new PrismaClient();

import { WORKER_JWT_SECRET } from "../config";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";

const TOTAL_SUBMISSION = 100;
// const TOTAL_DECIMALS = 1000_000;


router.post("/payout", workerAuthMiddleware, async(req,res) =>
{
  //@ts-ignore
  const userId:string = req.userId;
  const listner = await prismaClient.listner.findFirst({
    where:{
      id:Number(userId)
    }
  })

  if(!listner)
    {
      return res.status(403).json({message:"User not found"})
    }

    const address = listner.address;

    const  txnId = "Ox12412124"

    await prismaClient.$transaction(async tx =>{
      await tx.listner.update({
        where:{
          id:Number(userId)
        },
        data:{
          pending_amount:{
            decrement:listner.pending_amount
          },
          locked_amount:{
            increment:listner.pending_amount
          }
        }

      })

      await tx.payout.create({
        data:{
          user_id:Number(userId),
          amount: listner.pending_amount,
          status:"Processing",
          signature:txnId
        }
      })
    })

    res.json({
      Message:"Processing payout",
      amount:listner.pending_amount
    })


})

router.get('/balance', workerAuthMiddleware,async(req,res)=>{
  //@ts-ignore
  const userId:string = req.userId;

  const listener = await prismaClient.listner.findFirst({
    where:{
      id:Number(userId)
    }
  })
  res.json(
    {
      pendingAmount: listener?.pending_amount,
      lockedAmount:listener?.locked_amount
    }
  );
})

router.post("/submission", workerAuthMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    console.log("Submission request:", { userId, body });

    if (!parsedBody.success) {
      return res.status(400).json({ 
        message: "Invalid input", 
        errors: parsedBody.error.errors 
      });
    }

    // Verify task exists and matches
    const task = await getNextTask(Number(userId));
    if (!task || task?.id !== Number(parsedBody.data.taskId)) {
      return res.status(411).json({ message: "Incorrect task id" });
    }

    const amount = (Number(task.amount) / TOTAL_SUBMISSION);

    // Use a try-catch block with transaction
    const submission = await prismaClient.$transaction(async (tx) => {
      try {
        // Create submission
        const submissionRecord = await tx.submission.create({
          data: {
            option_id: Number(parsedBody.data.selection),
            listner_id: userId,
            task_id: Number(parsedBody.data.taskId),
            amount,
          },
        });

        // Update listener's pending amount
        await tx.listner.update({
          where: { id: userId },
          data: {
            pending_amount: {
              increment: Number(amount)
            }
          },
        });

        return submissionRecord;
      } catch (txError) {
        console.error("Transaction error:", txError);
        throw txError; // Re-throw to trigger transaction rollback
      }
    }, {
      // Add transaction options
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
    });

    // Get next task after successful submission
    const nextTask = await getNextTask(Number(userId));

    res.json({
      nextTask,
      amount,
    });

  } catch (error) {
    console.error("Submission error:", error);

    // Handle specific Prisma transaction error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2028') {
        return res.status(500).json({ 
          message: "Database transaction timeout. Please try again.",
          errorCode: 'TRANSACTION_TIMEOUT'
        });
      }
    }

    // Generic error handling
    res.status(500).json({ 
      message: "An unexpected error occurred during submission",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
router.get("/nextTask", workerAuthMiddleware, async (req, res) => {
  //@ts-ignore
  const userId = req.userId;

  const task = await getNextTask(Number(userId));

  if (!task) {
    res.status(411).json({ message: " No Tasks not available" });
  } else {
    res.status(200).json({ task });
  }
});

router.post("/signin", async (req, res) => {
  const hardcodeduseraddress = "GwmgDqZqkhUxAK828W3C1jwKp3AJ7LtFRUtZ3DCsjHNV";

  const existinguser = await prismaClient.listner.findFirst({
    where: {
      address: hardcodeduseraddress,
    },
  });

  if (existinguser) {
    const token = jwt.sign(
      {
        userId: existinguser.id,
      },
      WORKER_JWT_SECRET
    );

    res.json({
      token,
    });
  } else {
    const user = await prismaClient.listner.create({
      data: {
        address: hardcodeduseraddress,
        pending_amount: 0,
        locked_amount: 0,
      },
    });
    const token = jwt.sign(
      {
        userId: user.id,
      },
      WORKER_JWT_SECRET
    );

    res.json({
      token,
    });
  }
});
export default router;
