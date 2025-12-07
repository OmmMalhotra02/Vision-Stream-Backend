import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 2, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const videoObjectId = mongoose.Types.ObjectId(videoId)

    const comments = await Comment.aggregate([
        {
            $match: {
                video: videoObjectId
            }
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "video",
                as: "CommentedVideo"
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "CommentOwner"
            },
            $project: {
                username: 1,
                fullName: 1,
                avatar: 1
            }
        },
        {
            $project: {
                content: 1,
                owner: {
                    $arrayElemAt: ["$CommentOwner", 0]
                },
                video: {
                    $arrayElemAt: ["$CommentedVideo", 0]
                },
                createdAt: 1
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ])

    console.log("Comments", comments);

    if (!comments.length) {
        throw new ApiError(404, "Comments doesn't exist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comments[0],
                "Comments fetched successfully"
            )
        )
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!req.user) {
        throw new ApiError(401, "User should be logged In")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    if (!content) {
        throw new ApiError(400, "Content not found")
    }

    const addedComment = await Comment.create({
        content,
        video: videoId,
        owner: req.user
    })

    if (!addedComment) {
        throw new ApiError(400, "Something went wrong while adding comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                addComment,
                "Comment added successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content) {
        throw new ApiError(400, "Comment body empty")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        {
            _id: commentId,
            owner: req.user?._id,
        },
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    if (!updatedComment) {
        throw new ApiError(500, "Something went wrong while updating the comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "Comment updated successfully"
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const deletedCommentObject = await Comment.findByIdAndDelete(
        {
            owner: req.user?._id,
            _id: commentId
        }
    )

    if(!deletedCommentObject) {
        throw new ApiError(500, "Something went wrong while deleting the comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedCommentObject,
            "Comment deleted successfully"
        )
    )
})

export { getVideoComments, addComment, updateComment, deleteComment }