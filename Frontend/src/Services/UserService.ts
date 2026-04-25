import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { UserModel } from "../Models/UserModel";
import { CredentialsModel } from "../Models/CredentialsModel";
import { appConfig } from "../Utils/AppConfig";

// Server response when login or register succeeds.
type AuthResponse = { user: UserModel; token: string };

// What we expect to find inside the JWT we get back.
type TokenPayload = { user: { userId: string; email: string; role: "User" | "Admin" } };

// Keys we use in localStorage so the user stays logged in after refresh.
const TOKEN_KEY = "token";
const USER_KEY = "user";

// Custom event we fire when the logged-in user changes (login/logout/refresh).
const USER_CHANGED_EVENT = "user-changed";

// Handles everything about the logged-in user: login, register, logout, and reading user info.
class UserService {

    // Send a register request and save the new user + token.
    public async register(user: UserModel): Promise<void> {
        const response = (await axios.post<AuthResponse>(appConfig.registerUrl, user)).data;
        this.persistAuth(response.token, response.user);
    }

    // Send a login request and save the user + token.
    public async login(credentials: CredentialsModel): Promise<void> {
        const response = (await axios.post<AuthResponse>(appConfig.loginUrl, credentials)).data;
        this.persistAuth(response.token, response.user);
    }

    // Forget the user so they're logged out on this device.
    public logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.dispatchEvent(new Event(USER_CHANGED_EVENT));
    }

    // Ask the server "who am I?" and update what we have stored.
    public async getMe(): Promise<UserModel> {
        const user = (await axios.get<UserModel>(appConfig.meUrl)).data;
        const merged = { ...this.getUser(), ...user };
        localStorage.setItem(USER_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event(USER_CHANGED_EVENT));
        return merged;
    }

    // Get the saved login token (or null if not logged in).
    public getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    // Get the saved user info. Falls back to reading the token if user object is missing.
    public getUser(): UserModel | null {
        const stored = localStorage.getItem(USER_KEY);
        if (stored) return JSON.parse(stored) as UserModel;

        const token = this.getToken();
        if (!token) return null;

        // Decode the token to pull basic info out of it.
        try {
            const payload = jwtDecode<TokenPayload>(token).user;
            return { _id: payload.userId, userId: payload.userId, email: payload.email, role: payload.role };
        } catch {
            return null;
        }
    }

    // Quick check used by buttons/menus to show admin-only options.
    public isAdmin(): boolean {
        return this.getUser()?.role === "Admin";
    }

    // Lets components react when the user logs in or out without needing Redux.
    public onUserChanged(handler: () => void): () => void {
        window.addEventListener(USER_CHANGED_EVENT, handler);
        return () => window.removeEventListener(USER_CHANGED_EVENT, handler);
    }

    // Save the token + user to localStorage and tell the app the user changed.
    private persistAuth(token: string, user: UserModel): void {
        localStorage.setItem(TOKEN_KEY, token);

        // Pull info out of the token so we always have userId/role even if the
        // server didn't return a full user object.
        try {
            const payload = jwtDecode<TokenPayload>(token).user;
            const merged: UserModel = {
                _id: payload.userId,
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                firstName: user?.firstName,
                lastName: user?.lastName,
            };
            localStorage.setItem(USER_KEY, JSON.stringify(merged));
        } catch {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }

        window.dispatchEvent(new Event(USER_CHANGED_EVENT));
    }
}

// One shared instance for the whole app.
export const userService = new UserService();
