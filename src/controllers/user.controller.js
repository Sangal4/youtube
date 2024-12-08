import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError,ApiResponse } from "../utils/ApiError.js";
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
  // console.log("Incoming Request Body:", req.body);
  // console.log("Files:", req.files);
  
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

const generateAccessTokenAndRefreshToken= async (userId) => {
        try{
          const user =await User.findById(userId);
          const accessToken= await user.generateAccessToken()
          const refreshToken=await user.generateRefreshToken()
          user.refreshToken=refreshToken;
          user.save({validateBeforeSave : false});
          return {accessToken,refreshToken};

          }
          catch(error){
            throw new ApiError(500,"something went wrong while generating access and refresh tokens");
          }
}

const loginUser =asyncHandler( async (req,res)=>{
        // req -> username , password
       const {username,email,password}=req.body()
       if(!username && !email) throw new ApiError(400,"all fields are required")
       const user=await User.findOne({$or:[{username},{email}]})
      
       if(!user) throw new ApiError(404,"User does not exists")
       
       const isPasswordValid =await user.isPasswordCorrect(password);

      if(!isPasswordValid) throw new ApiError(402,"Invalid credentials");
      const {accessToken,refreshToken}=await generateAccessTokenAndRefreshToken(user._id);
      const loggedInUSer=await User.findById(user_id);

      const options={
        httpOnly:true,
        secure:true
      }
      res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,{
          user:loggedInUSer,accessToken,refreshToken
        },
        "user loggedin successfully"
      )
      )
      

});

const logoutUser = asyncHandler(async (req,res) => {
  req.user.refreshToken=null;
  await req.user.save({validateBeforeSave : false});
  res.clearCookie("accessToken").clearCookie("refreshToken").json(
    new ApiResponse(200, {}, "user logged out successfully")
  );
});

export { registerUser , loginUser, logoutUser };
