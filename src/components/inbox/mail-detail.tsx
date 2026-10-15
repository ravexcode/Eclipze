import { IconArrowBackUp, IconExternalLink } from "@tabler/icons-react";

import type { MailItem } from "@/types/mail";

type MailDetailProps = {
  mail: MailItem;
  folder: "inbox" | "sent";
  onReply: () => void;
};

const MAIL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatDate(value: string) {
  return MAIL_DATE_FORMATTER.format(new Date(value));
}

function getPersonLabel(person: MailItem["sender"]) {
  return person.username ? `${person.username} (${person.email})` : person.email;
}

export default function MailDetail({ mail, folder, onReply }: MailDetailProps) {
  return (
    <article className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-background-focus px-5 py-5 sm:px-8">
        <div className="min-w-0">
          <h1 className="break-words text-lg font-medium tracking-[-0.02em]">{mail.subject}</h1>
          <p className="mt-3 break-all text-xs text-foreground-off">
            <span className="text-foreground">From</span> {getPersonLabel(mail.sender)}
          </p>
          <p className="mt-1 break-all text-xs text-foreground-off">
            <span className="text-foreground">To</span> {getPersonLabel(mail.recipient)}
          </p>
        </div>
        <time className="text-xs text-foreground-off">{formatDate(mail.sentAt)}</time>
      </div>

      <div className="min-h-0 flex-1 px-5 py-6 sm:px-8 sm:py-8">
        <p className="whitespace-pre-wrap break-words text-xs leading-7 text-foreground">{mail.body}</p>
      </div>

      <div className="flex shrink-0 justify-end border-t border-background-focus p-4 sm:px-8">
        {folder === "inbox" ? (
          <button type="button" onClick={onReply} className="inline-flex items-center gap-2 rounded-md bg-background-focus px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-background-focus/80">
            <IconArrowBackUp size={17} /> Reply
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground-off">
            <IconExternalLink size={16} /> Sent message
          </span>
        )}
      </div>
    </article>
  );
}
