import axios from "axios";
import { PromptModel } from "../Models/PromptModel";
import { appConfig } from "../Utils/AppConfig";

// Lets the user ask plain-English questions about the vacations database.
class MCPService {

    // Send the user's question to the server and return the AI's answer text.
    public async query(question: string): Promise<string> {
        const prompt: PromptModel = { query: question };
        const response = (await axios.post<{ answer: string }>(
            appConfig.mcpQueryUrl,
            prompt
        )).data;
        return response.answer;
    }
}

// One shared instance for the whole app.
export const mcpService = new MCPService();
