import mongoose from "mongoose";

// One row = "this user liked this vacation".
interface ILike {
  userId: mongoose.Types.ObjectId;
  vacationId: mongoose.Types.ObjectId;
  createdAt?: Date;
}

// Mongoose schema for the "likes" collection.
const likeSchema = new mongoose.Schema<ILike>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    vacationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vacation",
      required: [true, "Vacation ID is required"],
    },
  },
  { versionKey: false }
);

// Make sure the same user can't like the same vacation twice.
likeSchema.index({ userId: 1, vacationId: 1 }, { unique: true });

// The model — used like Like.find(), Like.create(), etc.
export const Like = mongoose.model<ILike>("Like", likeSchema);
export type { ILike };
