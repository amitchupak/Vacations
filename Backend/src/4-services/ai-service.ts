import OpenAI from "openai";

// Talks to OpenAI to get a short travel recommendation for a destination.
class AIRecommendationService {
  private apiKey = process.env.OPENAI_API_KEY || "";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  // Ask the AI for travel tips about a destination and return the answer as plain text.
  async getRecommendation(destination: string): Promise<string> {
    try {
      // Bail out early if no API key is set — saves a wasted network call.
      if (!this.apiKey) {
        throw new Error("API key is not configured");
      }

      // Send the prompt to OpenAI's chat model.
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1024,
        messages: [
          {
            // System message tells the AI how to behave.
            role: "system",
            content:
              "You are a travel advisor. Always return plain text only. Do not use markdown symbols like #, ##, *, or bullet lists. Write 3 to 5 short paragraphs with useful details and include a final short annotation line that starts with 'Note:' for practical advice.",
          },
          {
            // User message is the actual question we want answered.
            role: "user",
            content: `Provide vacation recommendations for ${destination}. Include popular attractions, best time to visit, local cuisine, and travel tips. Keep it concise and informative.`,
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        return content;
      }

      return "Unable to generate recommendation";
    } catch (error: any) {
      // Log the real error for devs but throw a friendlier one back to the controller.
      console.error("Error getting AI recommendation:", error.message || error);
      throw new Error("Failed to get recommendation. Please try again later.");
    }
  }
}

// One shared instance used by the controllers.
export const aiRecommendationService = new AIRecommendationService();
