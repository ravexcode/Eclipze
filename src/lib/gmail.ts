import "server-only";

import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { decryptRefreshToken, encryptRefreshToken } from "@/lib/gmail-credentials";
import type { GmailMessageDetail, GmailMessageSummary } from "@/types/mail";
import type { MailImportance } from "@/types/user";

export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

type GmailMessageHeader = { name: string; value: string };

type GmailMessagePart = {
  mimeType?: string;
  body?: { data?: string };
  headers?: GmailMessageHeader[];
  parts?: GmailMessagePart[];
};

type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  internalDate?: string;
  payload?: GmailMessagePart;
};

export function oauthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL;
  if (!clientId || !clientSecret || !appUrl) throw new Error("Gmail OAuth is not configured.");
  return { clientId, clientSecret, redirectUri: `${appUrl.replace(/\/$/, "")}/api/gmail/callback` };
}

export function createOauthState(returnTo = "/mails") {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { state, verifier, challenge, returnTo };
}

export async function exchangeCode(code: string, verifier: string) {
  const config = oauthConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: "authorization_code", code_verifier: verifier }), cache: "no-store" });
  if (!response.ok) throw new Error("Gmail authorization failed.");
  return response.json() as Promise<{ access_token: string; refresh_token?: string; scope?: string }>;
}

async function accessToken(userId: string) {
  const connection = await prisma.gmailConnection.findUnique({ where: { userId } });
  if (!connection) throw new Error("Gmail is not connected.");
  const refreshToken = decryptRefreshToken(connection.encryptedRefreshToken);
  const config = oauthConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }), cache: "no-store" });
  if (!response.ok) throw new Error("Gmail authorization expired.");
  return (await response.json() as { access_token: string }).access_token;
}

async function gmailFetch<T>(userId: string, path: string, init?: RequestInit) {
  const token = await accessToken(userId);
  const response = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) }, cache: "no-store" });
  if (!response.ok) throw new Error(`Gmail request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

function headers(payload: GmailMessageHeader[] = [], name: string) { return payload.find(item => item.name.toLowerCase() === name.toLowerCase())?.value ?? ""; }
function decode(data = "") { return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); }
function bodyFromPart(part?: GmailMessagePart): string { if (!part) return ""; if (part.mimeType === "text/plain" && part.body?.data) return decode(part.body.data); return (part.parts ?? []).map(bodyFromPart).find(Boolean) ?? (part.body?.data ? decode(part.body.data) : ""); }

export async function saveConnection(userId: string, email: string, refreshToken: string, scopes: string[]) {
  const current = await prisma.gmailConnection.findUnique({ where: { userId }, select: { encryptedRefreshToken: true } });
  return prisma.gmailConnection.upsert({ where: { userId }, create: { userId, email, scopes: JSON.stringify(scopes), encryptedRefreshToken: encryptRefreshToken(refreshToken) }, update: { email, scopes: JSON.stringify(scopes), encryptedRefreshToken: refreshToken ? encryptRefreshToken(refreshToken) : current?.encryptedRefreshToken ?? "" } });
}

export async function getConnection(userId: string) { const c = await prisma.gmailConnection.findUnique({ where: { userId }, select: { email: true, scopes: true } }); let scopes: string[] = []; try { scopes = c ? JSON.parse(c.scopes) : []; } catch {} return { connected: Boolean(c), email: c?.email ?? null, scopes }; }

export async function listMessages(userId: string, pageToken?: string) {
  const query = new URLSearchParams({ q: "in:inbox -category:promotions", maxResults: "20" }); if (pageToken) query.set("pageToken", pageToken);
  const list = await gmailFetch<{ messages?: { id: string }[]; nextPageToken?: string }>(userId, `/messages?${query}`);
  const ids = (list.messages ?? []).map(item => item.id);
  const raw = await Promise.all(ids.map(id => gmailFetch<GmailMessage>(userId, `/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&labelIds=IMPORTANT`)));
  const reviews = await prisma.mailImportanceReview.findMany({ where: { userId, gmailMessageId: { in: ids } } });
  const reviewMap = new Map(reviews.map(r => [r.gmailMessageId, r.importance as MailImportance]));
  const messages: GmailMessageSummary[] = raw.filter(m => !(m.labelIds ?? []).includes("CATEGORY_PROMOTIONS")).map(m => { const native = (m.labelIds ?? []).includes("IMPORTANT"); return { id: m.id, threadId: m.threadId, subject: headers(m.payload?.headers, "Subject") || "(No subject)", sender: headers(m.payload?.headers, "From"), receivedAt: new Date(Number(m.internalDate ?? Date.now())).toISOString(), importance: native ? "HIGH" : reviewMap.get(m.id) ?? null, hasNativeImportance: native }; });
  return { messages, nextPageToken: list.nextPageToken ?? null };
}

export async function getMessage(userId: string, id: string): Promise<GmailMessageDetail> {
  const m = await gmailFetch<GmailMessage>(userId, `/messages/${encodeURIComponent(id)}?format=full`); const h = m.payload?.headers ?? []; const native = (m.labelIds ?? []).includes("IMPORTANT"); const review = await prisma.mailImportanceReview.findUnique({ where: { userId_gmailMessageId: { userId, gmailMessageId: id } } }); return { id: m.id, threadId: m.threadId, subject: headers(h, "Subject") || "(No subject)", sender: headers(h, "From"), receivedAt: new Date(Number(m.internalDate ?? Date.now())).toISOString(), importance: native ? "HIGH" : (review?.importance as MailImportance | null), hasNativeImportance: native, body: bodyFromPart(m.payload), messageId: headers(h, "Message-ID") || null };
}

export async function sendReply(userId: string, message: GmailMessageDetail, text: string) { const connection = await prisma.gmailConnection.findUnique({ where: { userId } }); let scopes: string[] = []; try { scopes = connection ? JSON.parse(connection.scopes) : []; } catch {} if (!scopes.includes(GMAIL_SEND_SCOPE)) throw new Error("GMAIL_SEND_SCOPE_REQUIRED"); const references = message.messageId ?? ""; const raw = [`To: ${message.sender}`, `Subject: ${message.subject.startsWith("Re:") ? message.subject : `Re: ${message.subject}`}`, references ? `In-Reply-To: ${references}` : "", references ? `References: ${references}` : "", "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "", text].filter(Boolean).join("\r\n"); const encoded = Buffer.from(raw).toString("base64url"); return gmailFetch(userId, "/messages/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ threadId: message.threadId, raw: encoded }) }); }
