import express, { Request, Response, Router } from "express";
import { likeService } from "../4-services/like-service";
import { cyber } from "../2-utils/cyber";
import { securityMiddleware } from "../6-middleware/security-middleware";
import { StatusCode } from "../3-models/enums";

// Like / unlike / count / "did I like it?" routes. All require login.
class LikeController {
  public router: Router = express.Router();

  public constructor() {
    this.router.post("/api/likes/:vacationId", securityMiddleware.verifyToken, this.likeVacation);
    this.router.delete("/api/likes/:vacationId", securityMiddleware.verifyToken, this.unlikeVacation);
    this.router.get("/api/likes/count/:vacationId", securityMiddleware.verifyToken, this.getLikeCount);
    this.router.get("/api/likes/check/:vacationId", securityMiddleware.verifyToken, this.isLiked);
  }

  // POST /api/likes/:vacationId — the logged-in user likes a vacation.
  private async likeVacation(request: Request, response: Response) {
    // Get who's asking from their JWT.
    const userId = cyber.getTokenUserId(cyber.extractToken(request));
    const result = await likeService.likeVacation(userId, request.params.vacationId);
    response.status(StatusCode.Created).json(result);
  }

  // DELETE /api/likes/:vacationId — the logged-in user removes their like.
  private async unlikeVacation(request: Request, response: Response) {
    const userId = cyber.getTokenUserId(cyber.extractToken(request));
    await likeService.unlikeVacation(userId, request.params.vacationId);
    response.status(StatusCode.OK).json({ message: "Like removed successfully" });
  }

  // GET /api/likes/count/:vacationId — how many likes does this vacation have?
  private async getLikeCount(request: Request, response: Response) {
    const count = await likeService.getLikeCount(request.params.vacationId);
    response.status(StatusCode.OK).json({ count });
  }

  // GET /api/likes/check/:vacationId — has the current user already liked this vacation?
  private async isLiked(request: Request, response: Response) {
    const userId = cyber.getTokenUserId(cyber.extractToken(request));
    const isLiked = await likeService.isVacationLiked(userId, request.params.vacationId);
    response.status(StatusCode.OK).json({ isLiked });
  }
}

// One shared instance — its router is mounted in app.ts.
export const likeController = new LikeController();
