import { Router } from "express";
import { userProfile,registerUser,loginUser,logoutUser,refreshAccessToken,updatePassword } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";
const router=Router()

// router.route("/register").post(upload.single("file"), registerUser);
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )
// secured routes
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT ,logoutUser)
router.route("/refreshAccessToken").post(refreshAccessToken)
router.route("/updatePassword").put(verifyJWT,updatePassword)
router.route("/currentUser").get(verifyJWT,userProfile)
// router.route("/register").post( registerUser)

export default router;

