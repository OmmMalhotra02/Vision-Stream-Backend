import { Router } from "express"
import {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentUserPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory 
} from "../controllers/user.controller.js"
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

// file acceptance from frontend req

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 }, 
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// At logout, browser automatically send the cookies sent by server in response at logout time, so we can now access cookies in request at logout in middleware
router.route('/logout').post(verifyJWT, logoutUser)

router.route('/refresh-access').post(refreshAccessToken)

router.route('/change-password').post(verifyJWT, changeCurrentUserPassword)

router.route('/user-details').get(verifyJWT, getCurrentUser)

router.route('/update-acoount-details').patch(verifyJWT, updateAccountDetails)

router.route('/update-avatar').patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
)

router.route('/update-cover-image').patch(
    verifyJWT,
    upload.fields("coverImage"),
    updateUserCoverImage
)

// username from params is being accessed
router.route('/channel/:username').get(verifyJWT, getUserChannelProfile)

router.route('/watch-history').get(verifyJWT, getWatchHistory)

export default router