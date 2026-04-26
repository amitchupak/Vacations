import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Layout } from "./Components/Layout/Layout";
import { interceptor } from "./Utils/Interceptor";
import "./index.css";

// If the address bar has /proxy/4002/proxy/4002/ (duplicate path), Vite 404s. Collapse to one segment.
if (import.meta.env.DEV && typeof location !== "undefined") {
    const path = location.pathname;
    const fixed = path.replace(/(\/proxy\/\d+)(?:\1)+/g, "$1");
    if (fixed !== path) {
        history.replaceState(null, "", fixed + location.search + location.hash);
    }
}

// Set up axios so it auto-attaches the login token to every request.
interceptor.create();

// Mount the React app into <div id="root"> in index.html.
// BrowserRouter gives us URL-based routing.
// Matches Vite `base` (e.g. /proxy/4002/ when using code-server preview) via import.meta.env.BASE_URL
createRoot(document.getElementById("root")!).render(
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
        <Layout />
    </BrowserRouter>
);
