import mongoose from "mongoose"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const existingLike = await Like.findOne(
        {
            video: videoId,
            likedBy: req.user?._id
        }
    )

    if (!existingLike) {
        const liked = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    liked,
                    "Video Liked successfully"
                )
            )
    }

    const disliked = await Like.findByIdAndDelete(
        existingLike?._id
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                disliked,
                "Video disliked successfully"
            )
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!commentId) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const existingLike = await Like.findOne(
        {
            comment: commentId,
            likedBy: req.user?._id
        }
    )

    if (!existingLike) {
        const liked = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    liked,
                    "Comment Liked successfully"
                )
            )
    }

    const disliked = await Like.findOneAndDelete(existingLike?._id)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                disliked,
                "Comment disliked successfully"
            )
        )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user?._id
    if (!tweetId) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        return res
            .status(200)
            .json(new ApiResponse(200, existingLike, "Tweet unliked successfully"));
    }

    const likeTweet = await Like.create({
        tweet: tweetId,
        likedBy: userId,
    });
    return res
        .status(201)
        .json(new ApiResponse(201, likeTweet, "Tweet liked successfully"));

})

const getLikedVideos = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const likedVideo = await Like.find({
        likedBy: userId,
        video: { $exists: true }
    }).populate("video", "_id, title, url")

    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideo, "Liked videos fetched successfully")
        );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}