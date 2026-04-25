import express, { Request, Response, Router } from "express";
import { aiRecommendationService } from "../4-services/ai-service";
import { securityMiddleware } from "../6-middleware/security-middleware";
import { StatusCode } from "../3-models/enums";

// AI travel-tips endpoint. Requires login.
class AIController {
  public router: Router = express.Router();

  public constructor() {
    this.router.post("/api/ai/recommendation", securityMiddleware.verifyToken, this.getAIRecommendation);
  }

  // POST /api/ai/recommendation — get AI-generated travel tips for a destination.
  private async getAIRecommendation(request: Request, response: Response) {
    const { destination } = request.body;
    const recommendation = await aiRecommendationService.getRecommendation(destination);
    response.status(StatusCode.OK).json({ recommendation });
  }
}

// One shared instance — its router is mounted in app.ts.
export const aiController = new AIController();
