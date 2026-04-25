import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { UserModel } from "../../../Models/UserModel";
import { userService } from "../../../Services/UserService";
import "./Header.css";

// Top bar of the site. Shows the title and either guest links (Register/Login)
// or logged-in links (Vacations / AI / Logout etc.) depending on who's using the app.
export function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    // Local copy of the current user so we re-render when login/logout happens.
    const [user, setUser] = useState<UserModel | null>(userService.getUser());

    // Listen for "user-changed" events fired by UserService and update the header.
    useEffect(() => {
        const unsubscribe = userService.onUserChanged(() => {
            setUser(userService.getUser());
        });
        return unsubscribe;
    }, []);

    // If we have a token but no first/last name, ask the server who we are.
    useEffect(() => {
        const token = userService.getToken();
        if (token && (!user?.firstName || !user?.lastName)) {
            userService.getMe().catch((error) => {
                console.error("[Header] failed to refresh current user:", error);
            });
        }
    }, [user?.firstName, user?.lastName]);

    const token = userService.getToken();

    // On these pages we hide the guest buttons — they have their own CTAs.
    const hideGuestNavPaths = ["/home", "/login", "/register"];
    const showGuestNav = !token && !hideGuestNavPaths.includes(location.pathname);

    // When neither set of links shows, center the title on its own.
    const isTitleOnly = !token && !showGuestNav;

    // Log the user out and send them back to the home page.
    function handleLogout() {
        userService.logout();
        navigate("/home");
    }

    return (
        <div className="Header">
            <div className={`header-content ${isTitleOnly ? "header-content--centered" : ""}`}>
                <h1
                    className="header-brandTitle"
                    onClick={() => navigate("/home")}
                >
                    Vacations
                </h1>

                {/* Guest links: visible when not logged in. */}
                {showGuestNav && (
                    <nav className="nav-menu" aria-label="Main">
                        <button type="button" onClick={() => navigate("/register")} className="nav-btn">
                            Register
                        </button>
                        <button type="button" onClick={() => navigate("/login")} className="nav-btn nav-btn--primary">
                            Login
                        </button>
                    </nav>
                )}

                {/* Logged-in links: visible when we have a token. */}
                {token && (
                    <nav className="nav-menu" aria-label="Main">
                        <button type="button" onClick={() => navigate("/vacations")} className="nav-btn">
                            Vacations
                        </button>
                        <button type="button" onClick={() => navigate("/ask-ai")} className="nav-btn">
                            AI Recommendation
                        </button>
                        <button type="button" onClick={() => navigate("/mcp-query")} className="nav-btn">
                            Ask MCP
                        </button>
                        {/* Reports button only shows for admins. */}
                        {user?.role === "Admin" && (
                            <button type="button" onClick={() => navigate("/vacations/reports")} className="nav-btn nav-btn--admin">
                                Reports
                            </button>
                        )}
                        {/* Greet the logged-in user with their name if we have it. */}
                        {user && (user.firstName || user.lastName) && (
                            <span className="user-info">
                                {user.firstName} {user.lastName}
                            </span>
                        )}
                        <button type="button" onClick={handleLogout} className="nav-btn nav-btn--logout">
                            Logout
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
}
