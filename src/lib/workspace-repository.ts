import type { WorkspaceRepositoryProvider } from "@/types/agent-runner";

const BRANCH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/;

function isBlockedHostname(hostname: string) {
  const normalizedHostname = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    normalizedHostname.endsWith(".local")
  ) {
    return true;
  }

  const ipv4 = normalizedHostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);

  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    const [first, second] = octets;
    return octets.some(octet => octet > 255) ||
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168);
  }

  return normalizedHostname === "::1" || normalizedHostname.startsWith("fc") || normalizedHostname.startsWith("fd") || normalizedHostname.startsWith("fe80:");
}

export function normalizeRepositoryUrl(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { error: "repositoryUrl is required." } as const;
  }

  const candidate = value.trim();

  if (candidate.length > 2048) {
    return { error: "repositoryUrl is too long." } as const;
  }

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    return { error: "repositoryUrl must be a valid HTTPS URL." } as const;
  }

  if (
    url.protocol !== "https:" ||
    (url.port && url.port !== "443") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    return { error: "repositoryUrl must be HTTPS without credentials or query data." } as const;
  }

  if (!url.hostname || isBlockedHostname(url.hostname) || url.pathname === "/") {
    return { error: "repositoryUrl must point to a repository." } as const;
  }

  url.pathname = url.pathname.replace(/\/+$/, "");

  return { value: url.toString() } as const;
}

export function parseRepositoryProvider(value: unknown, repositoryUrl: string) {
  if (typeof value === "string" && ["GITHUB", "GITLAB", "BITBUCKET", "OTHER"].includes(value)) {
    return { value: value as WorkspaceRepositoryProvider } as const;
  }

  const hostname = new URL(repositoryUrl).hostname.toLowerCase();

  if (hostname === "github.com" || hostname.endsWith(".github.com")) {
    return { value: "GITHUB" as const };
  }

  if (hostname === "gitlab.com" || hostname.endsWith(".gitlab.com")) {
    return { value: "GITLAB" as const };
  }

  if (hostname === "bitbucket.org" || hostname.endsWith(".bitbucket.org")) {
    return { value: "BITBUCKET" as const };
  }

  return { value: "OTHER" as const };
}

export function parseDefaultBranch(value: unknown) {
  if (value === undefined) {
    return { value: "main" } as const;
  }

  if (typeof value !== "string" || !BRANCH_PATTERN.test(value.trim()) || value.includes("..")) {
    return { error: "defaultBranch must be a safe branch name." } as const;
  }

  return { value: value.trim() } as const;
}

export function isSafeWorkspacePath(root: string, workspacePath: string) {
  const normalizedRoot = root.endsWith("/") ? root : `${root}/`;
  return workspacePath.startsWith(normalizedRoot) && workspacePath !== root;
}
