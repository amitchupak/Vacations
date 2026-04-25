import express, { Request, Response, Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { vacationService } from "../4-services/vacation-service";
import { cyber } from "../2-utils/cyber";
import { securityMiddleware } from "../6-middleware/security-middleware";
import { appConfig } from "../2-utils/app-config";
import { StatusCode } from "../3-models/enums";


// Make sure the uploads folder exists before multer tries to write to it.
const uploadsDir = appConfig.imagesLocation;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Tell multer where to save uploaded images and how to name them.
const storage = multer.diskStorage({
  destination: (request, file, callback) => callback(null, uploadsDir),
  filename: (request, file, callback) => {
    // Add a timestamp + random number so two uploads can never overwrite each other.
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


// Vacation routes. Reads need login; writes need admin.
class VacationController {
  public router: Router = express.Router();

  public constructor() {
    this.router.get("/api/vacations", securityMiddleware.verifyToken, this.getVacations);
    this.router.get("/api/vacations/filter/:type", securityMiddleware.verifyToken, this.getFilteredVacations);
    this.router.get("/api/vacations/:id", securityMiddleware.verifyToken, this.getVacationById);
    // upload.single("image") parses the uploaded file from multipart/form-data.
    this.router.post("/api/vacations", securityMiddleware.verifyToken, securityMiddleware.verifyAdmin, upload.single("image"), this.createVacation);
    this.router.put("/api/vacations/:id", securityMiddleware.verifyToken, securityMiddleware.verifyAdmin, upload.single("image"), this.updateVacation);
    this.router.delete("/api/vacations/:id", securityMiddleware.verifyToken, securityMiddleware.verifyAdmin, this.deleteVacation);
  }

  // GET /api/vacations — get a page of vacations (defaults: page 1, 9 per page).
  private async getVacations(request: Request, response: Response) {
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 9;
    const result = await vacationService.getAllVacations(page, limit);
    response.status(StatusCode.OK).json(result);
  }

  // GET /api/vacations/filter/:type — list filtered by liked / active / upcoming / all.
  private async getFilteredVacations(request: Request, response: Response) {
    const filter = request.params.type as "liked" | "active" | "upcoming" | "all";
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 9;
    // For "liked" we need to know which user is asking — pull it from the token.
    const userId = cyber.getTokenUserId(cyber.extractToken(request));
    const result = await vacationService.getVacationsByFilter(page, limit, filter, userId);
    response.status(StatusCode.OK).json(result);
  }

  // GET /api/vacations/:id — get one vacation.
  private async getVacationById(request: Request, response: Response) {
    const result = await vacationService.getVacationById(request.params.id);
    response.status(StatusCode.OK).json(result);
  }

  // POST /api/vacations — admin creates a new vacation with an uploaded image.
  private async createVacation(request: Request, response: Response) {
    // The filename multer assigned to the uploaded image (or empty if missing).
    const imageName = request.file?.filename || "";
    const result = await vacationService.createVacation({
      ...request.body,
      imageName,
      // Form data arrives as strings — convert to proper Date and number.
      startDate: new Date(request.body.startDate),
      endDate: new Date(request.body.endDate),
      price: parseFloat(request.body.price),
    });
    response.status(StatusCode.Created).json(result);
  }

  // PUT /api/vacations/:id — admin edits a vacation. Only sent fields get updated.
  private async updateVacation(request: Request, response: Response) {
    const updateData: any = { ...request.body };
    if (request.body.startDate) updateData.startDate = new Date(request.body.startDate);
    if (request.body.endDate) updateData.endDate = new Date(request.body.endDate);
    if (request.body.price) updateData.price = parseFloat(request.body.price);
    // Only replace the image if a new one was uploaded.
    if (request.file) updateData.imageName = request.file.filename;

    const result = await vacationService.updateVacation(request.params.id, updateData);
    response.status(StatusCode.OK).json(result);
  }

  // DELETE /api/vacations/:id — admin removes a vacation. The service also deletes its likes.
  private async deleteVacation(request: Request, response: Response) {
    await vacationService.deleteVacation(request.params.id);
    response.status(StatusCode.OK).json({ message: "Vacation deleted successfully" });
  }
}

// One shared instance — its router is mounted in app.ts.
export const vacationController = new VacationController();
