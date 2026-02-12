/**
 * MCP Tool Definition for Google AI Search
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const SEARCH_AI_TOOL: Tool = {
  name: "search_ai",
  description: `Search Google AI Mode (udm=50) and return AI-generated summary with citations.

Returns markdown-formatted AI response with inline citations [1][2] and source list.

Features:
- Automatic CAPTCHA detection and handling
- Source extraction with citations
- Clean markdown formatting
- Stealth mode for anti-detection
- Optional file saving with timestamp and sanitized filename

Note: If CAPTCHA is detected, you will be prompted to solve it in a visible browser window.`,

  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query to send to Google AI Mode",
      },
      headless: {
        type: "boolean",
        description:
          "Optional: Run browser in headless mode (default: true). Set to false to see the browser.",
      },
      timeout_ms: {
        type: "number",
        description:
          "Optional: Timeout in milliseconds for the search (default: 120000 = 2 minutes)",
      },
      save_to_file: {
        type: "boolean",
        description:
          "Optional: Save markdown result to file (default: false). Saves to results/ folder with timestamp.",
      },
      filename: {
        type: "string",
        description:
          "Optional: Custom filename for saved result (only used if save_to_file is true). If not provided, auto-generates from query and timestamp.",
      },
    },
    required: ["query"],
  },
};

export const CLEAR_PROFILE_TOOL: Tool = {
  name: "clear_browser_profile",
  description: "Clears the browser profile (cookies, session, cache). Useful for resetting Google login or fixing persistent issues.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

