import type { AiProvider } from "./ai";
import type { MailImportance } from "./user";

export type GmailConnection = {
  connected: boolean;
  email: string | null;
  scopes: string[];
};

export type GmailMessageSummary = {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  importance: MailImportance | null;
  hasNativeImportance: boolean;
};

export type GmailMessageDetail = GmailMessageSummary & {
  body: string;
  messageId: string | null;
};

export type MailReviewPreference = {
  provider: AiProvider;
};
