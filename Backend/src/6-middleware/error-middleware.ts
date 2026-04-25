import { NextFunction, Request, Response } from "express";
import { appConfig } from "../2-utils/app-config";
import { RouteNotFoundError } from "../3-models/errors";
import { StatusCode } from "../3-models/enums";

// Catches any thrown errors and turns them into clean JSON responses.
class ErrorMiddleware {

    // Last-stop handler: log the real error, then send a sanitized one to the client.
    public catchAll(error: any, request: Request, response: Response, next: NextFunction) {
        console.error(error);
        // Use the error's status if it has one, otherwise treat as a 500.
        const status = error.status || StatusCode.InternalServerError;
        const isServerError = status >= 500 && status <= 599;
        // In production we never leak the real server-error message — it could expose internals.
        const message = appConfig.isProduction && isServerError
            ? "Some error, please try again."
            : error.message;
        response.status(status).json({ message });
    }

    // If no route matched, throw a 404 so catchAll can format it nicely.
    public routeNotFound(request: Request, response: Response, next: NextFunction) {
        next(new RouteNotFoundError(request.originalUrl, request.method));
    }

}

// One shared instance — registered in app.ts.
export const errorMiddleware = new ErrorMiddleware();
