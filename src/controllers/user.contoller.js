import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

    console.log(`request is ${req}`);

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
    const existingUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if(existingUser) {
        throw new ApiError(401, "User email or username already existed")
    }

    //accessing files - multer middleware has included few more keys in req object
    console.log(`request.files object - ${req.files}`);
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // file upload to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
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

    //chec user creation and removing password and refreshtoken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering User")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registeres successfully")
    )
})

export default registerUser