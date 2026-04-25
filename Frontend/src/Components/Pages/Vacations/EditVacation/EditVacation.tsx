import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { VacationModel } from "../../../../Models/VacationModel";
import { vacationService } from "../../../../Services/VacationService";
import { userService } from "../../../../Services/UserService";
import { notification } from "../../../../Utils/Notification";
import { appConfig } from "../../../../Utils/AppConfig";
import { Loading } from "../../../Shared/Loading/Loading";
import "./EditVacation.css";

// Admin page: pre-filled form for editing an existing vacation.
export function EditVacation() {
    const navigate = useNavigate();
    // Vacation id from the URL (e.g. /vacations/edit/123).
    const { id } = useParams<{ id: string }>();
    const {
        register,
        handleSubmit,
        watch,
        trigger,
        formState: { errors },
        setValue,
    } = useForm<VacationModel>({ mode: "onChange" });

    const watchedStartDate = watch("startDate");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    // True while we're loading the existing vacation from the server.
    const [loading, setLoading] = useState(true);
    // True while we're saving the edits.
    const [submitting, setSubmitting] = useState(false);

    // Load the vacation when the page opens and fill the form with its values.
    useEffect(() => {
        async function loadVacation() {
            if (!id) return;
            try {
                const vacation = await vacationService.getVacationById(id);
                setValue("destination", vacation.destination);
                setValue("description", vacation.description);
                // Date inputs need just "YYYY-MM-DD", not the full ISO string.
                setValue("startDate", vacation.startDate?.split("T")[0]);
                setValue("endDate", vacation.endDate?.split("T")[0]);
                setValue("price", vacation.price);
                // Show the existing image as the preview until the admin picks a new one.
                setImagePreview(`${appConfig.uploadUrl}/${vacation.imageName}`);
            } catch (error) {
                console.error("[EditVacation] failed to load vacation:", error);
                notification.error(error);
                navigate("/vacations");
            } finally {
                setLoading(false);
            }
        }

        loadVacation();
    }, [id, navigate, setValue]);

    // Re-validate end date whenever the start date changes.
    useEffect(() => {
        void trigger("endDate");
    }, [watchedStartDate, trigger]);

    // Save the picked image and show a preview of it.
    function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setImageFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    }

    // Send the updated vacation to the server.
    async function send(vacation: VacationModel) {
        if ((vacation.price ?? 0) < 0 || (vacation.price ?? 0) > 10000) {
            notification.error("Price must be between 0 and 10,000");
            return;
        }

        setSubmitting(true);
        try {
            // Only attach a new image file if the admin picked one.
            if (imageFile) vacation.image = imageFile;
            await vacationService.updateVacation(id!, vacation);
            notification.success("Vacation updated successfully!");
            navigate("/vacations");
        } catch (error) {
            console.error("[EditVacation] update failed:", error);
            notification.error(error);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <Loading />;

    if (!userService.getToken()) {
        navigate("/login");
        return null;
    }

    return (
        <div className="edit-vacation-container">
            <div className="edit-vacation-form">
                <h1>Edit Vacation</h1>
                <form onSubmit={handleSubmit(send)}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="destination"
                            {...register("destination", { required: "Destination is required" })}
                            disabled={submitting}
                        />
                        {errors.destination && <span className="error">{errors.destination.message}</span>}
                    </div>

                    <div className="form-group">
                        <textarea
                            placeholder="description"
                            {...register("description", { required: "Description is required" })}
                            disabled={submitting}
                            rows={4}
                        />
                        {errors.description && <span className="error">{errors.description.message}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>start on</label>
                            <input
                                type="date"
                                {...register("startDate", { required: "Start date is required" })}
                                disabled={submitting}
                            />
                            {errors.startDate && <span className="error">{errors.startDate.message}</span>}
                        </div>

                        <div className="form-group">
                            <label>end on</label>
                            <input
                                type="date"
                                min={watchedStartDate || undefined}
                                {...register("endDate", {
                                    required: "End date is required",
                                    validate: (endDateValue, formValues) => {
                                        if (!endDateValue || !formValues.startDate) return true;
                                        return endDateValue >= formValues.startDate || "End date cannot be before start date";
                                    },
                                })}
                                disabled={submitting}
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
                            disabled={submitting}
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
                            disabled={submitting}
                        />
                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Preview" />
                                <p>{imageFile ? "New image selected" : "Current image"}</p>
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={submitting} className="submit-btn">
                            {submitting ? "Updating..." : "Update"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/vacations")}
                            className="cancel-btn"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
