import dotenv from "dotenv";
import path from "path";

// Load values from the .env file into process.env (without yelling about missing files).
dotenv.config({ quiet: true, override: false });

// All app-wide settings in one place. Values can come from .env, otherwise we use safe defaults.
class AppConfig {

    // "development" or "production" — controls a few behaviours (logs, errors, etc.).
    public readonly environment = process.env.ENVIRONMENT;
    public readonly isDevelopment = this.environment === "development";
    public readonly isProduction = this.environment === "production";

    // Which port the Express server listens on.
    public readonly port = Number(process.env.PORT) || 4001;

    // MongoDB address. Falls back to a local DB called "vacations".
    public readonly mongodbConnectionString =
        process.env.MONGODB_CONNECTION_STRING ||
        process.env.MONGO_CONNECTION_STRING ||
        "mongodb://127.0.0.1:27017/vacations";

    // Folder where uploaded vacation images are saved.
    // Absolute path so it works the same when running from src/ (ts-node) or build/ (compiled).
    public readonly imagesLocation = path.resolve(process.cwd(), "src/1-assets");

    // Secret used to sign JWT tokens — keep this safe in production.
    public readonly jwtSecret = process.env.JWT_SECRET || "secret_key";
    // Extra string mixed into password hashes to make them harder to crack.
    public readonly hashSalt = process.env.HASH_SALT || "default_salt";

}

// One shared config object used everywhere.
export const appConfig = new AppConfig();
