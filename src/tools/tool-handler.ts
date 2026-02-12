/**
 * MCP Tool Handler for Google AI Search
 */

import * as fs from "fs";
import * as path from "path";
import type { SearchResult, SearchOptions, ProgressCallback } from "../types.js";
import { SearchHandler } from "../search/search-handler.js";
import { CONFIG } from "../config.js";
import { log } from "../utils/logger.js";

export class ToolHandler {
  private searchHandler: SearchHandler;

  constructor() {
    this.searchHandler = new SearchHandler();
  }

  /**
   * Handle search_ai tool call
   */
  async handleSearchAi(
    args: {
      query: string;
      headless?: boolean;
      timeout_ms?: number;
      save_to_file?: boolean;
      filename?: string;
    },
    sendProgress: ProgressCallback
  ): Promise<SearchResult> {
    try {
      const { query, headless, timeout_ms, save_to_file, filename } = args;

      // Validate query
      if (!query || query.trim().length === 0) {
        return {
          success: false,
          markdown: "",
          sources: [],
          query: "",
          error: "Query cannot be empty",
        };
      }

      log.info(`🔍 Tool call: search_ai("${query}")`);

      // Build options
      const options: SearchOptions = {};
      if (headless !== undefined) {
        options.headless = headless;
      }
      if (timeout_ms !== undefined) {
        options.timeout_ms = timeout_ms;
      }

      // Send progress: Starting search
      await sendProgress("Navigating to Google AI Search...");

      // Execute search
      const result = await this.searchHandler.executeSearch(query, options);

      // Save to file if requested and search was successful
      if (save_to_file && result.success && result.markdown) {
        try {
          await sendProgress("Saving result to file...");
          const savedPath = await this.saveToFile(
            result.markdown,
            query,
            filename
          );
          result.savedTo = savedPath;
          log.success(`📄 Saved to: ${savedPath}`);
        } catch (error) {
          log.warning(`Failed to save file: ${error}`);
          result.saveError = error instanceof Error ? error.message : String(error);
        }
      }

      // Send progress based on result
      if (result.success) {
        await sendProgress("Search completed successfully!", 100, 100);
      } else if (result.captchaRequired) {
        await sendProgress(
          "CAPTCHA detected - please solve in visible browser"
        );
      } else {
        await sendProgress(`Search failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      log.error(`Tool handler error: ${error}`);

      return {
        success: false,
        markdown: "",
        sources: [],
        query: args.query || "",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Save markdown result to file
   * @param markdown - The markdown content to save
   * @param query - The search query (used for auto-generated filename)
   * @param customFilename - Optional custom filename
   * @returns Path to the saved file
   */
  private async saveToFile(
    markdown: string,
    query: string,
    customFilename?: string
  ): Promise<string> {
    // Create results directory
    const resultsDir = path.join(CONFIG.dataDir, "results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Generate filename
    let filename: string;
    if (customFilename) {
      // Sanitize filename to prevent Path Traversal
      const sanitized = path.basename(customFilename);
      // Use sanitized filename, ensure .md extension
      filename = sanitized.endsWith(".md")
        ? sanitized
        : `${sanitized}.md`;
    } else {
      // Auto-generate from query and timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .split(".")[0]; // YYYY-MM-DD_HH-MM-SS
      const safeName = query
        .substring(0, 40) // Max 40 chars
        .replace(/[^a-zA-Z0-9]/g, "_") // Replace non-alphanumeric with _
        .replace(/_+/g, "_") // Collapse multiple underscores
        .replace(/^_|_$/g, ""); // Trim underscores from start/end
      filename = `${timestamp}_${safeName}.md`;
    }

    // Write file
    const filePath = path.join(resultsDir, filename);
    fs.writeFileSync(filePath, markdown, "utf-8");

    return filePath;
  }

  /**
   * Handle clear_browser_profile tool call
   */
  async handleClearProfile(sendProgress: ProgressCallback): Promise<any> {
    try {
      log.info("🧹 Tool call: clear_browser_profile");
      
      // 1. Close search handler (which closes the current browser context)
      await sendProgress("Terminating active browser sessions...");
      await this.searchHandler.cleanup();

      // 2. Cooldown to allow OS to release file locks
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Wipe browser profile data
      await sendProgress("Wiping browser profile data...");
      
      const profileDir = CONFIG.browserProfileDir;
      if (fs.existsSync(profileDir)) {
        try {
          // Recursive deletion of profile directory
          // Using force:true to ignore non-existent files and handle read-only files
          fs.rmSync(profileDir, { recursive: true, force: true });
          
          // Triple-check: if still exists, it might be a permission/lock issue
          if (fs.existsSync(profileDir)) {
            log.warning(`⚠️ Profile directory still exists at: ${profileDir} - attempting second pass`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            fs.rmSync(profileDir, { recursive: true, force: true });
          }

          log.success(`✅ Profile cleared at: ${profileDir}`);
        } catch (rmError) {
          log.error(`Deletion failed: ${rmError}`);
          // On Windows, if process is still locked, we might need to inform the user
          if (process.platform === 'win32') {
             throw new Error(`Could not delete profile directory. It may be locked by another process. Please close all Chrome/Chromium windows and try again.`);
          }
          throw rmError;
        }
      } else {
        log.info("Profile directory already empty or not found.");
      }

      await sendProgress("Profile cleared successfully!", 100, 100);

      return {
        success: true,
        message: "Browser profile cleared successfully. Local history, sessions, and cookies have been removed.",
      };
    } catch (error) {
      log.error(`Clear profile error: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Cleanup handler
   */
  async cleanup(): Promise<void> {
    await this.searchHandler.cleanup();
  }
}
