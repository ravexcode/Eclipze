export type MailFolder = "inbox" | "sent";

export type MailUser = {
  id: string;
  username: string | null;
  email: string;
};

export type MailItem = {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  body: string;
  readAt: string | null;
  sentAt: string;
  sender: MailUser;
  recipient: MailUser;
};

export type MailFormValues = {
  to: string;
  subject: string;
  body: string;
};
