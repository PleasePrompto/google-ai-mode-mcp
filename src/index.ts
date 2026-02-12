#!/usr/bin/env node

/**
 * Google AI Search Mode MCP Server
 *
 * MCP Server for Google AI Search Mode (udm=50) with CAPTCHA handling
 *
 * Features:
 * - Single tool: search_ai(query)
 * - Automatic CAPTCHA detection and handling
 * - Markdown output with inline citations
 * - Stateless design (no authentication or sessions)
 * - Stealth mode with Patchright
 *
 * Usage:
 *   npx google-ai-mode-mcp
 *   node dist/index.js
 *
 * Environment Variables:
 *   GOOGLE_AI_HEADLESS - Run browser in headless mode (default: true)
 *   GOOGLE_AI_CAPTCHA_TIMEOUT - CAPTCHA timeout in ms (default: 300000)
 *   GOOGLE_AI_STEALTH_ENABLED - Enable stealth mode (default: true)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { ToolHandler } from "./tools/tool-handler.js";
import { SEARCH_AI_TOOL, CLEAR_PROFILE_TOOL } from "./tools/search-tool.js";
import {
  GOOGLE_AI_SEARCH_PROMPT,
  GOOGLE_AI_SEARCH_PROMPT_TEMPLATE,
} from "./tools/search-prompt.js";
import { CONFIG } from "./config.js";
import { log } from "./utils/logger.js";

/**
 * Main MCP Server Class
 */
class GoogleAiSearchMCPServer {
  private server: Server;
  private toolHandler: ToolHandler;

  constructor() {
    // Initialize MCP Server
    this.server = new Server(
      {
        name: "google-ai-mode-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          completions: {}, // Required for completion/complete support
          logging: {},
        },
      }
    );

    // Initialize tool handler
    this.toolHandler = new ToolHandler();

    // Setup handlers
    this.setupHandlers();
    this.setupShutdownHandlers();

    log.info("🚀 Google AI Search Mode MCP Server initialized");
    log.info(`  Version: 1.0.0`);
    log.info(`  Node: ${process.version}`);
    log.info(`  Platform: ${process.platform}`);
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      log.info("📋 [MCP] list_tools request received");
      return {
        tools: [SEARCH_AI_TOOL, CLEAR_PROFILE_TOOL],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const progressToken = (args as any)?._meta?.progressToken;

      log.info(`🔧 [MCP] Tool call: ${name}`);
      if (progressToken) {
        log.info(`  📊 Progress token: ${progressToken}`);
      }

      // Create progress callback function
      const sendProgress = async (
        message: string,
        progress?: number,
        total?: number
      ) => {
        if (progressToken) {
          await this.server.notification({
            method: "notifications/progress",
            params: {
              progressToken,
              message,
              ...(progress !== undefined && { progress }),
              ...(total !== undefined && { total }),
            },
          });
          log.dim(`  📊 Progress: ${message}`);
        }
      };

      try {
        let result;

        switch (name) {
          case "search_ai":
            result = await this.toolHandler.handleSearchAi(
              args as { query: string; headless?: boolean; timeout_ms?: number },
              sendProgress
            );
            break;

          case "clear_browser_profile":
            result = await this.toolHandler.handleClearProfile(sendProgress);
            break;

          default:
            log.error(`❌ [MCP] Unknown tool: ${name}`);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: false,
                      error: `Unknown tool: ${name}`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
        }

        // Return result
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        log.error(`❌ [MCP] Tool execution error: ${errorMessage}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: errorMessage,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      log.info("📋 [MCP] list_prompts request received");
      return {
        prompts: [GOOGLE_AI_SEARCH_PROMPT],
      };
    });

    // Get prompt with variable substitution
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      log.info(`📝 [MCP] get_prompt request: ${name}`);

      if (name === GOOGLE_AI_SEARCH_PROMPT.name) {
        const userQuery = (args?.user_query as string) || "";

        // Substitute template variables
        const promptText = GOOGLE_AI_SEARCH_PROMPT_TEMPLATE.replace(
          /\{\{user_query\}\}/g,
          userQuery
        );

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: promptText,
              },
            },
          ],
        };
      }

      log.error(`❌ [MCP] Unknown prompt: ${name}`);
      throw new Error(`Unknown prompt: ${name}`);
    });
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    let shuttingDown = false;

    const shutdown = async (signal: string) => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;

      log.info(`\n🛑 Received ${signal}, shutting down gracefully...`);

      try {
        // Cleanup tool handler
        await this.toolHandler.cleanup();

        // Close server
        await this.server.close();

        log.success("✅ Shutdown complete");
        process.exit(0);
      } catch (error) {
        log.error(`❌ Error during shutdown: ${error}`);
        process.exit(1);
      }
    };

    const requestShutdown = (signal: string) => {
      void shutdown(signal);
    };

    process.on("SIGINT", () => requestShutdown("SIGINT"));
    process.on("SIGTERM", () => requestShutdown("SIGTERM"));

    process.on("uncaughtException", (error) => {
      log.error(`💥 Uncaught exception: ${error}`);
      log.error(error.stack || "");
      requestShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      log.error(`💥 Unhandled rejection at: ${promise}`);
      log.error(`Reason: ${reason}`);
      requestShutdown("unhandledRejection");
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    log.info("🎯 Starting Google AI Search Mode MCP Server...");
    log.info("");
    log.info("📝 Configuration:");
    log.info(`  Data Dir: ${CONFIG.dataDir}`);
    log.info(`  Browser Profile: ${CONFIG.browserProfileDir}`);
    log.info(`  Headless: ${CONFIG.headless}`);
    log.info(`  Stealth: ${CONFIG.stealthEnabled}`);
    log.info(`  CAPTCHA Timeout: ${CONFIG.captchaTimeout / 1000}s`);
    log.info("");

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await this.server.connect(transport);

    log.success("✅ MCP Server connected via stdio");
    log.success("🎉 Ready to receive requests from Claude Code!");
    log.info("");
    log.info("💡 Available tool:");
    log.info(`  - ${SEARCH_AI_TOOL.name}: ${SEARCH_AI_TOOL.description?.split('\n')[0] || 'Google AI Search'}`);
    log.info("");
    log.info("📝 Available prompt:");
    log.info(`  - ${GOOGLE_AI_SEARCH_PROMPT.name}: ${GOOGLE_AI_SEARCH_PROMPT.description}`);
    log.info("");
  }
}

/**
 * Main entry point
 */
async function main() {
  // Print banner
  console.error("╔══════════════════════════════════════════════════════════╗");
  console.error("║                                                          ║");
  console.error("║        Google AI Search Mode MCP Server v1.0.0          ║");
  console.error("║                                                          ║");
  console.error("║   Search Google AI Mode with CAPTCHA handling via MCP   ║");
  console.error("║                                                          ║");
  console.error("╚══════════════════════════════════════════════════════════╝");
  console.error("");

  try {
    const server = new GoogleAiSearchMCPServer();
    await server.start();
  } catch (error) {
    log.error(`💥 Fatal error starting server: ${error}`);
    if (error instanceof Error) {
      log.error(error.stack || "");
    }
    process.exit(1);
  }
}

// Run the server
main();
