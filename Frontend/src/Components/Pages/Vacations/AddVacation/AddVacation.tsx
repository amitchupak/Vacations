import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { VacationModel } from "../../../../Models/VacationModel";
import { vacationService } from "../../../../Services/VacationService";
import { userService } from "../../../../Services/UserService";
import { notification } from "../../../../Utils/Notification";
import "./AddVacation.css";

// Today's date as "YYYY-MM-DD" — used as the minimum allowed start date.
function getTodayLocalIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Given a start date, return the next day — used as the minimum allowed end date.
function getDayAfterIsoDate(startIsoDate: string): string {
    const [year, month, day] = startIsoDate.split("-").map(Number);
    const nextDay = new Date(year, month - 1, day + 1);
    const nextYear = nextDay.getFullYear();
    const nextMonth = String(nextDay.getMonth() + 1).padStart(2, "0");
    const nextDayOfMonth = String(nextDay.getDate()).padStart(2, "0");
    return `${nextYear}-${nextMonth}-${nextDayOfMonth}`;
}

// Admin page: form to create a new vacation (with image upload).
export function AddVacation() {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        watch,
        trigger,
        formState: { errors },
    } = useForm<VacationModel>({ mode: "onChange" });

    // Re-runs end-date validation whenever start date changes.
    const watchedStartDate = watch("startDate");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [loading, setLoading] = useState(false);

    // When the start date changes, re-check the end date too.
    useEffect(() => {
        void trigger("endDate");
    }, [watchedStartDate, trigger]);

    // Save the picked image and show a small preview.
    function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setImageFile(selectedFile);
            // Read the file as a base64 string so we can show it before upload.
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    }

    // Called when the form is submitted — sends the new vacation to the server.
    async function send(vacation: VacationModel) {
        if (!imageFile) {
            notification.error("Please select an image");
            return;
        }
        if ((vacation.price ?? 0) < 0 || (vacation.price ?? 0) > 10000) {
            notification.error("Price must be between 0 and 10,000");
            return;
        }

        setLoading(true);
        try {
            // Attach the picked image so the service can include it in the upload.
            vacation.image = imageFile;
            await vacationService.addVacation(vacation);
            notification.success("Vacation added successfully!");
            navigate("/vacations");
        } catch (error) {
            console.error("[AddVacation] create failed:", error);
            notification.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (!userService.getToken()) {
        navigate("/login");
        return null;
    }

    return (
        <div className="add-vacation-container">
            <div className="add-vacation-form">
                <h1>Add Vacation</h1>
                <form onSubmit={handleSubmit(send)}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="destination"
                            {...register("destination", { required: "Destination is required" })}
                            disabled={loading}
                        />
                        {errors.destination && <span className="error">{errors.destination.message}</span>}
                    </div>

                    <div className="form-group">
                        <textarea
                            placeholder="description"
                            {...register("description", { required: "Description is required" })}
                            disabled={loading}
                            rows={4}
                        />
                        {errors.description && <span className="error">{errors.description.message}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>start on</label>
                            <input
                                type="date"
                                min={getTodayLocalIsoDate()}
                                {...register("startDate", {
                                    required: "Start date is required",
                                    validate: (startDateValue) =>
                                        !startDateValue ||
                                        startDateValue >= getTodayLocalIsoDate() ||
                                        "Start date cannot be before today",
                                })}
                                disabled={loading}
                            />
                            {errors.startDate && <span className="error">{errors.startDate.message}</span>}
                        </div>

                        <div className="form-group">
                            <label>end on</label>
                            <input
                                type="date"
                                min={watchedStartDate ? getDayAfterIsoDate(watchedStartDate) : getTodayLocalIsoDate()}
                                {...register("endDate", {
                                    required: "End date is required",
                                    validate: (endDateValue, formValues) => {
                                        if (!endDateValue || !formValues.startDate) return true;
                                        return endDateValue > formValues.startDate || "End date must be after start date";
                                    },
                                })}
                                disabled={loading}
                            />
                            {errors.endDate && <span className="error">{errors.endDate.message}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <input
                            type="number"
                            placeholder="price"
                            step="0.01"
                            min="0"
                            max="10000"
                            {...register("price", {
                                required: "Price is required",
                                valueAsNumber: true
                            })}
                            disabled={loading}
                        />
                        {errors.price && <span className="error">{errors.price.message}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="image">cover image</label>
                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={loading}
                        />
                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Preview" />
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? "Adding..." : "Add Vacation"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/vacations")}
                            className="cancel-btn"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
