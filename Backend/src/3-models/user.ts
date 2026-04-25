import mongoose from "mongoose";

// Shape of a user document stored in MongoDB.
interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  // Hashed password — we never store the original.
  password: string;
  role: "User" | "Admin";
}

// Mongoose schema = the rules for validating each user document.
const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      // Each email can only be used once.
      unique: true,
      // Always save emails in lowercase so logins aren't case-sensitive.
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [4, "Password must be at least 4 characters"],
      // Hide the password by default — we only fetch it explicitly when checking login.
      select: false,
    },
    role: {
      type: String,
      enum: ["User", "Admin"],
      // New accounts start as regular users.
      default: "User",
    },
  },
  // Skip the auto "__v" field Mongoose adds; we don't use it.
  { versionKey: false }
);

// The model — used like User.find(), User.create(), etc.
export const User = mongoose.model<IUser>("User", userSchema);

export type { IUser };
