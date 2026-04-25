import { useLocation } from "react-router-dom";
import { Header } from "./Header/Header";
import { Footer } from "./Footer/Footer";
import { Routing } from "../Routing/Routing";
import "./Layout.css";

// The page skeleton that wraps every screen: header on top, page in the middle, footer at the bottom.
// On the 404 page we hide the header and footer so the user just sees the standalone 404 view.
export function Layout() {
    const location = useLocation();
    const isNotFoundPage = location.pathname === "/404";

    return (
        <div className="Layout">

            {!isNotFoundPage && (
                <header>
                    <Header />
                </header>
            )}

            {/* The main slot — Routing decides which page goes here. */}
            <main>
                <Routing />
            </main>

            {!isNotFoundPage && <Footer />}

        </div>
    );
}
