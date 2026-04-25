import axios from "axios";
import { PromptModel } from "../Models/PromptModel";
import { appConfig } from "../Utils/AppConfig";

// Talks to the server's AI endpoint that suggests things to do at a destination.
class AIService {

    // Ask the AI for tips about a destination and return its text answer.
    public async getRecommendation(destination: string): Promise<string> {
        const prompt: PromptModel = { destination };
        const response = (await axios.post<{ recommendation: string }>(
            appConfig.aiRecommendationUrl,
            prompt
        )).data;
        return response.recommendation;
    }
}

// One shared instance for the whole app.
export const aiService = new AIService();
