import { useNavigate } from "react-router-dom";
import { VacationModel } from "../../../../Models/VacationModel";
import { appConfig } from "../../../../Utils/AppConfig";
import "./VacationCard.css";

// What the parent passes in: the vacation to show and what to do on like/delete.
type VacationCardProps = {
    vacation: VacationModel;
    isAdmin: boolean;
    onLikeToggle?: (vacationId: string, isLiked: boolean) => void;
    onDelete?: (vacationId: string, destination: string) => void;
};

// One vacation tile. Shows different buttons for admins (edit/delete) vs. users (like).
export function VacationCard({ vacation, isAdmin, onLikeToggle, onDelete }: VacationCardProps) {
    const navigate = useNavigate();

    // Turn a date string into a friendly local date like "1/2/2026".
    function formatDate(dateString?: string): string {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString();
    }

    return (
        <div className={`vacation-card ${isAdmin ? "admin-card" : ""}`}>
            <div className="vacation-image">
                <img
                    src={`${appConfig.uploadUrl}/${vacation.imageName}`}
                    alt={vacation.destination}
                    onError={(imageEvent) => {
                        // If the real image is missing, fall back to a placeholder.
                        (imageEvent.target as HTMLImageElement).src =
                            "https://via.placeholder.com/300x200?text=" + (vacation.destination ?? "Vacation");
                    }}
                />
                {!isAdmin && (
                    <span className={`like-badge ${vacation.isLiked ? "liked" : ""}`}>
                        ❤️ {vacation.likeCount ?? 0}
                    </span>
                )}
            </div>
            <div className="vacation-content">
                <h2>{vacation.destination}</h2>
                <p className="description">{vacation.description}</p>
                <p className="dates">
                    📅 {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                </p>
                <p className="price">${vacation.price}</p>

                <div className="vacation-actions">
                    {isAdmin ? (
                        <>
                            <button
                                className="edit-btn"
                                onClick={() => navigate(`/vacations/edit/${vacation._id}`)}
                            >
                                ✏️ Edit
                            </button>
                            <button
                                className="delete-btn"
                                onClick={() => onDelete?.(vacation._id!, vacation.destination ?? "")}
                            >
                                🗑️ Delete
                            </button>
                        </>
                    ) : (
                        <button
                            className={`like-btn ${vacation.isLiked ? "liked" : ""}`}
                            onClick={() => onLikeToggle?.(vacation._id!, vacation.isLiked ?? false)}
                        >
                            {vacation.isLiked ? "❤️ Unlike" : "🤍 Like"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
