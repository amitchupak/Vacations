import express, { Request, Response, Router } from "express";
import { authService } from "../4-services/auth-service";
import { cyber } from "../2-utils/cyber";
import { securityMiddleware } from "../6-middleware/security-middleware";
import { StatusCode } from "../3-models/enums";

// Auth routes: register and login are public, /me requires a valid token.
class AuthController {
  public router: Router = express.Router();

  public constructor() {
    this.router.post("/api/auth/register", this.register);
    this.router.post("/api/auth/login", this.login);
    // verifyToken middleware blocks the request if the user isn't logged in.
    this.router.get("/api/auth/me", securityMiddleware.verifyToken, this.getCurrentUser);
  }

  // POST /api/auth/register — make a new account and send back the user + login token.
  private async register(request: Request, response: Response) {
    const result = await authService.register(request.body);
    response.status(StatusCode.Created).json(result);
  }

  // POST /api/auth/login — check email + password and send back the user + login token.
  private async login(request: Request, response: Response) {
    const result = await authService.login(request.body.email, request.body.password);
    response.status(StatusCode.OK).json(result);
  }

  // GET /api/auth/me — answer "who am I?" using the userId stored in the token.
  private async getCurrentUser(request: Request, response: Response) {
    const userId = cyber.getTokenUserId(cyber.extractToken(request));
    const user = await authService.getUserById(userId);
    response.status(StatusCode.OK).json(user);
  }
}

// One shared instance — its router is mounted in app.ts.
export const authController = new AuthController();
