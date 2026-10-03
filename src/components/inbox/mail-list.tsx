import type { MailFolder, MailItem } from "@/types/mail";

type MailListProps = {
  folder: MailFolder;
  mails: MailItem[];
  selectedId: string;
  onSelect: (mail: MailItem) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getPersonLabel(person: MailItem["sender"]) {
  return person.username ? `${person.username} · ${person.email}` : person.email;
}

export default function MailList({ folder, mails, selectedId, onSelect }: MailListProps) {
  if (mails.length === 0) {
    return <p className="p-5 text-[14px] text-foreground-off">No messages in this folder.</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {mails.map(mail => {
        const person = folder === "inbox" ? mail.sender : mail.recipient;
        const unread = folder === "inbox" && !mail.readAt;

        return (
          <button
            key={mail.id}
            type="button"
            onClick={() => onSelect(mail)}
            aria-current={selectedId === mail.id ? "true" : undefined}
            className={`flex w-full flex-col gap-1.5 border-b border-background-focus/70 px-5 py-4 text-left transition-colors hover:bg-background-focus ${selectedId === mail.id ? "bg-background-focus" : ""}`}
          >
            <span className="flex min-w-0 items-center gap-2 text-[14px]">
              {unread ? <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-accent" /> : null}
              <span className={`min-w-0 flex-1 truncate ${unread ? "font-medium text-foreground" : "text-foreground-off"}`}>
                {getPersonLabel(person)}
              </span>
              <time className="shrink-0 text-[12px] text-foreground-off">{formatDate(mail.sentAt)}</time>
            </span>
            <span className={`truncate text-[14px] ${unread ? "font-medium text-foreground" : "text-foreground-off"}`}>
              {mail.subject}
            </span>
            <span className="line-clamp-2 text-[13px] leading-5 text-foreground-off">{mail.body}</span>
          </button>
        );
      })}
    </div>
  );
}
