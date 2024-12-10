import { BACKEND_URL } from "@/Utils/Utils";
import axios, { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import MusicPlayer from "./MusicPlayer/MusicPlayer";
import { motion } from "framer-motion";
import MultiCircleLoader from "@/components/ui/spinLoader";

interface Task {
  id: number;
  amount: number;
  title: string;
  options: {
    id: number;
    beat_url: string;
    task_id: number;
  }[];
}
interface NextTaskProps {
  setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const NextTask: React.FC<NextTaskProps> = ({ setTitle }) => {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNextTask = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get<{ task: Task }>(
        `${BACKEND_URL}/v1/listner/nextTask`,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      setCurrentTask(response.data.task);
      setTitle(response.data.task.title);

      console.log("task is ");
      console.log(response.data.task);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Handle Axios-specific errors
        const axiosError = err as AxiosError;
        if (axiosError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          setError(
            `Error: ${axiosError.response.status} - ${axiosError.response.data}`
          );
        } else if (axiosError.request) {
          // The request was made but no response was received
          setError("No response received from the server");
        } else {
          // Something happened in setting up the request that triggered an Error
          setError("Error setting up the request");
        }
      } else {
        // Handle generic errors
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSubmission = async (option: Task["options"][0]) => {
    console.log("clicekd ");
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<{ nextTask: Task | null }>(
        `${BACKEND_URL}/v1/listner/submission`,
        {
          taskId: currentTask?.id.toString(),
          selection: option.id.toString(),
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );
      console.log(response);

      const nextTask = response.data.nextTask;
      console.log("next task is ");
      console.log(nextTask);
      if (nextTask) {
        setCurrentTask(nextTask);
      } else {
        setCurrentTask(null);
      }
    } catch (err) {
      console.log(err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        if (axiosError.response) {
          setError(
            `Submission Error: ${axiosError.response.status} - ${axiosError.response.data}`
          );
        } else if (axiosError.request) {
          setError("No response received after submission");
        } else {
          setError("Error submitting task");
        }
      } else {
        setError((err as Error).message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchNextTask();
  }, []);

  if (loading) {
    return <div>Loading. Please wait</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!currentTask) {
    return <div>No more tasks available. Please refresh or try later</div>;
  }

  return (
    <div className="flex flex-row w-full h-full justify-center items-center gap-6 min-w-fit">
      {isSubmitting ? (
        <MultiCircleLoader />
      ) : (
        currentTask.options.map((option) => (
          <motion.div
            key={`temp-${option.id}`}
            initial={{ scale: 1 }}
            whileHover={{
              scale: 1.05,
              transition: {
                type: "tween",
                duration: 0.1,
              },
            }}
            whileTap={{
              scale: 0.97,
              transition: {
                type: "tween",
                duration: 0.1,
              },
            }}
            className="hover:z-50 transition-all duration-200 h-full"
          >
            <MusicPlayer
              key={option.id}
              audioSrc={option.beat_url}
              onSelect={() => handleOptionSubmission(option)}
            />
          </motion.div>
        ))
      )}
    </div>
  );
};

export default NextTask;
