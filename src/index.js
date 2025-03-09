// Import from the MCP SDK
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create and start the MCP server
async function startServer() {
  // Create the MCP server
  const server = new McpServer({
    name: '6digit-mcp',
    version: '1.0.0'
  });

  // Register an echo tool
  server.tool('echo', 'Echoes back the input message', { message: 'string' }, 
    (params) => {
      console.log('Echo tool called with params:', params);
      return {
        content: [
          {
            type: 'text',
            text: `Echo: ${params.message}`
          }
        ]
      };
    }
  );

  // Create a transport
  const transport = new StdioServerTransport();
  
  // Connect the server to the transport
  await server.connect(transport);
  
  console.log('MCP server started');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await server.close();
    process.exit(0);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});