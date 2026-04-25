import { Like, ILike } from "../3-models/like";
import { ValidationError, ResourceNotFoundError } from "../3-models/errors";

// All "user likes vacation" logic.
class LikeService {

  // Add a like for the given user + vacation. Errors if the like already exists.
  async likeVacation(userId: string, vacationId: string): Promise<ILike> {
    // The DB also has a unique index, but checking first gives a nicer error message.
    const existingLike = await Like.findOne({ userId, vacationId });
    if (existingLike) {
      throw new ValidationError("User has already liked this vacation");
    }

    const like = new Like({ userId, vacationId });
    await like.save();
    return like;
  }

  // Remove a like, or throw 404 if there's nothing to remove.
  async unlikeVacation(userId: string, vacationId: string): Promise<void> {
    const result = await Like.findOneAndDelete({ userId, vacationId });
    if (!result) {
      throw new ResourceNotFoundError(parseInt(vacationId));
    }
  }

  // How many likes does this vacation have in total?
  async getLikeCount(vacationId: string): Promise<number> {
    return Like.countDocuments({ vacationId });
  }

  // True if this user has already liked this vacation.
  async isVacationLiked(userId: string, vacationId: string): Promise<boolean> {
    const like = await Like.findOne({ userId, vacationId });
    return !!like;
  }

  // All likes belonging to one user.
  async getUserLikes(userId: string): Promise<ILike[]> {
    return Like.find({ userId });
  }

  // All likes for one vacation.
  async getVacationLikes(vacationId: string): Promise<ILike[]> {
    return Like.find({ vacationId });
  }

  // Build the admin "likes per vacation" report.
  // Groups likes by vacation id, then joins to the vacations collection to get the destination name.
  async getLikesCountByVacation(): Promise<{ destination: string; count: number }[]> {
    const result = await Like.aggregate([
      // Step 1: count how many likes each vacationId has.
      {
        $group: {
          _id: "$vacationId",
          count: { $sum: 1 },
        },
      },
      // Step 2: join the matching vacation document so we can read its destination.
      {
        $lookup: {
          from: "vacations",
          localField: "_id",
          foreignField: "_id",
          as: "vacation",
        },
      },
      // Step 3: shape the output. Use the id as a fallback if the vacation was deleted.
      {
        $project: {
          _id: 0,
          count: 1,
          destination: {
            $ifNull: [{ $arrayElemAt: ["$vacation.destination", 0] }, { $toString: "$_id" }],
          },
        },
      },
    ]);

    return result;
  }
}

// One shared instance used by the controllers.
export const likeService = new LikeService();
