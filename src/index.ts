#!/usr/bin/env node

// Import from the MCP SDK
// This creates a simple MCP server with an echo tool that returns whatever message it receives
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ConvexClient } from "convex/browser";
import { GenericId as Id } from "convex/values";
import { api } from "./api.js";
import { URL } from "url";
import {
  ReadResourceResult,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

console.error("Starting 6digit MCP server");

const CONVEX_URL =
  process.env.CONVEX_URL || "https://clever-starling-109.convex.cloud";

const convexClient = new ConvexClient(CONVEX_URL);

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set");
  process.exit(1);
}

const mcpConfiguration = await convexClient.query(api.mcps.get_configuration, {
  api_key: API_KEY as Id<"api_keys">,
});

console.error("Starting MCP server: ", mcpConfiguration);

const nodes = await convexClient.query(api.mcps.list_nodes_as_resources, {
  api_key: API_KEY as Id<"api_keys">,
  brain_ids: mcpConfiguration.brains,
});

console.error("Starting MCP server: ", nodes);

const node_context = await convexClient.query(api.mcps.get_node_context, {
  api_key: API_KEY as Id<"api_keys">,
  node_id: "jd7f2zewg8prpdp7g96xt9rbts76nkm9",
});

console.error("Starting MCP server: ", node_context);

async function readCallback(uri: URL): Promise<ReadResourceResult> {
  console.error("Read callback called with request:", uri);
  return {
    contents: [
      {
        type: "text/markdown",
        text: `# Hello, world!`,
        uri: uri.toString(),
        mimeType: "text/markdown",
        contentType: "text/markdown",
      },
    ],
  };
}

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

  nodes.forEach(async (node: any) => {
    console.error(`Registering node ${node.name} with URI ${node.uri}`);
    server.resource(node.name, node.uri, readCallback);
    //server.resource(node.name, node.uri, readCallback);
  });

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
