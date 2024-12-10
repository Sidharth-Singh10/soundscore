import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import nacl from "tweetnacl";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fromEnv } from "@aws-sdk/credential-providers";
import jwt from "jsonwebtoken";
import { JWT_SECRET, RPC_SERVER_URL } from "../config";
import { authMiddleware, workerAuthMiddleware } from "../middleware";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
const router = Router();
import { createTaskInput } from "../types";
import { Connection, PublicKey } from "@solana/web3.js";
const prismaClient = new PrismaClient();
const DEFUALT_TITLE = "TESTING";
const TOTAL_DECIMALS = 1000_000;

const s3Client = new S3Client({
  credentials: fromEnv(),
  region: "ap-south-1",
});
const connection = new Connection(RPC_SERVER_URL);
const PARENT_WALLET_ADDRESS = "BjmkyM188C6mZ8SVjJ7KRP1qk7aLqB7fLeqymmWKrT3m";

router.get("/task", authMiddleware, async (req, res) => {
  //@ts-ignore
  const taskId: string = req.query.taskId;
  //@ts-ignore
  const userId: string = req.userId;

  const taskDetails = await prismaClient.task.findFirst({
    where: {
      id: Number(taskId),
      user_id: Number(userId),
    },
    include: {
      options: true,
    },
  });
  if (!taskDetails) {
    return res.status(411).json({
      message: "You cant access this task",
    });
  }
  const responses = await prismaClient.submission.findMany({
    where: {
      task_id: Number(taskId),
    },
    include: {
      option: true,
    },
  });
  const result: Record<
    string,
    {
      count: number;
      option: {
        imageUrl: string;
      };
    }
  > = {};

  taskDetails.options.forEach((option) => {
    result[option.id] = {
      count: 1,
      option: {
        imageUrl: option.beat_url,
      },
    };
  });

  responses.forEach((r) => {
    result[r.option_id].count++;
  });
  res.json({
    result,
  });
});

router.post("/task", authMiddleware, async (req, res) => {
  //@ts-ignore
  const userId = req.userId;
  // validating the inputs
  const body = req.body;
  const parsedData = createTaskInput.safeParse(body);

  const user = await prismaClient.user.findFirst({
    where: {
      id: userId
    }
  })
  if (!parsedData.success) {
    return res.status(411).json({
      message: "You've sent the wrong inputs"
    })
  }
  const transaction = await connection.getTransaction(parsedData.data.signature, {
    maxSupportedTransactionVersion: 1
  });


  if ((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000) {
    return res.status(411).json({
      message: "Transaction signature/amount incorrect"
    })
  }

  if (transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS) {
    return res.status(411).json({
      message: "Transaction sent to wrong address"
    })
  }

  if (transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address) {
    return res.status(411).json({
      message: "Transaction sent to wrong address"
    })
  }

  console.log("SUCCESS BC!!!");
  const response = await prismaClient.$transaction(async (tx) => {
    const response = await tx.task.create({
      data: {
        title: parsedData.data.title ?? DEFUALT_TITLE,
        amount: 0.1 * TOTAL_DECIMALS,
        signature: parsedData.data.signature,
        user_id: userId,
      },
    });

    await tx.option.createMany({
      data: parsedData.data.options.map((x) => ({
        beat_url: x.beatUrl,
        task_id: response.id,
      })),
    });
    return response;
  });

  res.json({
    id: response.id,
  });
});

router.post("/presignedURL", async (req, res) => {
  //@ts-ignore
  const userId = req.userId;
  //@ts-ignore
  const filename = req.body.filename;

  console.log("file name is " + filename);


  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: "soundscoredb",
    Key: `beats/${userId}/${Math.random()}/${filename}`,
    Conditions: [
      ["content-length-range", 0, 5 * 1024 * 1024], // 5 MB max
    ],
    Fields: {
      // success_action_status: '201',
      // 'Content-Type': 'image/png'
    },
    Expires: 3600,
  });

  console.log({ url, fields });
  res.json({ preSignedUrl: url, fields });
});

router.post("/signin", async (req, res) => {
  const { publicKey, signature } = req.body;

  const signedString = "Sign into nirvana"
  const message = new TextEncoder().encode("Sign into nirvana");
  const verified = nacl.sign.detached.verify(
    message,
    new Uint8Array(signature.data),
    new PublicKey(publicKey).toBytes(),
  );
  // console.log(verified);
  if (!verified) {
    return res.status(411).json({
        message: "Incorrect signature"
    })
}


  const existinguser = await prismaClient.user.findFirst({
    where: {
      address: publicKey,
    },
  });

  if (existinguser) {
    const token = jwt.sign(
      {
        userId: existinguser.id,
      },
      JWT_SECRET
    );

    res.json({
      token,
    });
  } else {
    const user = await prismaClient.user.create({
      data: {
        address: publicKey,
      },
    });
    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET
    );

    res.json({
      token,
    });
  }
});

export default router;
