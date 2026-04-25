import cors from "cors";
import express from "express";
import { appConfig } from "./2-utils/app-config";
import { authController } from "./5-controllers/auth-controller";
import { vacationController } from "./5-controllers/vacation-controller";
import { likeController } from "./5-controllers/like-controller";
import { reportController } from "./5-controllers/report-controller";
import { aiController } from "./5-controllers/ai-controller";
import { mcpController } from "./5-controllers/mcp-controller";
import { errorMiddleware } from "./6-middleware/error-middleware";
import { securityMiddleware } from "./6-middleware/security-middleware";
import mongoose from "mongoose";

// The whole backend lives here: connect to DB, set up middleware, mount routes, start the server.
class App {

    // Connect to MongoDB, build the Express app, then start listening for requests.
    public async start(): Promise<void> {
        try {
            // Connect to the database first — without it, nothing else works.
            await mongoose.connect(appConfig.mongodbConnectionString);
            console.log("MongoDB connected successfully");

            const server = express();

            // Allow the frontend (different origin) to call this server.
            server.use(cors());
            // Parse JSON request bodies into request.body.
            server.use(express.json());

            // Clean every request body of HTML/script tags to block XSS attacks.
            server.use(securityMiddleware.preventXss);

            // Serve uploaded vacation images at /1-assets/<filename>.
            server.use("/1-assets", express.static(appConfig.imagesLocation));

            // Mount each feature's routes. Order doesn't matter between these.
            server.use(authController.router);
            server.use(vacationController.router);
            server.use(likeController.router);
            server.use(reportController.router);
            server.use(aiController.router);
            server.use(mcpController.router);

            // 404 handler runs when no route above matched.
            server.use(errorMiddleware.routeNotFound);
            // Catch-all error handler must be LAST — it formats every thrown error.
            server.use(errorMiddleware.catchAll);

            server.listen(appConfig.port, () => console.log("Listening on http://localhost:" + appConfig.port));
        }
        catch (error: any) {
            // If the DB connection fails (or any startup error), log it and exit silently.
            console.error(error);
        }
    }
}

const app = new App();
app.start();
