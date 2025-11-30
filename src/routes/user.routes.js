import { Router } from "express"
import {registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.contoller.js"
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

// At logout, browser automatically send the ookies sent by server in response at logout time, so we can now access cookies in request at logout in middleware
router.route('/logout').post(verifyJWT, logoutUser)

router.route('/refresh-access').post(refreshAccessToken)

export default router