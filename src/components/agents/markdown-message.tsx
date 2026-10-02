import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  children: string;
}

export default function MarkdownMessage({ children }: Props) {
  return (
    <div className="markdown-message min-w-0 break-words text-xs leading-6 text-foreground-off sm:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => (
            <a {...props} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2" />
          ),
          pre: ({ children: code }) => (
            <pre className="my-3 overflow-x-auto rounded-sm bg-background-focus p-3 text-xs leading-5">{code}</pre>
          ),
          code: ({ children: code, className }) => className
            ? <code className={className}>{code}</code>
            : <code className="rounded-xs bg-background-focus px-1 py-0.5 text-xs text-foreground">{code}</code>,
          blockquote: ({ children: quote }) => (
            <blockquote className="my-3 border-l border-background-focus pl-3 text-foreground-off">{quote}</blockquote>
          ),
          table: ({ children: rows }) => (
            <div className="my-3 overflow-x-auto"><table className="w-full border-collapse text-left">{rows}</table></div>
          ),
          th: ({ children: header }) => <th className="border border-background-focus px-2 py-1.5 font-medium text-foreground">{header}</th>,
          td: ({ children: cell }) => <td className="border border-background-focus px-2 py-1.5">{cell}</td>,
          ul: ({ children: list }) => <ul className="my-2 list-disc space-y-1 pl-5">{list}</ul>,
          ol: ({ children: list }) => <ol className="my-2 list-decimal space-y-1 pl-5">{list}</ol>,
          h1: ({ children: heading }) => <h1 className="my-3 text-lg font-semibold text-foreground">{heading}</h1>,
          h2: ({ children: heading }) => <h2 className="my-3 text-base font-semibold text-foreground">{heading}</h2>,
          h3: ({ children: heading }) => <h3 className="my-2 text-sm font-semibold text-foreground">{heading}</h3>,
          p: ({ children: paragraph }) => <p className="my-2 last:mb-0">{paragraph}</p>,
          hr: () => <hr className="my-4 border-background-focus" />,
        }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
