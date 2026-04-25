// All the URLs and settings the frontend needs in one place.
class AppConfig {

    // "development" or "production" — set automatically by Vite.
    public readonly environment = import.meta.env.MODE;
    public readonly isDevelopment = this.environment === "development";
    public readonly isProduction = this.environment === "production";

    // Base server address. Comes from .env (VITE_API_URL) or falls back to localhost.
    public readonly baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:4001").trim().replace(/\/$/, "");
    public readonly serverUrl = `${this.baseUrl}/api`;

    // Where uploaded vacation images live.
    public readonly uploadUrl = `${this.baseUrl}/1-assets`;

    // Auth endpoints.
    public readonly registerUrl = `${this.serverUrl}/auth/register`;
    public readonly loginUrl = `${this.serverUrl}/auth/login`;
    public readonly meUrl = `${this.serverUrl}/auth/me`;

    // Vacation endpoints.
    public readonly vacationsUrl = `${this.serverUrl}/vacations/`;
    public readonly vacationsFilterUrl = `${this.serverUrl}/vacations/filter/`;

    // Like endpoints.
    public readonly likesUrl = `${this.serverUrl}/likes/`;
    public readonly likeCountUrl = `${this.serverUrl}/likes/count/`;
    public readonly likeCheckUrl = `${this.serverUrl}/likes/check/`;

    // AI endpoints.
    public readonly aiRecommendationUrl = `${this.serverUrl}/ai/recommendation`;
    public readonly mcpQueryUrl = `${this.serverUrl}/mcp/query`;

    // Admin report endpoint (CSV download).
    public readonly reportsCsvUrl = `${this.serverUrl}/reports/csv`;
}

// One shared config object used everywhere.
export const appConfig = new AppConfig();
