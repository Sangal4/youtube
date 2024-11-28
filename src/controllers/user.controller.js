import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Utility function for field validation
const validateFields = (fields) => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) {
      console.error(`Missing field: ${key}`, { requestBody: fields });
      throw new ApiError(400, `${key} is required`);
    }
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;
  console.log("Incoming Request Body:", req.body);
  console.log("Files:", req.files);
  
  // Validate required fields
  validateFields({ fullName, username, password, email });

  // Check if user with same username or email already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new ApiError(409, "User with same username or email already exists");
  }

  // Handle avatar upload
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(400, "Failed to upload avatar");
  }

  // Handle optional cover image upload
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path || "";
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  // Create user in database
  const createdUser = await User.create({
    username,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
  });

  // Select user fields excluding sensitive data
  const user = await User.findById(createdUser._id).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(500, "Failed to register user");
  }

  // Respond with success message
  res.status(201).json({ message: "User registered successfully", user });
});

export { registerUser };
