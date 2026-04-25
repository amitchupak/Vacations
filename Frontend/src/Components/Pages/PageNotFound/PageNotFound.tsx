import { NavLink } from "react-router-dom";
import "./PageNotFound.css";

// 404 screen — shown when the URL doesn't match any known route.
// The Layout hides the header for this page so the user only sees this view.
export function PageNotFound() {
    return (
        <div className="PageNotFound">

            <h2>404</h2>
            <p>The page you are looking for <br /> doesn't exist</p>
            <NavLink to="/home">Home</NavLink>

        </div>
    );
}
