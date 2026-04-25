// What we send to AI/MCP endpoints.
// "destination" is used for the AI recommendation, "query" is used for MCP questions.
export class PromptModel {
    public destination?: string;
    public query?: string;
}
