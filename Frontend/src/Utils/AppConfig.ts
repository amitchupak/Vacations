// Same-origin by default. Vite dev server proxies /api and /1-assets to the backend
// (see vite.config.ts), nginx :5002 also forwards /api → backend. So the browser never
// has to talk to :4001 directly. Use VITE_API_URL only to point at a different host.
function resolveBaseUrl(): string {
    const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/$/, "");
    }
    if (typeof window === "undefined") {
        return "";
    }
    return window.location.origin;
}

// All the URLs and settings the frontend needs in one place.
class AppConfig {

    // "development" or "production" — set automatically by Vite.
    public readonly environment = import.meta.env.MODE;
    public readonly isDevelopment = this.environment === "development";
    public readonly isProduction = this.environment === "production";

    // See resolveBaseUrl — omit VITE_API_URL when using the Cloudflare tunnel in Docker.
    public readonly baseUrl = resolveBaseUrl();
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
