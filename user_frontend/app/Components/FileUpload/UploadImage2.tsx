"use client";
import axios from "axios";
import React, { useState } from "react";
import { BACKEND_URL, CLOUDFRONT_URL } from "@/Utils/Utils";
import { FileUpload } from "@/components/ui/file-upload";

const UploadImage2 = ({
  updateFileName,
  fileName,
  updateFileURL,
  fileURL,
}: {
  updateFileName: (newImages: string[]) => void;
  fileName: string[];
  updateFileURL: (newImages: string[]) => void;
  fileURL: string[];
}) => {
  const [uploading, setUploading] = useState(false);
  // function onCheck(){
  //   console.log(CLOUDFRONT_URL);
  // }

  async function onFileSelect(e: any) {
    try {
      console.log("HEELO");
      console.log(e.target.files[0]);
      const file = e.target.files[0];
      const filename = file.name;
      // console.log(filename);
      updateFileName([filename]);
      setUploading(true);
      console.log("token is ", localStorage.getItem("token"));
      console.log(`BackendURL is ${BACKEND_URL} `);



      const response = await axios.post(
        `${BACKEND_URL}/v1/user/presignedURL`,
        {
          filename,
        },
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );
      console.log("preResponse is ", response);

      const presignedUrl = response.data.preSignedUrl;
      const fields = response.data.fields;
      const formData = new FormData();
      formData.append("bucket", fields.bucket);
      formData.append("X-Amz-Algorithm", fields["X-Amz-Algorithm"]);
      formData.append("X-Amz-Credential", fields["X-Amz-Credential"]);
      formData.append("X-Amz-Date", fields["X-Amz-Date"]);
      formData.append("key", fields.key);
      formData.append("Policy", fields.Policy);
      formData.append("X-Amz-Signature", fields["X-Amz-Signature"]);
      formData.append("file", file);

      const awsResponse = await axios.post(presignedUrl, formData);
      console.log(awsResponse);
      // console.log(response.data.key);

      updateFileURL([`${CLOUDFRONT_URL}/${response.data.fields["key"]}`]);
      console.log(`${CLOUDFRONT_URL}/${response.data.fields["key"]}`);
    } catch (e) {
      console.log(e);
    }
    setUploading(false);
  }

  return (
    <div className="w-full max-w-4xl relative  mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
     <input
        type="file"
        onChange={onFileSelect}
        id="fileInput"
        className="relative top-0 left-0 h-full w-full z-10 opacity-0 cursor-pointer border border-green-800"
      />
      <div className="absolute top-0 left-0 h-full w-full z-5">
      <FileUpload />
      </div>
     
    </div>
  );
};

export default UploadImage2;
