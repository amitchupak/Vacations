import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { CredentialsModel } from "../../../../Models/CredentialsModel";
import { userService } from "../../../../Services/UserService";
import { notification } from "../../../../Utils/Notification";
import "./Login.css";

// Login page: form that signs an existing user in and sends them to the vacations list.
export function Login() {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<CredentialsModel>();
    // True while the request is in flight — disables inputs and shows "Logging in...".
    const [loading, setLoading] = useState(false);

    // Called when the form is submitted with valid input.
    async function send(credentials: CredentialsModel) {
        setLoading(true);
        try {
            // Send the email + password to the server.
            await userService.login(credentials);
            notification.success("Login successful!");
            // After a successful login, send them straight to the vacations list.
            navigate("/vacations");
        } catch (error) {
            // Log full error for devs, show a friendly toast for the user.
            console.error("[Login] login failed:", error);
            notification.error(error, "login");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-form">
                <h1>Login</h1>
                <form onSubmit={handleSubmit(send)}>
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
                            {...register("password", { required: "Password is required" })}
                            disabled={loading}
                        />
                        {errors.password && <span className="error">{errors.password.message}</span>}
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="register-link">
                    don't have account? <Link to="/register">register now</Link>
                </p>
            </div>
        </div>
    );
}
