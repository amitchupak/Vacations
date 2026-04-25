import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mcpService } from "../../../Services/MCPService";
import { userService } from "../../../Services/UserService";
import { notification } from "../../../Utils/Notification";
import { isAuthError } from "../../../Utils/Errors";
import "./MCPQuery.css";

// Page where the user asks plain-English questions about the vacations database.
export function MCPQuery() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);

    // Send the user's question to the server and show the answer.
    async function handleQuery() {
        if (!query.trim()) {
            notification.error("Please enter a question");
            return;
        }

        setLoading(true);
        // Clear the old answer while we wait for a new one.
        setAnswer("");
        try {
            const response = await mcpService.query(query);
            setAnswer(response);
        } catch (error) {
            console.error("[MCPQuery] query failed:", error);
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
        <div className="mcp-query-container">
            <div className="query-card">
                <h1>Ask About Vacations</h1>
                <p className="subtitle">
                    Ask anything about our vacations using natural language.
                    The AI will search our database and answer your question.
                </p>

                <div className="input-group">
                    <textarea
                        value={query}
                        onChange={(textareaEvent) => setQuery(textareaEvent.target.value)}
                        onKeyPress={(keyboardEvent) => {
                            if (keyboardEvent.key === "Enter" && keyboardEvent.ctrlKey) handleQuery();
                        }}
                        disabled={loading}
                        rows={4}
                    />
                    <button onClick={handleQuery} disabled={loading}>
                        {loading ? "Thinking..." : "Ask Question"}
                    </button>
                </div>

                {answer && (
                    <div className="answer-result">
                        <h2>Answer</h2>
                        <p>{answer}</p>
                    </div>
                )}

                {loading && !answer && (
                    <div className="loading-spinner">
                        <p>AI is searching the database...</p>
                    </div>
                )}

                <div className="example-questions">
                    <h3>Examples</h3>
                    <ul>
                        <li>"What's the most expensive vacation?"</li>
                        <li>"Which vacations are still upcoming?"</li>
                        <li>"Show me beach destinations"</li>
                        <li>"What vacations are happening in December?"</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
