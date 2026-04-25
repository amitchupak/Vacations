import OpenAI from "openai";
import { vacationService } from "./vacation-service";
import { IVacation } from "../3-models/vacation";

// The exact sentence we want the AI (or the post-check) to use when refusing.
// Kept as a constant so the prompt and the validator stay in sync.
const REFUSAL_MESSAGE = "I can only answer questions about the vacations in our database.";

// Words that suggest the answer is actually about vacations (not Justin Bieber).
const VACATION_KEYWORDS = [
  "vacation", "vacations", "trip", "trips", "destination", "destinations",
  "price", "prices", "cheapest", "expensive", "upcoming", "active",
  "start date", "end date", "depart", "return", "package", "packages",
];

// Lets users ask plain-English questions about our vacations.
// We give the AI the current vacation list as context so its answers are based on real data.
class MCPService {
  private apiKey = process.env.OPENAI_API_KEY || "";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  // Send the user's question together with our vacation list to the AI and return the answer.
  async query(userQuery: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error("API key is not configured");
      }

      // Grab up to 100 vacations from the DB to give the AI context to answer from.
      const vacationData = await vacationService.getVacationsByFilter(1, 100, "all");
      const vacations = vacationData.vacations;
      const vacationContext = this.formatVacationsForContext(vacations);
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentYear = now.getFullYear();

      // Build the system prompt: strict rules + few-shot refusal examples + the vacation list.
      const systemPrompt = `You are a STRICT vacation database assistant.
You can ONLY answer questions about the vacations listed in the "Vacation data" section below.
You must NEVER use outside or general world knowledge.
You must NEVER answer questions about real people, celebrities, geography facts, history, science, news, code, recipes, opinions, definitions, or any general trivia — even if you know the answer from your training data.

If the user's question is NOT clearly and only about the vacations in the data below, you MUST reply with EXACTLY this single sentence and nothing else:
${REFUSAL_MESSAGE}

Do not greet, do not apologize, do not explain, do not add anything before or after the refusal sentence. Output the refusal sentence verbatim.

Allowed topics (only when the answer can be derived from the data below):
- Pricing, dates, durations, and destinations of the listed vacations.
- Filtering or sorting them (cheapest, most expensive, upcoming, active, by date range, by destination name, etc.).
- Counting or summarising the listed vacations.
- Whether a specific destination exists in the list.

When the user asks about "current", "active", "now", or "upcoming", compare vacation dates against the current date below.

Formatting rules for valid answers:
- Plain text only. No markdown symbols (no **, #, *, -, or bullet lists).
- 1 to 3 short paragraphs.
- Format every date as "Month DD, YYYY" (for example: "April 20, 2026").

Examples of how to behave:
User: Who is Justin Bieber?
Assistant: ${REFUSAL_MESSAGE}

User: What is the capital of France?
Assistant: ${REFUSAL_MESSAGE}

User: Write me a Python function that adds two numbers.
Assistant: ${REFUSAL_MESSAGE}

User: Tell me a joke.
Assistant: ${REFUSAL_MESSAGE}

User: What is the cheapest vacation?
Assistant: (a real answer based on the Vacation data below)

Current date: ${currentDate}
Current year: ${currentYear}

Vacation data:
${vacationContext}`;

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 1024,
        // Deterministic output so the model follows the rules consistently.
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery },
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) {
        return "Unable to process your query";
      }

      // Belt-and-suspenders: even if the model ignores the prompt, a server-side
      // check makes sure off-topic answers are replaced with the refusal.
      if (this.isOnTopicAnswer(content, vacations)) {
        return content;
      }

      console.warn("[MCPService] off-topic response replaced with refusal. User asked:", userQuery);
      return REFUSAL_MESSAGE;
    } catch (error: any) {
      console.error("Error processing MCP query:", error.message || error);
      throw new Error("Failed to process your query. Please try again later.");
    }
  }

  // True if the AI's answer is the refusal, OR clearly references something from
  // the vacations data (a destination name or a vacation-related keyword).
  private isOnTopicAnswer(answer: string, vacations: IVacation[]): boolean {
    const lower = answer.toLowerCase();

    // Already the exact refusal — let it through.
    if (lower.includes(REFUSAL_MESSAGE.toLowerCase())) return true;

    // The answer mentions one of our destinations by name → on topic.
    const mentionsDestination = vacations.some((vacation) => {
      const destination = (vacation.destination || "").toLowerCase().trim();
      return destination.length > 0 && lower.includes(destination);
    });
    if (mentionsDestination) return true;

    // The answer uses vacation-related vocabulary → on topic.
    const mentionsKeyword = VACATION_KEYWORDS.some((keyword) => lower.includes(keyword));
    if (mentionsKeyword) return true;

    // Answer references a price or a date — also a strong "on topic" signal.
    if (/\$\s?\d/.test(answer)) return true;
    if (/\b(20\d{2}|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(answer)) {
      return true;
    }

    return false;
  }

  // Turn the vacation list into a short bullet list the AI can read easily.
  private formatVacationsForContext(vacations: IVacation[]): string {
    if (vacations.length === 0) {
      return "No vacations available in the database.";
    }

    return vacations
      .map((vacation) => {
        const startDate = new Date(vacation.startDate).toLocaleDateString();
        const endDate = new Date(vacation.endDate).toLocaleDateString();
        return `- ${vacation.destination}: $${vacation.price} (${startDate} to ${endDate})`;
      })
      .join("\n");
  }
}

// One shared instance used by the controllers.
export const mcpService = new MCPService();
