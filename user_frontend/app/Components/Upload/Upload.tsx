"use client";
import React, { useState } from "react";
import UploadImage2 from "../FileUpload/UploadImage2";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { BACKEND_URL } from "@/Utils/Utils";
import DisplayFiles from "./DisplayFiles";
import { useRouter } from "next/navigation";

const Upload = () => {
  const router = useRouter();
  const [fileName, setFileName] = useState<string[]>([]);
  const updateFileName = (newFileName: string[]) => {
    setFileName([...fileName, ...newFileName]);
  };

  const [title, setTitle] = useState("");

  const [fileURL, setFileURL] = useState<string[]>([]);
  const updateFileURL = (newFileURL: string[]) => {
    setFileURL([...fileURL, ...newFileURL]);
  };

  const audioFiles = fileName.map((name, index) => ({
    audioSrc: fileURL[index],
    title: name,
  }));

  async function onSubmit() {
    const response = await axios.post(
      `${BACKEND_URL}/v1/user/task`,
      {
        options: fileURL.map((file) => ({
          beatUrl: file,
        })),
        title,
        signature: "hardcoded-signture",
      },
      {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      }
    );

    router.push(`/task/${response.data.id}`)
  }

  return (
    <div className="w-1/2 h-3/4 p-3 flex flex-col gap-3 bg-[#1F2326] rounded-3xl">
      <div className="text-3xl font-extrabold text-white">Create a Task</div>
      <div className="text-xl flex flex-col gap-2  font-semibold w-3/4">
        <input
          className="input input-bordered input-info w-full max-w-xs"
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          id="task"
          type="text"
          placeholder="What's your task"
        />
      </div>

      <UploadImage2
        updateFileName={updateFileName}
        fileName={fileName}
        updateFileURL={updateFileURL}
        fileURL={fileURL}
      />

      {fileName.map((file, index) => (
        <DisplayFiles key={index} filename={file} size={""} />
      ))}

      <div className="flex justify-between">
        {/* <div className="btn btn-wide text-xl text-white font-bold ">Cancel</div>
         */}
        <button className="px-10 py-2 bg-black text-white rounded-full font-bold transform hover:-translate-y-1 transition duration-400">
          Cancel
        </button>

        <button
          onClick={onSubmit}
          className="px-12 py-4 rounded-full bg-[#1ED760] font-bold text-white tracking-widest uppercase
          transform hover:scale-105 hover:bg-[#21e065] transition-colors duration-200"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default Upload;
