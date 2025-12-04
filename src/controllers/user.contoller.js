import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshTokens = async (user) => {
    try {
        // const user = await User.findById(userId)

        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        // save refreshToken in user object to db
        user.refreshToken = refreshToken

        // dont validate for required fields while saving for now
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens", error)
    }

}

const registerUser = asyncHandler(async (req, res) => {
    // get user credentials - username, email, password
    // field validations
    // check if user already exists - username, email
    // get coverImage and avatar
    // check if avatar is received
    // upload images to cloudinary
    // create new user object - in db
    // remove password and refreshtoken from response
    // check for user creation
    // return response

    // console.log("Request is", req);
    // console.log("Request is", req.rawHeader, req.url, req.method);

    // user data received. 
    const { username, fullName, email, password } = req.body;

    // to receive files, add upload middleware in route - added

    //field validation
    if (
        [username, fullName, email, password].some((field) => {
            field.trim() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // user pre-existence check
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existingUser) {
        throw new ApiError(401, "User email or username already existed")
    }

    //accessing files - multer middleware has included few more keys in req object
    // console.log("request.files object - ", req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // file upload to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create new User
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    //check user creation and removing password and refreshtoken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering User")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registeres successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // get data req body
    // verify username or email
    // find the user from db
    // verify password 
    // generate access & refresh token
    // send secure cookies and resp

    //get user data    
    const { username, email, password } = req.body

    // verify username/email
    if (!username && !email) {
        throw new ApiError(400, "Username or email not provided")
    }

    /* if any one of them is required then 
    if(!(username || email))*/

    // if credentials entered, get user from db
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User doesn't exist")
    }

    // verify password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "Incorrect Login credentials")
    }

    // access and refresh token generation
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user)

    // re access user as new element - refreshToken is added to the user in above funxtion call
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
        status(200).
        cookie("accessToken", accessToken, options).
        cookie("refreshToken", refreshToken, options).
        json(
            new ApiResponse(
                200,
                {
                    // sending access and refresh token might be required on frontend in few case like mobileDev
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User loggedIn successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
        status(200).
        clearCookie("accessToken", options).
        clearCookie("refreshToken", options).
        json(
            new ApiResponse(200, {}, "User logged Out Successfully")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }
    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        console.log("Decoded refresh toke is ", decodedRefreshToken);

        const user = await User.findById(decodedRefreshToken?._id)

        if (!user) {
            throw new ApiError(402, "Invalid refresh Token")
        }

        if (incomingRefreshToken != user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.
            status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken},
                    "Access Token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    // Take user old and updated password from user
    // verify old Password
    // encrypt it and save it to the User
    // update the user in db with new password

    const {oldPassword, newPassword} = req.body

    if(!oldPassword || !newPassword) {
        throw new ApiError(400, "old or new password is null or missing")
    }

    const user = await User.findById(req?.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Current password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.
    status(200).
    json(
        new ApiResponse(200, user, "User password updated")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.
    status(200).
    json(new ApiResponse(200, req.user, "Current User fetched"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {username, email, fullName} = req.body

    if(!username || !email || !fullName) {
        throw new ApiError(400, "All fields are required")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req?._id, 
        {
            $set: {username, email, fullName}
        }, 
        {new: true} //info after update will be returned
    ).select("-password")

    return res.
    status(200).
    json(
        new ApiResponse(200, updatedUser, "User details updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const updatedAvatarLocalPath = req.file?.path

    if(!updatedAvatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(updatedAvatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading the updated avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.
    status(200).
    json(
        new ApiResponse(200, user, "Avatar updated")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const updatedCoverImageLocalPath = req.file?.path

    if(!updatedCoverImageLocalPath) {
        throw new ApiError(400, "Cover image file missing")
    }

    const coverImage = await uploadOnCloudinary(updatedCoverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading the updated cover Image on cloudinary")
    }

    const user = await User.findOneAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.
    status(200).
    json(
        new ApiResponse(200, user, "cover Image updated")
    )
})

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentUserPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage 
}