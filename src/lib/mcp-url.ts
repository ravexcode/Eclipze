import "server-only";

import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

import { MCP_BLOCKED_IPV4_SUBNETS, MCP_BLOCKED_IPV6_SUBNETS } from "@/constants/mcp";

const blockedAddresses = new BlockList();

for (const [network, prefix] of MCP_BLOCKED_IPV4_SUBNETS) {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
}

for (const [network, prefix] of MCP_BLOCKED_IPV6_SUBNETS) {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
}

function isBlockedAddress(address: string) {
  const family = isIP(address);
  if (family === 0) return true;

  return blockedAddresses.check(address, family === 4 ? "ipv4" : "ipv6");
}

export async function assertPublicHttpsUrl(rawUrl: string) {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Enter a valid MCP server URL.");
  }

  if (url.protocol !== "https:") throw new Error("The MCP server URL must use https.");
  if (url.username || url.password) throw new Error("Do not include credentials in the MCP server URL.");

  const hostStatus = await getHostAddressStatus(url.hostname);

  if (hostStatus === "unresolved") throw new Error("The MCP server host could not be resolved.");
  if (hostStatus === "private") {
    throw new Error("The MCP server must be reachable on the public internet.");
  }

  return url;
}

// Resolves a hostname and reports whether every address it points to is on the public internet.
export async function getHostAddressStatus(rawHostname: string) {
  const hostname = rawHostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true }).catch(() => []);

  if (addresses.length === 0) return "unresolved";
  if (addresses.some(entry => isBlockedAddress(entry.address))) return "private";

  return "public";
}
