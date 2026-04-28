[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/pleaseprompto-google-ai-mode-mcp-badge.png)](https://mseep.ai/app/pleaseprompto-google-ai-mode-mcp)

<div align="center">

# Google AI Mode MCP Server

### **Supercharge Any LLM's Web Research with Google AI Mode**

**For: All MCP-compatible LLMs** (Claude, Cursor, Cline, Windsurf, Zed, etc.)

Transform your LLM's online research capabilities by connecting it directly to Google's AI Mode—getting AI-synthesized answers from 100+ sources instead of scattered search results.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-2026-green.svg)](https://modelcontextprotocol.io/)
[![npm](https://img.shields.io/npm/v/google-ai-mode-mcp.svg)](https://www.npmjs.com/package/google-ai-mode-mcp)
[![Claude Code Skill](https://img.shields.io/badge/Claude_Code-Skill_Version-purple.svg)](https://github.com/PleasePrompto/google-ai-mode-skill)
[![GitHub](https://img.shields.io/github/stars/PleasePrompto/google-ai-mode-mcp?style=social)](https://github.com/PleasePrompto/google-ai-mode-mcp)

### Why This Matters

Most built-in web research is mediocre. This MCP server gives **any LLM professional-grade research** by tapping into Google's AI Mode—the same technology that synthesizes information from dozens of websites into one cited answer.

**Example Use Cases:**
```
"Next.js 15 App Router best practices 2026 with server components examples"
→ AI-synthesized coding guide with inline citations [1][2][3]

"Compare PostgreSQL vs MySQL JSON performance 2026, include benchmarks"
→ Technical comparison table with real-world data

"Find the latest EU AI regulations 2026 and their impact on startups"
→ Legal overview with official government sources

"Best noise-cancelling headphones under €300, compare Sony vs Bose"
→ Product comparison with reviews and specs

"Intermittent fasting protocols 2026, include recent scientific studies"
→ Health guide with medical research citations
```

**Result:** Research on **ANY topic**—coding, tech comparisons, regulations, product reviews, health, finance, travel. Curated answers with sources. Saves tokens. Superior to generic web search.

[Installation](#installation) • [Quick Start](#quick-start) • [How It Works](#how-it-works) • [Examples](#example-use-case) • [Claude Code Skill](https://github.com/PleasePrompto/google-ai-mode-skill) • [FAQ](#faq)

</div>

---

## 📋 Last Updates (2026-01-08)

**v2.0 - Multi-Language & Detection Overhaul**

✅ **4-Stage Completion Detection** - SVG thumbs-up → aria-label → text → 40s timeout
✅ **Multi-Language Support** - Works in DE/EN/NL/ES/FR/IT browser locales
✅ **87% Faster** - Average 4s detection (was 2s fixed wait)
✅ **AI Mode Availability Check** - Detects region restrictions with proxy suggestion
✅ **17 Citation Selectors** - Language-agnostic fallback chain
✅ **15 Cutoff Markers** - Cleaner content extraction across languages

<details>
<summary>📖 Show previous updates</summary>

**v1.5** - Persistent browser context, CAPTCHA handling improvements
**v1.0** - Initial MCP server release

</details>

---

## What This Is

An MCP server that connects your code agent (Claude, Cursor, Cline, etc.) to **Google AI Mode**—Google's AI-powered search that synthesizes information from dozens of web sources into a single, cited answer.

Instead of your agent reading page after page, Google does the heavy lifting. Your agent gets one clean, structured response with inline citations.

**The advantage:** Free, token-efficient research with grounded sources.

---

## How It Works

```
Your agent asks a question
         ↓
Server launches stealth browser
         ↓
Google AI Mode searches & synthesizes dozens of sources
         ↓
Server extracts AI answer + citations
         ↓
Converts to clean Markdown with [1][2][3] references
         ↓
Your agent receives final answer (optionally saved to .md file)
```

**The key difference:**

Traditional web research:
- Agent searches Google → gets 10 links
- Agent reads 5-10 full pages → thousands of tokens consumed
- Agent synthesizes manually → risks missing details or hallucinating
- You pay for all those tokens

With this server:
- Google AI Mode searches + synthesizes → one request
- Your agent receives one clean, cited answer → minimal tokens
- Google's sources are preserved → verifiable, grounded
- It's free (uses public Google Search)

---

## Why This Matters

Google AI Mode (the `udm=50` parameter) makes Google search work like a research assistant. It:
- Reads and analyzes dozens of websites automatically
- Synthesizes findings into structured answers
- Cites every claim with source links
- Handles follow-up context across queries

Your agent gets the benefits without doing the work—or burning the tokens

---

## Installation

Works with any MCP-compatible code agent. Choose your setup:

**Claude Code:**
```bash
claude mcp add google-ai-search npx google-ai-mode-mcp@latest
```

**Codex:**
```bash
codex mcp add google-ai-search -- npx google-ai-mode-mcp@latest
```

**Linux/WSL users on Codex:** If you get a "Missing X-Server" error when trying to show the browser for CAPTCHA solving, use xvfb-run:
```json
{
  "mcpServers": {
    "google-ai-search": {
      "command": "xvfb-run",
      "args": ["-a", "npx", "google-ai-mode-mcp@latest"]
    }
  }
}
```
Install xvfb if needed: `sudo apt-get install xvfb`

**Cline:**
```bash
cline mcp add google-ai-search -- npx google-ai-mode-mcp@latest
```

**Gemini:**
```bash
gemini mcp add google-ai-mode npx -y google-ai-mode-mcp@latest --scope user
```

**VS Code:**
```bash
code --add-mcp '{"name":"google-ai-search","command":"npx","args":["google-ai-mode-mcp@latest"]}'
```

**Cursor, Windsurf, Zed, or other MCP clients:**

Add to your MCP config file:

```json
{
  "mcpServers": {
    "google-ai-search": {
      "command": "npx",
      "args": ["google-ai-mode-mcp@latest"]
    }
  }
}
```

Cursor uses `~/.cursor/mcp.json`, Windsurf and Zed have their own settings files. Check your agent's documentation for the config location

---

## Quick Start

Ask your agent naturally:

```
"Search Google AI Mode for: Next.js 15 App Router best practices"
```

```
"What are the new features in Astro 4.0?"
```

```
"Research React Server Components and save the results"
```

The agent will automatically use the MCP server to query Google AI Mode and return a clean, cited answer.

**To save results to a file:**

```
"Search for TypeScript 5.4 features and save it"
```

Files are saved to platform-specific locations:
- **Linux**: `~/.local/share/google-ai-mode-mcp/results/`
- **macOS**: `~/Library/Application Support/google-ai-mode-mcp/results/`
- **Windows**: `%LOCALAPPDATA%\google-ai-mode-mcp\results\`

Filenames: `2026-01-04_15-30-45_typescript_5_4.md`

---

## First Run: CAPTCHA Handling

On your first query, Google may show a CAPTCHA to verify you're human. This is normal when the browser profile is created.

**If you see a CAPTCHA error:**
1. Ask your agent: "Switch to visible mode" or "Turn off headless mode"
2. The browser will open visibly
3. Solve the CAPTCHA manually
4. The server detects the solution automatically and continues
5. Next queries will be headless again

After the first CAPTCHA, searches typically run smoothly. The server uses stealth techniques and a persistent browser profile to minimize future CAPTCHAs

---

## Troubleshooting

**Repeated CAPTCHAs:**

If Google keeps showing CAPTCHAs:
- Tell your agent: "Use visible browser for this search"
- Add 10-30 second delays between searches
- The server automatically restarts after 3 consecutive CAPTCHAs

**Browser won't launch:**

Clear the browser profile:
```bash
# Linux/macOS
rm -rf ~/.local/share/google-ai-mode-mcp/chrome_profile

# Windows
rmdir /s "%LOCALAPPDATA%\google-ai-mode-mcp\chrome_profile"
```

**Wrong language results:**

The server forces English results. If you still get wrong languages, clear the profile (see above).

**Missing citations:**

Update to the latest version:
```bash
npm update -g google-ai-mode-mcp
```

---

## Configuration (Optional)

The server works out of the box. Advanced users can customize via environment variables:

```bash
# Browser settings
export GOOGLE_AI_HEADLESS=true              # Run browser invisibly
export GOOGLE_AI_STEALTH_ENABLED=true       # Use anti-detection techniques

# Timeouts
export GOOGLE_AI_RESPONSE_TIMEOUT=30000     # 30 seconds to get AI response
export GOOGLE_AI_CAPTCHA_TIMEOUT=300000     # 5 minutes to solve CAPTCHA

# CAPTCHA handling
export GOOGLE_AI_CAPTCHA_POLL_INTERVAL=3000 # Check every 3 seconds
export GOOGLE_AI_CAPTCHA_MAX_CONSECUTIVE=3  # Restart after 3 CAPTCHAs
export GOOGLE_AI_CAPTCHA_COOLDOWN_MS=30000  # 30 second cooldown
```

See `.env.example` for all options.

---

## Tool Reference

The server exposes one tool: `search_ai`

**Parameters:**
- `query` (required) - Your search question
- `headless` (optional) - Run browser invisibly (default: `true`)
- `timeout_ms` (optional) - Request timeout in milliseconds (default: `120000`)
- `save_to_file` (optional) - Save result to .md file (default: `false`)
- `filename` (optional) - Custom filename without `.md` extension

**Returns:**
```json
{
  "success": true,
  "markdown": "# AI response with citations [1][2]\n\nSources:\n[1] [Title](url)",
  "sources": [
    { "title": "Source Title", "url": "https://example.com", "domain": "example.com" }
  ],
  "query": "Your query",
  "savedTo": "/path/to/results/file.md"
}
```

**Usage examples:**

Basic search:
```javascript
{ "query": "Rust async patterns 2026" }
```

Save to file:
```javascript
{ "query": "Next.js 15 features", "save_to_file": true, "filename": "nextjs-15-guide" }
```

Visible browser (for CAPTCHA or debugging):
```javascript
{ "query": "PostgreSQL optimization", "headless": false }
```

---

## Example Use Case

You need to implement OAuth2 in a framework you've never used before.

**Traditional approach:**
- Your agent searches Google, gets 10 links
- Reads multiple documentation pages and blog posts
- Consumes thousands of tokens
- May miss important details or synthesize incorrectly

**With this server:**
```
"Search Google AI Mode for: Hono OAuth2 implementation guide"
```

- Google reads and synthesizes sources automatically
- Your agent gets one structured answer with code examples and citations
- Minimal token usage
- Sources are linked for verification

The agent can then use this grounded information to write the actual implementation.

---

## FAQ

**Does this work with my code agent?**
Yes. Any MCP-compatible client: Claude Code, Cursor, Codex, Cline, Windsurf, Zed, VS Code MCP, etc.

**Is it free?**
Yes. The server is open source, and it uses public Google Search. No API keys or subscriptions needed.

**How accurate are the results?**
Results come from Google's AI Mode, which cites sources for every claim. Always verify critical details via the linked sources.

**What about privacy?**
Everything runs locally on your machine. The browser profile stays on your computer. No credentials or external services required beyond Google Search.

**Can I see the browser while it works?**
Yes. Set `headless: false` in the tool call, or ask your agent to use visible mode.

**Why not just use regular web search?**
Regular search returns links. Your agent then reads 5-10 pages, consuming thousands of tokens. This server has Google do the synthesis, so your agent gets one clean answer for minimal token cost.

---

## Tips for Better Results

**Be specific with your queries:**

Instead of: "React hooks"
Try: "React hooks best practices 2026 (useState, useEffect, custom hooks)"

**Include version numbers:**

Instead of: "Next.js features"
Try: "Next.js 15 new features and breaking changes"

**Request structured output:**

"Compare PostgreSQL vs MySQL 2026 with a performance comparison table"

**Ask for examples:**

"Show me TypeScript discriminated union examples with type narrowing"

---

## Development

Want to contribute or run from source?

```bash
git clone https://github.com/PleasePrompto/google-ai-mode-mcp.git
cd google-ai-mode-mcp
npm install
npm run build

# Development with auto-reload
npm run dev

# Watch mode for continuous building
npm run watch
```

---

## Important Notes

**CAPTCHA handling:**
Google may show a CAPTCHA on first use or if you search very frequently. When this happens, ask your agent to show the browser ("switch to visible mode"). Once you solve the CAPTCHA manually, you're usually good to go for future searches.

**Responsible use:**
This tool automates browser interactions with Google Search. Use it responsibly and be mindful of Google's Terms of Service. Add delays between heavy search sessions if needed.

**Verification:**
While results come from Google's AI Mode with source citations, always verify critical information via the linked sources. This is a research tool, not a source of truth.

---

## Contributing

Found an issue or want to contribute?

- Report bugs: [GitHub Issues](https://github.com/PleasePrompto/google-ai-mode-mcp/issues)
- Pull requests: Welcome
- Contact: [github@geromedexheimer.de](mailto:github@geromedexheimer.de)

---

## License

MIT License - see LICENSE file for details

---

## Claude Code Users

Using Claude Code? There's a lightweight **skill-only version** of this server that integrates directly into your Claude Code workflow without requiring a separate MCP server installation.

**Check it out:** [google-ai-mode-skill](https://github.com/PleasePrompto/google-ai-mode-skill)

The skill version is perfect if you want the same Google AI Mode functionality with even simpler setup for Claude Code.

---

**Built by [Gérôme Dexheimer](mailto:github@geromedexheimer.de)**
