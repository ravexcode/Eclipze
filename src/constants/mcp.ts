export const DEFAULT_MCP_TOOL_NAME = "codex";
export const MCP_CONNECT_TIMEOUT_MS = 15_000;
export const MCP_CALL_TIMEOUT_MS = 10 * 60_000;
export const MCP_CANCEL_POLL_INTERVAL_MS = 3_000;
export const MCP_CLIENT_INFO = { name: "eclipse", version: "1.0.0" };

export const MCP_BLOCKED_IPV4_SUBNETS: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

export const MCP_BLOCKED_IPV6_SUBNETS: Array<[string, number]> = [
  ["::", 128],
  ["::1", 128],
  ["::ffff:0:0", 96],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
];
