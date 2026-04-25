import express, { Request, Response, Router } from "express";
import path from "path";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";
import { likeService } from "../4-services/like-service";
import { securityMiddleware } from "../6-middleware/security-middleware";
import { appConfig } from "../2-utils/app-config";

// Admin-only: CSV download of "likes per vacation".
class ReportController {
  public router: Router = express.Router();

  public constructor() {
    // Two middlewares: must be logged in AND must be an admin.
    this.router.get("/api/reports/csv", securityMiddleware.verifyToken, securityMiddleware.verifyAdmin, this.getCSVReport);
  }

  // GET /api/reports/csv — build the CSV file, then send it back as a download.
  private async getCSVReport(request: Request, response: Response) {
    // Get the data: { destination, count } per vacation.
    const likesData = await likeService.getLikesCountByVacation();

    // Write the CSV to disk first, then stream it back to the client.
    const reportPath = path.join(appConfig.imagesLocation, "vacations_likes_report.csv");
    const csvWriter = createObjectCsvWriter({
      path: reportPath,
      header: [
        { id: "destination", title: "Destination" },
        { id: "count", title: "Likes" },
      ],
    });

    await csvWriter.writeRecords(likesData);

    // Read the saved CSV and send it back with download headers so the browser saves it.
    const fileContent = fs.readFileSync(reportPath, "utf-8");
    response.setHeader("Content-Type", "text/csv");
    response.setHeader("Content-Disposition", 'attachment; filename="vacations_likes_report.csv"');
    response.send(fileContent);
  }
}

// One shared instance — its router is mounted in app.ts.
export const reportController = new ReportController();
