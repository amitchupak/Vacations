import { defineConfig, loadEnv, type Plugin, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";

// Merge .env with process.env (Docker sets VITE_DEV_PORT; loadEnv() alone would miss it)
function getEnv(mode: string) {
    const fromFile = loadEnv(mode, process.cwd(), "");
    const out: Record<string, string> = { ...fromFile };
    for (const key of Object.keys(process.env)) {
        if (
            key === "VITE_DEV_PORT" ||
            key === "VITE_BASE_PATH" ||
            key === "VITE_API_URL" ||
            key.startsWith("VITE_")
        ) {
            const v = process.env[key];
            if (v !== undefined) {
                out[key] = v;
            }
        }
    }
    return out;
}

/**
 * code-server: browser URL is :5001/proxy/4002/home but the dev server may receive only /home.
 * Vite (base: /proxy/4002/) then shows "public base URL… did you mean /proxy/4002/…" — we rewrite
 * the path before Vite's handler so the SPA and dev server see the same base as the browser.
 */
function codeServerStrippedPathPlugin(): Plugin {
    return {
        name: "code-server-stripped-path",
        enforce: "pre",
        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                const b = (server.config.base || "/").replace(/\/$/, "");
                if (!b) {
                    return next();
                }
                const url = req.url || "/";
                const [pathname, ...rest] = url.split("?");
                const qu = rest.length > 0 ? "?" + rest.join("?") : "";
                const p = pathname;

                if (p.startsWith("/@") || p.startsWith("/node_modules/")) {
                    return next();
                }
                if (p === b || p === b + "/" || p.startsWith(b + "/")) {
                    return next();
                }
                if (p === "/") {
                    req.url = b + "/" + qu;
                    return next();
                }
                req.url = b + p + qu;
                return next();
            });
        },
    };
}

// https://vite.dev/config/
// code-server: http://IP:5001/proxy/4002/ only connects to what listens on 4002. Default 4002 so
// `npm start` works with no .env. Docker maps host 4003→4000; keep 4002 free for start:code-server.
export default defineConfig(({ mode }): UserConfig => {
    const env = getEnv(mode);
    const base = env.VITE_BASE_PATH
        ? env.VITE_BASE_PATH.endsWith("/")
            ? env.VITE_BASE_PATH
            : `${env.VITE_BASE_PATH}/`
        : "/";

    let port = 4002; // default: match /proxy/4002/ on the school code-server
    if (env.VITE_DEV_PORT) {
        port = parseInt(env.VITE_DEV_PORT, 10) || 4002;
    } else {
        const m = env.VITE_BASE_PATH?.match(/\/proxy\/(\d+)\//);
        if (m) {
            port = parseInt(m[1], 10) || 4002;
        }
    }

    return {
        base,
        plugins: [react(), codeServerStrippedPathPlugin()],
        server: {
            host: "0.0.0.0",
            port,
            strictPort: true,
            open: false,
            allowedHosts: true,
        },
    };
});
