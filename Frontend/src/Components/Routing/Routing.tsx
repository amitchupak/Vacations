import { type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./Routing.css";
import { Home } from "../Pages/Home/Home";
import { PageNotFound } from "../Pages/PageNotFound/PageNotFound";
import { Login } from "../Pages/User/Login/Login";
import { Register } from "../Pages/User/Register/Register";
import { VacationList } from "../Pages/Vacations/VacationList/VacationList";
import { AddVacation } from "../Pages/Vacations/AddVacation/AddVacation";
import { EditVacation } from "../Pages/Vacations/EditVacation/EditVacation";
import { Reports } from "../Pages/Vacations/Reports/Reports";
import { AskAi } from "../Pages/AskAi/AskAi";
import { MCPQuery } from "../Pages/MCPQuery/MCPQuery";
import { userService } from "../../Services/UserService";

// Wrap private pages with this — if the user isn't logged in, send them to /home.
function RequireAuth({ children }: { children: ReactNode }) {
    if (!userService.getToken()) {
        return <Navigate to="/home" replace />;
    }
    return children;
}

// All page paths in the app live here.
export function Routing() {
    return (
        <div className="Routing">
            <Routes>
                {/* Default route → send people to /home. */}
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="/home" element={<Home />} />

                {/* Public auth pages. */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                {/* Vacation pages — login required. */}
                <Route path="/vacations" element={<RequireAuth><VacationList /></RequireAuth>} />
                <Route path="/vacations/new" element={<RequireAuth><AddVacation /></RequireAuth>} />
                <Route path="/vacations/edit/:id" element={<RequireAuth><EditVacation /></RequireAuth>} />
                <Route path="/vacations/reports" element={<RequireAuth><Reports /></RequireAuth>} />

                {/* AI pages — login required. */}
                <Route path="/ask-ai" element={<RequireAuth><AskAi /></RequireAuth>} />
                <Route path="/mcp-query" element={<RequireAuth><MCPQuery /></RequireAuth>} />

                {/* Fallback for any unknown URL → show 404 page. */}
                <Route path="/404" element={<PageNotFound />} />
                <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
        </div>
    );
}
