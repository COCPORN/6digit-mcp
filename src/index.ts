#!/usr/bin/env node

// Import from the MCP SDK
// This creates a simple MCP server with an echo tool that returns whatever message it receives
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ConvexClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "./api.js";

const CONVEX_URL =
  process.env.CONVEX_URL || "https://clever-starling-109.convex.cloud";

const convexClient = new ConvexClient(CONVEX_URL);

const API_KEY = process.env.API_KEY;
const CONFIGURATION = process.env.MCP_CONFIGURATION;
if (!API_KEY) {
  console.error("API_KEY is not set");
  process.exit(1);
}

if (!CONFIGURATION) {
  console.error("CONFIGURATION is not set");
  process.exit(1);
}

const mcpConfiguration = await convexClient.query(api.mcps.get_configuration, {
  api_key: API_KEY as Id<"api_keys">,
});

console.error("Starting MCP server: ", mcpConfiguration);

// Create and start the MCP server
async function startServer() {
  // Create the MCP server with basic server info
  const server = new McpServer({
    name: mcpConfiguration.name,
    version: mcpConfiguration.version,
    description: mcpConfiguration.description,
  });

  if (!server) {
    console.error("Failed to create MCP server");
    process.exit(1);
  }

  // Register an echo tool that will respond with the input message
  // server.tool(
  //   "echo",
  //   "Echoes back the input message",
  //   { message: z.string().describe("The message to echo back") },
  //   (args, _extra) => {
  //     console.error("Echo tool called with params:", args);
  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: `Echo: ${args.message}`,
  //         },
  //       ],
  //     };
  //   },
  // );

  // Create a stdio transport (communicates via stdin/stdout)
  const transport = new StdioServerTransport();

  // Connect the server to the transport
  await server.connect(transport);

  console.error("MCP server started");

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.error("Shutting down server...");
    await server.close();
    process.exit(0);
  });
}

// Start the server
startServer().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});
