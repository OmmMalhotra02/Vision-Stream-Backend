import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

/*This middleware will be used verify accessToken validity on every access request from fe to protected API
It will check access toke, verify it, check the presence of User in db from decoded token and add the user to req..
So that controller has the access fo verified user in request part itself*/

// _ instead of res means res was not in use so just production grade practice
export const verifyJWT = asyncHandler(async(req, _, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        // token verification
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        // if user object found, add this new field in req to be accessed at logout
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error)
    }
})  