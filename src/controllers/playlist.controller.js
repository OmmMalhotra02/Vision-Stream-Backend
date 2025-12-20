import mongoose from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating the playlist");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                playlist,
                "Playlist created successfully"
            )
        );
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({ owner: new mongoose.Types.ObjectId(userId) })

    if (!playlists || playlists.length === 0) {
        return new ApiResponse(404, playlists, "No playlists found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlists,
                playlists.length
                    ? "User playlists fetched successfully"
                    : "No playlists found")
        );
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    // const playlist = await Playlist.findById(playlistId).populate("videos")
    const playlist = await Playlist.findById(playlistId)


    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
})

const getAllPlaylist = asyncHandler(async (req, res) => {
    const allPlaylists = await Playlist.find({})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            allPlaylists,
            "All playlists fetched"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist.owner.equals(req.user?._id)) {
        throw new ApiError(400, "Only Owner is allowed to edit their playlist")
    }

    const updatedPlaylist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $addFields: {
                videos: {
                    $setUnion: ["$videos", [new mongoose.Types.ObjectId(videoId)]]
                }
            }
        },
        {
            $merge: {
                into: "playlists"
            }
        }
    ])

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found or video already added");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video added to playlist successfully"
            )
        );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(400, "Only Owner is allowed to edit their playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: new mongoose.Types.ObjectId(videoId),
            }
        },
        { new: true }
    )

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video removed from playlist successfully"
            )
        );

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(400, "Only Owner is allowed to edit their playlist")
    }

    const deletedPlaylistDoc = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylistDoc) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedPlaylistDoc, "Playlist deleted successfully")
        );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!playlistId) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId)
    if (req.user._id.toString() != playlist.owner.toString()) {
        throw new ApiError(400, "Only Owner is allowed to edit their playlist")
    }

    if (!name || !description) {
        throw new ApiError(400, "Name or description cannot be empty");
    }

    const updatedPlaylistDoc = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedPlaylistDoc) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylistDoc, "Playlist updated successfully")
        );
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getAllPlaylist
}