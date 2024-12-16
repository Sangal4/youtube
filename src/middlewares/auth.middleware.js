import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Extract token from cookies or Authorization header
        const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
        if (!token) throw new ApiError(401, "Unauthorized access: Token missing");

        // Verify JWT
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) throw new ApiError(401, "Unauthorized access: Invalid token");

        // Find user and exclude sensitive fields
        const user = await User.findById(decoded._id).select("-password -refreshToken");
        if (!user) throw new ApiError(404, "User not found");

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid token");
        } else if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Token expired");
        }
        console.error("JWT Verification Error:", error);
        throw new ApiError(500, "Server error");
    }
});

export { verifyJWT };
