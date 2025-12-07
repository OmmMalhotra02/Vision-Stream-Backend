import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {resource_type: 'auto'})

        // console.log("response on uploading file in cloudinary ", response);
        
        // console.log("File uploaded on cloudinary ", response.url);
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

const deleteOldImage = async (imagePath) => {
    try {
        //get Public ID from URL
        const parts = imagePath.split('/');
        const filename = parts[parts.length - 1]; 
        const publicId = filename.split('.')[0];
        // console.log(publicId);

        const result = await cloudinary.uploader.destroy(publicId)
        console.log('Deletion result:', result);
        if (result.result === 'ok') {
            console.log(`Image with public ID ${imagePath} deleted successfully.`);
            return true;
        } else {
            console.error(`Failed to delete image with public ID ${imagePath}. Result:`, result.result);
            return false;
        }
    } catch (error) {
        console.log("Avatar deletion failed", error);
        return false;
    }
}

export {uploadOnCloudinary, deleteOldImage}