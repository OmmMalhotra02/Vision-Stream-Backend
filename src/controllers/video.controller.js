import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteOldAsset, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllUserVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query
    //TODO: get all videos based on query, sort, pagination

    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(400, "User Id not recieved")
    }


    const ownerId = new mongoose.Types.ObjectId(userId)

    const videos = await Video.aggregate([
        {
            $match: {
                owner: ownerId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerUser"
            }
        },
        {
            $unwind: "$ownerUser"
        },
        {
            $project: {
                title: 1,
                thumbnail: 1,
                views: 1,
                createdAt: 1,
                "ownerUser.username": 1,
                "ownerUser.fullName": 1,
                "ownerUser.avatar": 1
            }
        },
        {
            $sort: {
                [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        }
    ])

    // console.log(videos);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "All videos fetched successfully"
            )
        )
})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query
    //TODO: get all videos based on query, sort, pagination

    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(400, "User Id not recieved")
    }


    // const ownerId = new mongoose.Types.ObjectId(userId)

    const videos = await Video.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerUser"
            }
        },
        {
            $unwind: "$ownerUser"
        },
        {
            $project: {
                title: 1,
                thumbnail: 1,
                videoFile: 1,
                views: 1,
                createdAt: 1,
                "ownerUser.username": 1,
                "ownerUser.fullName": 1,
                "ownerUser.avatar": 1
            }
        },
        {
            $sort: {
                [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        }
    ])

    // console.log(videos);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "All videos fetched successfully"
            )
        )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(400, "Title or description is missing")
    }

    const currentUser = req.user?._id

    // console.log("req.files:", req.files);

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(501, "Video file or thumbnail file path not found")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile?.url || !thumbnail?.url) {
        throw new ApiError(500, "Cloudinary upload failed");
    }

    const newVideo = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: currentUser,
        title,
        description,
        duration: videoFile.duration
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newVideo,
                "Video uploaded successfully"
            )
        )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError("Video Id not received")
    }

    const video = await Video.findById(videoId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video fetched succesfully via videoId"
            )
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    //TODO: update video details like title, description, thumbnail

    if (!videoId) {
        throw new ApiError(401, "Video Id not received")
    }

    // if (!title || !description) {
    //     throw new ApiError(401, "Title or Description missing")
    // }

    // console.log(req.file);
    const thumbnailPath = req.file?.path


    if (!thumbnailPath) {
        throw new ApiError(501, "thumbnail path not found on multer")
    }

    const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath)

    if (!uploadedThumbnail?.url) {
        throw new ApiError(500, "Thumbnail upload to Cloudinary failed");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: uploadedThumbnail.url
            }
        },
        {
            new: true
        }
    )

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Updated successfully"
            )
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const userId = req.user?._id

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
    }

    const video = await Video.findById(videoId)

    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video");
    }

    // console.log(video);

    await Video.deleteOne({ _id: videoId });

    await deleteOldAsset(video.videoFile)
    await deleteOldAsset(video.thumbnail)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video Deleted successfully"
            )
        );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found for corresponding VideoId")
    }

    const toggleStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                toggleStatus,
                "Publish status toggled and updated"
            )
        )

})

export {
    getAllUserVideos,
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}