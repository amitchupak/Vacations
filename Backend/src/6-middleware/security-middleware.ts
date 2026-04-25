import { NextFunction, Request, Response } from "express";
import striptags from "striptags";
import { cyber } from "../2-utils/cyber";
import { UnauthorizedError, ForbiddenError } from "../3-models/errors";

// Express middlewares used to protect routes (login required, admin required, etc.).
class SecurityMiddleware {

    // Allow the request only if it has a valid login token.
    public verifyToken(request: Request, response: Response, next: NextFunction): void {
        const token = cyber.extractToken(request);
        if (!cyber.verifyToken(token)) {
            // Pass the error to the error middleware to send a 401 response.
            next(new UnauthorizedError("You are not logged-in."));
            return;
        }
        next();
    }

    // Allow the request only if the user's role is "Admin".
    public verifyAdmin(request: Request, response: Response, next: NextFunction): void {
        const token = cyber.extractToken(request);
        if (!cyber.verifyAdmin(token)) {
            next(new ForbiddenError("You are not authorized."));
            return;
        }
        next();
    }

    // Allow the request only if the user is editing their own data
    // (the :id in the URL must match their userId in the token).
    public verifyMe(request: Request, response: Response, next: NextFunction): void {
        const token = cyber.extractToken(request);
        const tokenUserId = cyber.getTokenUserId(token);
        const routeId = request.params.id;
        if (tokenUserId !== routeId) {
            next(new ForbiddenError("You are not authorized."));
            return;
        }
        next();
    }

    // Remove any HTML/script tags from string fields so attackers can't inject scripts.
    public preventXss(request: Request, response: Response, next: NextFunction): void {
        for (const prop in request.body) {
            const value = request.body[prop];
            if (typeof value === "string") {
                request.body[prop] = striptags(value);
            }
        }
        next();
    }

}

// One shared instance used by the controllers.
export const securityMiddleware = new SecurityMiddleware();
