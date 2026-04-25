import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { Request } from "express";
import { appConfig } from "./app-config";
import { Role } from "../3-models/enums";
import { IUser } from "../3-models/user";

// Helpers for password hashing and JWT tokens.
// Keeping these in one place means the rest of the app doesn't need to know the details.
class Cyber {

    // Turn a plain password into a safe-to-store hash.
    // We add an app-wide salt so even leaked hashes are extra hard to crack.
    public async hash(plainText: string): Promise<string> {
        return bcrypt.hash(plainText + appConfig.hashSalt, 10);
    }

    // Check if a typed-in password matches the stored hash.
    public async compare(plainText: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(plainText + appConfig.hashSalt, hashed);
    }

    // Build a login token (JWT) that holds the user's id, email and role. Valid for 7 days.
    public generateToken(user: IUser & { _id: any }): string {
        const payload = {
            user: {
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
            },
        };
        const options: SignOptions = { expiresIn: "7d" };
        return jwt.sign(payload, appConfig.jwtSecret, options);
    }

    // Read the token out of the "Authorization: Bearer <token>" header.
    public extractToken(request: Request): string {
        const authorization = request.headers.authorization;
        return authorization?.substring(7) ?? "";
    }

    // True if the token is real and not expired.
    public verifyToken(token: string): boolean {
        try {
            if (!token) return false;
            jwt.verify(token, appConfig.jwtSecret);
            return true;
        }
        catch {
            return false;
        }
    }

    // True if the token is valid AND belongs to an Admin user.
    public verifyAdmin(token: string): boolean {
        try {
            if (!token) return false;
            jwt.verify(token, appConfig.jwtSecret);
            const payload = jwt.decode(token) as { user: { role: Role } };
            return payload.user.role === Role.Admin;
        }
        catch {
            return false;
        }
    }

    // Pull the userId out of the token (or empty string if it can't be read).
    public getTokenUserId(token: string): string {
        try {
            const payload = jwt.decode(token) as { user: { userId: string } };
            return payload.user.userId;
        }
        catch {
            return "";
        }
    }

}

// One shared instance used across the app.
export const cyber = new Cyber();
