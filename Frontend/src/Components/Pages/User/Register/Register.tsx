import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { UserModel } from "../../../../Models/UserModel";
import { userService } from "../../../../Services/UserService";
import { notification } from "../../../../Utils/Notification";
import "./Register.css";

// Register page: creates a new account and logs the user in automatically.
export function Register() {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<UserModel>();
    // True while the registration request is in flight.
    const [loading, setLoading] = useState(false);

    // Called when the form is submitted with valid input.
    async function send(user: UserModel) {
        // Extra safety check on top of the form validation.
        if ((user.password?.length ?? 0) < 4) {
            notification.error("Password must be at least 4 characters");
            return;
        }

        setLoading(true);
        try {
            // Send the new user details to the server.
            await userService.register(user);
            notification.success(`Welcome ${user.firstName} ${user.lastName}!`);
            // After registering, take them straight to the vacations list.
            navigate("/vacations");
        } catch (error) {
            // Log full error for devs, show a friendly toast for the user.
            console.error("[Register] register failed:", error);
            notification.error(error, "register");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="register-container">
            <div className="register-form">
                <h1>Register</h1>
                <form onSubmit={handleSubmit(send)}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="first name"
                            {...register("firstName", { required: "First name is required" })}
                            disabled={loading}
                        />
                        {errors.firstName && <span className="error">{errors.firstName.message}</span>}
                    </div>

                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="last name"
                            {...register("lastName", { required: "Last name is required" })}
                            disabled={loading}
                        />
                        {errors.lastName && <span className="error">{errors.lastName.message}</span>}
                    </div>

                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="email"
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                                    message: "Please enter a valid email",
                                },
                            })}
                            disabled={loading}
                        />
                        {errors.email && <span className="error">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="password"
                            {...register("password", {
                                required: "Password is required",
                                minLength: {
                                    value: 4,
                                    message: "Password must be at least 4 characters",
                                },
                            })}
                            disabled={loading}
                        />
                        {errors.password && <span className="error">{errors.password.message}</span>}
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <p className="login-link">
                    already a member? <Link to="/login">login</Link>
                </p>
            </div>
        </div>
    );
}
