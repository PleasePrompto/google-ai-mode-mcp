/**
 * Search Handler for Google AI Search Mode
 *
 * Orchestrates the entire search flow:
 * 1. Navigate to Google AI Search
 * 2. Check for CAPTCHA
 * 3. Extract response and citations
 * 4. Convert to markdown
 * 5. Return result
 */

import type { SearchResult, SearchOptions } from "../types.js";
import { BrowserManager } from "../browser/browser-manager.js";
import { CaptchaDetector } from "../browser/captcha-detector.js";
import { ResponseParser } from "./response-parser.js";
import { MarkdownConverter } from "./markdown-converter.js";
import { CONFIG, applyBrowserOptions } from "../config.js";
import { log } from "../utils/logger.js";
import { CaptchaTimeoutError } from "../errors.js";
import { waitForAiCompletion, checkAiModeAvailability } from "../utils/completion-detector.js";

export class SearchHandler {
  private browserManager: BrowserManager;
  private captchaDetector: CaptchaDetector;
  private responseParser: ResponseParser;
  private markdownConverter: MarkdownConverter;

  constructor() {
    this.browserManager = new BrowserManager();
    this.captchaDetector = new CaptchaDetector();
    this.responseParser = new ResponseParser();
    this.markdownConverter = new MarkdownConverter();

    log.info("🔍 SearchHandler initialized");
  }

  /**
   * Build Google AI Search URL
   */
  private buildSearchUrl(query: string): string {
    const encodedQuery = encodeURIComponent(query);
    return `https://www.google.com/search?udm=50&q=${encodedQuery}`;
  }

  /**
   * Execute a search and return result
   */
  async executeSearch(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      log.info("="

.repeat(80));
      log.info(`🔍 Starting Google AI Search: "${query}"`);
      log.info("=".repeat(80));

      // Apply options to config
      const config = applyBrowserOptions(options);

      // Get browser context
      const context = await this.browserManager.getOrCreateContext(
        config.headless
      );

      // Create new page
      const page = await context.newPage();

      // Build search URL
      const searchUrl = this.buildSearchUrl(query);
      log.info(`📍 URL: ${searchUrl}`);

      try {
        // Navigate to Google AI Search
        log.info("🌐 Navigating to Google AI Search...");
        await page.goto(searchUrl, {
          waitUntil: "networkidle", // Wait for network to be idle to captures redirects/AJAX correctly
          timeout: CONFIG.browserTimeout,
        });

        // Check for CAPTCHA (immediate)
        log.info("🔒 Checking for CAPTCHA...");
        const captchaState = await this.captchaDetector.detectCaptcha(page);

        if (captchaState.detected) {
          // CAPTCHA detected - handle it
          const needsBrowserRestart = this.browserManager.recordCaptcha();

          if (needsBrowserRestart) {
            // Too many consecutive CAPTCHAs - restart browser
            await page.close();
            await this.browserManager.restartBrowser("max consecutive CAPTCHAs");

            // Return error indicating browser restart
            return {
              success: false,
              markdown: "",
              sources: [],
              query,
              captchaRequired: true,
              error: "Too many consecutive CAPTCHAs - browser restarted. Please try again.",
            };
          }

          // Switch to visible mode
          await this.browserManager.switchToVisibleMode();

          // Get visible context and create new page
          const visibleContext =
            await this.browserManager.getOrCreateContext(false);
          await page.close();
          const visiblePage = await visibleContext.newPage();

          // Navigate again in visible mode
          await visiblePage.goto(searchUrl, {
            waitUntil: "domcontentloaded",
            timeout: CONFIG.browserTimeout,
          });

          // Handle CAPTCHA (wait for solution)
          try {
            await this.captchaDetector.handleCaptcha(visiblePage);

            // Check AI Mode availability (region/language restrictions)
            const aiModeAvailable = await checkAiModeAvailability(visiblePage);
            if (!aiModeAvailable) {
              await visiblePage.close();
              return {
                success: false,
                markdown: "",
                sources: [],
                query,
                error: "Google AI Mode is not available in your country or language. Please use a proxy/VPN to access from a supported region (e.g., US, UK, Germany).",
              };
            }

            // Wait for AI response completion (SVG → aria-label → text → timeout)
            await waitForAiCompletion(visiblePage);

            // CAPTCHA solved - continue with visible page
            // Don't switch back to headless yet - keep using visible page for this search
            const result = await this.performSearch(visiblePage, query);

            // Close page
            await visiblePage.close();

            // Switch back to headless mode for next search
            await this.browserManager.switchToHeadlessMode();

            // Reset CAPTCHA counter on success
            this.browserManager.resetCaptchaCounter();

            return result;
          } catch (error) {
            if (error instanceof CaptchaTimeoutError) {
              await visiblePage.close();

              return {
                success: false,
                markdown: "",
                sources: [],
                query,
                captchaRequired: true,
                error: "CAPTCHA timeout - please solve CAPTCHA manually",
              };
            }

            throw error;
          }
        } else {
          // No CAPTCHA - check AI Mode availability and wait for completion
          const aiModeAvailable = await checkAiModeAvailability(page);
          if (!aiModeAvailable) {
            await page.close();
            return {
              success: false,
              markdown: "",
              sources: [],
              query,
              error: "Google AI Mode is not available in your country or language. Please use a proxy/VPN to access from a supported region (e.g., US, UK, Germany).",
            };
          }

          // Wait for AI response completion (SVG → aria-label → text → timeout)
          await waitForAiCompletion(page);

          // Proceed with search
          const result = await this.performSearch(page, query);

          // Close page
          await page.close();

          // Reset CAPTCHA counter on success
          this.browserManager.resetCaptchaCounter();

          return result;
        }
      } catch (error) {
        // Close page on error
        await page.close();
        throw error;
      }
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      log.error(`❌ Search failed after ${elapsed}s: ${error}`);

      return {
        success: false,
        markdown: "",
        sources: [],
        query,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Perform the actual search (after CAPTCHA is handled)
   */
  private async performSearch(
    page: any,
    query: string
  ): Promise<SearchResult> {
    try {
      // Extract AI response, citations, and sources (all in one - 1:1 clone from skill!)
      log.info("📝 Extracting AI response and citations...");
      const { html, citations } = await this.responseParser.extractAiResponse(
        page
      );

      // Convert to markdown (citations → footnotes, returns sources!)
      log.info("📄 Converting to markdown...");
      const { markdown, sources: embeddedSources } = this.markdownConverter.convert(
        html,
        citations,
        [] // Empty array, converter gets sources from citations
      );

      log.info("=".repeat(80));
      log.success("✅ Search completed successfully!");
      log.info(`   Citations: ${citations.length}`);
      log.info(`   Sources: ${embeddedSources.length}`);
      log.info(`   Markdown length: ${markdown.length} chars`);
      log.info("=".repeat(80));

      return {
        success: true,
        markdown,
        sources: embeddedSources, // Use sources from markdown converter!
        query,
      };
    } catch (error) {
      log.error(`Search execution failed: ${error}`);
      throw error;
    }
  }

  /**
   * Cleanup and close browser
   */
  async cleanup(): Promise<void> {
    log.info("🧹 Cleaning up SearchHandler...");
    await this.browserManager.closeContext();
    log.success("✅ Cleanup complete");
  }
}
