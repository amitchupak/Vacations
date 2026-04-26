import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// When you open the app from code-server as http://IP:5001/proxy/4002/ you MUST set
// VITE_BASE_PATH=/proxy/4002/ in Frontend/.env (and match the port in the path).
// For Docker (nginx on :5002) or npm run on localhost, leave it unset (base "/").
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const base = env.VITE_BASE_PATH
        ? env.VITE_BASE_PATH.endsWith("/")
            ? env.VITE_BASE_PATH
            : `${env.VITE_BASE_PATH}/`
        : "/";

    // code-server /proxy/4002/ forwards to localhost:4002 — Vite must listen on that same port.
    // Docker keeps VITE_DEV_PORT=4000 (see docker-compose) with host map 4002:4000.
    let port = 4000;
    if (env.VITE_DEV_PORT) {
        port = parseInt(env.VITE_DEV_PORT, 10) || 4000;
    } else {
        const m = env.VITE_BASE_PATH?.match(/\/proxy\/(\d+)\//);
        if (m) {
            port = parseInt(m[1], 10) || 4000;
        }
    }

    return {
        base,
        plugins: [react()],
        server: {
            host: "0.0.0.0",
            port,
            strictPort: true,
            open: false,
            allowedHosts: true,
        },
    };
});
