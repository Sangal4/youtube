import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";
import { jwt } from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req,res,next)=>{
    try {
        const token = req.cookies.accessToken;
        if(!token) throw new ApiError(401,"unauthorized access");

        const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        if(!decoded) throw new ApiError(401,"unauthorized access");

        const user=await User.findById(decoded._id).select("-password -refreshToken");
        if(!user) throw new ApiError(401,"invalid refresh token");
        req.user = user
        next();

    } catch (error) {
        throw new ApiError(500,"server error")
    }
})