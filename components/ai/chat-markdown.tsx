"use client";

import { cn } from "@/lib/utils";

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-neutral-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part ? <span key={`${keyPrefix}-t-${i}`}>{part}</span> : null;
  });
}

type ChatMarkdownProps = {
  text: string;
  className?: string;
};

/** Renders simple assistant markdown: paragraphs, bullets, **bold**. */
export function ChatMarkdown({ text, className }: ChatMarkdownProps) {
  const blocks = text.split(/\n\n+/);

  return (
    <div className={cn("space-y-3 text-sm leading-relaxed text-neutral-800", className)}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line) => line.trim().length > 0);
        const isList = lines.every((line) => /^[\s•\-*]/.test(line.trim()) || line.trim().startsWith("•"));

        if (isList && lines.length > 0) {
          return (
            <ul key={`block-${blockIndex}`} className="space-y-1.5">
              {lines.map((line, lineIndex) => {
                const cleaned = line.replace(/^[\s•\-*]+\s*/, "").trim();
                return (
                  <li
                    key={`line-${blockIndex}-${lineIndex}`}
                    className="flex gap-2 text-neutral-800"
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-neutral-400" />
                    <span className="min-w-0 flex-1">{renderInline(cleaned, `li-${blockIndex}-${lineIndex}`)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={`block-${blockIndex}`} className="whitespace-pre-wrap">
            {lines.map((line, lineIndex) => (
              <span key={`p-${blockIndex}-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInline(line, `p-${blockIndex}-${lineIndex}`)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** Plain text for TTS — strips ** markers. */
export function chatMarkdownToPlainText(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}
