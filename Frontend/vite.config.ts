import { defineConfig, loadEnv } from "vite";
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

// https://vite.dev/config/
// code-server: http://IP:5001/proxy/4002/ only connects to what listens on 4002. Default 4002 so
// `npm start` works with no .env. Docker sets VITE_DEV_PORT=4000 in compose (port map 4002:4000).
export default defineConfig(({ mode }) => {
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
