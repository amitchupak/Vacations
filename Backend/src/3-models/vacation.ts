import mongoose from "mongoose";

// Shape of a vacation document stored in MongoDB.
interface IVacation {
  destination: string;
  description: string;
  startDate: Date;
  endDate: Date;
  price: number;
  // The uploaded image is saved on disk; we just store its filename here.
  imageName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose schema = the rules each vacation document has to follow.
const vacationSchema = new mongoose.Schema<IVacation>(
  {
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      max: [10000, "Price cannot exceed 10,000"],
    },
    imageName: {
      type: String,
      required: [true, "Image name is required"],
    },
  },
  { versionKey: false }
);

// The model — used like Vacation.find(), Vacation.create(), etc.
export const Vacation = mongoose.model<IVacation>("Vacation", vacationSchema);

export type { IVacation };
