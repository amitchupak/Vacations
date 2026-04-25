import { Vacation, IVacation } from "../3-models/vacation";
import { ResourceNotFoundError, ValidationError } from "../3-models/errors";
import { Like } from "../3-models/like";

// Handles all vacation-related logic: list, get one, create, update, delete, filter.
class VacationService {

  // Get one page of vacations sorted by start date.
  async getAllVacations(page: number = 1, limit: number = 9): Promise<{ vacations: IVacation[]; total: number; pages: number }> {
    // How many to skip = (page - 1) * limit. Page 1 skips 0, page 2 skips 9, etc.
    const skip = (page - 1) * limit;
    const vacations = await Vacation.find()
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);
    const total = await Vacation.countDocuments();
    const pages = Math.ceil(total / limit);

    return { vacations, total, pages };
  }

  // Get one vacation by id, or throw 404 if it doesn't exist.
  async getVacationById(id: string): Promise<IVacation> {
    const vacation = await Vacation.findById(id);
    if (!vacation) {
      throw new ResourceNotFoundError(parseInt(id));
    }
    return vacation;
  }

  // Create a new vacation after checking the dates make sense.
  async createVacation(vacationData: Partial<IVacation>): Promise<IVacation> {
    // Don't allow vacations starting in the past.
    if (new Date(vacationData.startDate!) < new Date()) {
      throw new ValidationError("Start date cannot be in the past");
    }
    // The trip has to last at least one full day.
    if (new Date(vacationData.endDate!) <= new Date(vacationData.startDate!)) {
      throw new ValidationError("End date must be after start date");
    }

    const vacation = new Vacation(vacationData);
    await vacation.save();
    return vacation;
  }

  // Update an existing vacation. Throws 404 if there's no vacation with that id.
  async updateVacation(id: string, vacationData: Partial<IVacation>): Promise<IVacation> {
    // If both dates were sent, make sure end is still after start.
    if (vacationData.endDate && vacationData.startDate) {
      if (new Date(vacationData.endDate) <= new Date(vacationData.startDate)) {
        throw new ValidationError("End date must be after start date");
      }
    }

    const vacation = await Vacation.findByIdAndUpdate(id, vacationData, {
      // Return the updated doc, not the old one.
      new: true,
      // Re-run schema validation against the new values.
      runValidators: true,
    });

    if (!vacation) {
      throw new ResourceNotFoundError(parseInt(id));
    }

    return vacation;
  }

  // Delete a vacation and clean up any likes pointing to it.
  async deleteVacation(id: string): Promise<void> {
    const vacation = await Vacation.findByIdAndDelete(id);
    if (!vacation) {
      throw new ResourceNotFoundError(parseInt(id));
    }

    // Remove orphaned likes so we don't leave junk in the database.
    await Like.deleteMany({ vacationId: id });
  }

  // Get vacations matching one of the filter buttons (all / liked / active / upcoming).
  async getVacationsByFilter(
    page: number = 1,
    limit: number = 9,
    filter: "liked" | "active" | "upcoming" | "all" = "all",
    userId?: string
  ): Promise<{ vacations: IVacation[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    let query: any = {};
    const now = new Date();

    // Build the right Mongo query based on the filter.
    switch (filter) {
      case "liked":
        // "Show me only vacations I liked".
        if (!userId) throw new ValidationError("User ID required for liked filter");
        const likedVacations = await Like.find({ userId });
        const vacationIds = likedVacations.map((like) => like.vacationId);
        query._id = { $in: vacationIds };
        break;
      case "active":
        // Currently happening (started but not ended yet).
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
        break;
      case "upcoming":
        // Hasn't started yet.
        query.startDate = { $gt: now };
        break;
      case "all":
      default:
        // No filter — show everything.
        break;
    }

    const vacations = await Vacation.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);
    const total = await Vacation.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return { vacations, total, pages };
  }
}

// One shared instance used by the controllers.
export const vacationService = new VacationService();
