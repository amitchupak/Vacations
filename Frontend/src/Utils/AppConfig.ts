// Base URL: explicit VITE_API_URL, or same origin (nginx + Cloudflare tunnel), or direct Docker Vite on :4002/:4003 → API :4001.
function resolveBaseUrl(): string {
    const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/$/, "");
    }
    if (typeof window === "undefined") {
        return "http://localhost:4001";
    }
    const { protocol, hostname, port } = window.location;
    // Docker publishes Vite on host :4003 (4002 is for code-server /proxy/4002/); API on :4001.
    if (port === "4002" || port === "4003") {
        return `${protocol}//${hostname}:4001`;
    }
    // Nginx, tunnel (trycloudflare.com), or :80 / :5002 — /api is same host.
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
