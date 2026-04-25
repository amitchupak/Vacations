import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { aiService } from "../../../Services/AIService";
import { userService } from "../../../Services/UserService";
import { notification } from "../../../Utils/Notification";
import { isAuthError } from "../../../Utils/Errors";
import "./AskAi.css";

// Clean up the AI's text: strip markdown, split into paragraphs for nicer display.
function normalizeRecommendationText(rawText: string): string[] {
    return rawText
        .replace(/\r\n/g, "\n")
        .split(/\n\s*\n/)
        .map((paragraph) =>
            paragraph
                .replace(/^[#*\-\s]+/gm, "")
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .replace(/\*(.*?)\*/g, "$1")
                .replace(/\s+/g, " ")
                .trim()
        )
        .filter(Boolean);
}

// Page where the user types a destination and gets AI travel tips back.
export function AskAi() {
    const navigate = useNavigate();
    const [destination, setDestination] = useState("");
    const [recommendation, setRecommendation] = useState("");
    const [loading, setLoading] = useState(false);
    // Pre-cleaned paragraphs we can show in the UI.
    const recommendationParagraphs = normalizeRecommendationText(recommendation);

    // Send the destination to the AI service and show the response.
    async function handleGetRecommendation() {
        if (!destination.trim()) {
            notification.error("Please enter a destination");
            return;
        }

        setLoading(true);
        // Clear out any old answer while we wait for the new one.
        setRecommendation("");

        try {
            const text = await aiService.getRecommendation(destination);
            setRecommendation(text);
        } catch (error) {
            console.error("[AskAi] recommendation failed:", error);
            notification.error(error);
            // Bounce to login if the session is no longer valid.
            if (isAuthError(error)) {
                userService.logout();
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="ai-recommendation-container">
            <div className="recommendation-card">
                <h1>AI Recommendation</h1>
                <p className="subtitle">Get AI-powered vacation recommendations for your destination</p>

                <div className="input-group">
                    <input
                        type="text"
                        placeholder="destination"
                        value={destination}
                        onChange={(inputEvent) => setDestination(inputEvent.target.value)}
                        onKeyPress={(keyboardEvent) => keyboardEvent.key === "Enter" && handleGetRecommendation()}
                        disabled={loading}
                    />
                    <button onClick={handleGetRecommendation} disabled={loading}>
                        {loading ? "Getting Recommendation..." : "Get Recommendation"}
                    </button>
                </div>

                {recommendationParagraphs.length > 0 && (
                    <div className="recommendation-result">
                        <h2>Recommendation for {destination}</h2>
                        <div className="recommendation-text">
                            {recommendationParagraphs.map((paragraph, paragraphIndex) => (
                                <p key={paragraphIndex}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                )}

                {loading && !recommendation && (
                    <div className="loading-spinner">
                        <p>Getting AI recommendation...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
