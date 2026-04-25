import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VacationModel } from "../../../../Models/VacationModel";
import { vacationService } from "../../../../Services/VacationService";
import { userService } from "../../../../Services/UserService";
import { notification } from "../../../../Utils/Notification";
import { isAuthError } from "../../../../Utils/Errors";
import { VacationCard } from "../VacationCard/VacationCard";
import { Loading } from "../../../Shared/Loading/Loading";
import "./VacationList.css";

// The 4 categories the filter buttons map to.
type Filter = "all" | "liked" | "active" | "upcoming";

// Main page that shows the grid of vacations with filters, pagination, like and admin controls.
export function VacationList() {
    const navigate = useNavigate();

    // Tells us to scroll back to the top after the next list update (used when changing pages).
    const shouldScrollToTopRef = useRef(false);
    // Skip the big spinner on follow-up loads — we already have data on screen.
    const hasLoadedOnceRef = useRef(false);

    const [vacations, setVacations] = useState<VacationModel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [filter, setFilter] = useState<Filter>("all");

    const isAdmin = userService.isAdmin();

    // Reload vacations whenever the page or the filter changes.
    useEffect(() => {
        if (!userService.getToken()) {
            navigate("/login");
            return;
        }
        loadVacations();
    }, [currentPage, filter]);

    // After paginating, smoothly scroll back to the top of the list.
    useEffect(() => {
        if (!shouldScrollToTopRef.current) return;
        shouldScrollToTopRef.current = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [vacations]);

    // Get vacations from the server and add like info for each one.
    async function loadVacations() {
        if (!hasLoadedOnceRef.current) setLoading(true);
        try {
            // Pick the right endpoint based on the current filter.
            const data = filter === "all"
                ? await vacationService.getVacations(currentPage)
                : await vacationService.getFilteredVacations(filter, currentPage);

            // For each vacation, also fetch its like count and whether the user liked it.
            const enriched = await Promise.all(
                data.vacations.map(async (vacation) => {
                    const [likeCount, isLiked] = await Promise.all([
                        vacationService.getLikeCount(vacation._id!),
                        vacationService.isVacationLiked(vacation._id!),
                    ]);
                    return { ...vacation, likeCount, isLiked };
                })
            );

            setVacations(enriched);
            setTotalPages(data.pages);
            hasLoadedOnceRef.current = true;
        } catch (error) {
            console.error("[VacationList] failed to load vacations:", error);
            notification.error(error);
            // If the token is bad/expired, log out and send to login.
            if (isAuthError(error)) {
                userService.logout();
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    }

    // Toggle like/unlike for one vacation. Updates the UI first, then calls the server.
    async function handleLike(vacationId: string, isLiked: boolean) {
        // Optimistic update — flip the heart instantly so it feels snappy.
        setVacations(prev =>
            prev.map(v =>
                v._id === vacationId
                    ? { ...v, isLiked: !isLiked, likeCount: (v.likeCount ?? 0) + (isLiked ? -1 : 1) }
                    : v
            )
        );

        try {
            if (isLiked) {
                await vacationService.unlikeVacation(vacationId);
                notification.success("Like removed");
            } else {
                await vacationService.likeVacation(vacationId);
                notification.success("Vacation liked!");
            }
        } catch (error) {
            console.error("[VacationList] like toggle failed:", error);
            // Server failed — undo the optimistic change so the UI matches reality.
            setVacations(prev =>
                prev.map(v =>
                    v._id === vacationId
                        ? { ...v, isLiked, likeCount: (v.likeCount ?? 0) + (isLiked ? 1 : -1) }
                        : v
                )
            );
            notification.error(error);
        }
    }

    // Admin-only: confirm and delete a vacation, then remove it from the list.
    async function handleDelete(vacationId: string, destination: string) {
        if (!confirm(`Are you sure you want to delete ${destination}?`)) return;

        try {
            await vacationService.deleteVacation(vacationId);
            setVacations(prev => prev.filter(v => v._id !== vacationId));
            notification.success("Vacation deleted");
        } catch (error) {
            console.error("[VacationList] delete failed:", error);
            notification.error(error);
        }
    }

    // Change page and remember to scroll to the top after the new list loads.
    function goToPage(page: number) {
        shouldScrollToTopRef.current = true;
        setCurrentPage(page);
    }

    if (loading && vacations.length === 0) {
        return <Loading />;
    }

    return (
        <div className="VacationList vacations-container">
            {isAdmin && (
                <div className="admin-header">
                    <h1>Manage Vacations</h1>
                    <button
                        className="add-vacation-btn"
                        onClick={() => navigate("/vacations/new")}
                    >
                        + Add Vacation
                    </button>
                </div>
            )}

            {!isAdmin && (
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filter === "all" ? "active" : ""}`}
                        onClick={() => { setFilter("all"); setCurrentPage(1); }}
                    >
                        All Vacations
                    </button>
                    <button
                        className={`filter-btn ${filter === "liked" ? "active" : ""}`}
                        onClick={() => { setFilter("liked"); setCurrentPage(1); }}
                    >
                        My Likes
                    </button>
                    <button
                        className={`filter-btn ${filter === "active" ? "active" : ""}`}
                        onClick={() => { setFilter("active"); setCurrentPage(1); }}
                    >
                        Active Now
                    </button>
                    <button
                        className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
                        onClick={() => { setFilter("upcoming"); setCurrentPage(1); }}
                    >
                        Upcoming
                    </button>
                </div>
            )}

            <div className="vacations-grid">
                {vacations.map(vacation => (
                    <VacationCard
                        key={vacation._id}
                        vacation={vacation}
                        isAdmin={isAdmin}
                        onLikeToggle={handleLike}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                    ← Previous
                </button>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
                    Next →
                </button>
            </div>
        </div>
    );
}
