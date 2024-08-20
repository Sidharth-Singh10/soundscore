"use client"
import axios from 'axios';
import React, { useState } from 'react'
import { BACKEND_URL, CLOUDFRONT_URL } from '@/Utils/Utils';



const UploadImage2 = ({ updateFileName, fileName, updateFileURL, fileURL }:
    {
        updateFileName: (newImages: string[]) => void,
        fileName: string[],
        updateFileURL: (newImages: string[]) => void,
        fileURL: string[],
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

            const response = await axios.post(`${BACKEND_URL}/v1/user/presignedURL`, { filename });
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

            // updateFileURL([`https://soundscorebucket.s3.ap-south-1.amazonaws.com/${response.data.fields["key"]}`]);
            console.log(`https://soundscorebucket.s3.ap-south-1.amazonaws.com/${response.data.fields["key"]}`);
        }
        catch (e) {
            console.log(e);
        }
        setUploading(false);

    }







    return (
        <div className='w-full relative btn btn-ghost rounded-3xl h-1/2 flex flex-col items-center gap-2 justify-center bg-[#363636] border border-[#4a4949] border-dashed '>
            <input
                type="file"
                onChange={onFileSelect}
                id="fileInput"
                className=' absolute h-full w-full  opacity-0  cursor-pointer'
            />
            <div className='img'>
                <img src="fileIcon.png" alt="" />
            </div>
            <div className='text-white text-xl font-bold'>
                Drop your file or <span className='text-green-900 font-bold' >Click </span>  to Browse
            </div>

        </div>
    )
}

export default UploadImage2