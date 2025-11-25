import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {resource_type: 'auto'})

        console.log("response on uploading file in cloudinary ", response);
        
        console.log("File uploaded on cloudinary ", response.url);
        return response;

    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return null;
    } finally {
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
    }
}

export {uploadOnCloudinary}