import { useNavigate } from "react-router-dom";
import { userService } from "../../../Services/UserService";
import "./Home.css";

// Landing page: shows different call-to-action buttons depending on whether the user is logged in.
export function Home() {
    const navigate = useNavigate();
    // Used to decide which buttons (guest vs. logged-in) to show.
    const token = userService.getToken();

    return (
        <div className="Home">
            <div className="hero-section">
                <h1>Discover your perfect vacation</h1>
                <p>Explore amazing vacation packages from around the world</p>
                
                {!token ? (
                    <div className="cta-buttons">
                        <button 
                            className="btn-primary"
                            onClick={() => navigate("/register")}
                        >
                            Get Started
                        </button>
                        <button 
                            className="btn-secondary"
                            onClick={() => navigate("/login")}
                        >
                            Already have an account? Login
                        </button>
                    </div>
                ) : (
                    <div className="cta-buttons">
                        <button 
                            className="btn-primary"
                            onClick={() => navigate("/vacations")}
                        >
                            Browse Vacations
                        </button>
                        <button 
                            className="btn-secondary"
                            onClick={() => navigate("/ask-ai")}
                        >
                            Get AI Recommendation
                        </button>
                    </div>
                )}
            </div>

            <div className="features-section">
                <h2>Why Choose Us?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon" aria-hidden="true">🌎</div>
                        <h3>Wide Selection</h3>
                        <p>Browse from dozens of amazing vacation destinations worldwide</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon" aria-hidden="true">💙</div>
                        <h3>Save Favorites</h3>
                        <p>Like your favorite vacations and track them easily</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon" aria-hidden="true">✨</div>
                        <h3>AI Recommendations</h3>
                        <p>Get personalized vacation recommendations using AI</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon" aria-hidden="true">📈</div>
                        <h3>Smart Analytics</h3>
                        <p>Ask questions about vacations using our MCP database</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
