import express, { Request, Response, Router } from "express";
import { mcpService } from "../4-services/mcp-service";
import { securityMiddleware } from "../6-middleware/security-middleware";
import { StatusCode } from "../3-models/enums";

// MCP endpoint: lets the user ask plain-English questions about the vacations DB.
class MCPController {
  public router: Router = express.Router();

  public constructor() {
    this.router.post("/api/mcp/query", securityMiddleware.verifyToken, this.mcpQuery);
  }

  // POST /api/mcp/query — pass the user's question to the AI and send back the answer.
  private async mcpQuery(request: Request, response: Response) {
    const { query } = request.body;
    const answer = await mcpService.query(query);
    response.status(StatusCode.OK).json({ answer });
  }
}

// One shared instance — its router is mounted in app.ts.
export const mcpController = new MCPController();
