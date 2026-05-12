import type { ReactNode } from "react";

function safeHref(href: string) {
  const value = href.trim();
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;
  return "#";
}

type InlineState = {
  bold: boolean;
  italic: boolean;
  key: number;
};

function inlineFormat(text: string, state: InlineState): ReactNode[] {
  const nodes: ReactNode[] = [];
  let buffer = "";
  let index = 0;

  const wrap = (content: ReactNode, key: string) => {
    let node = content;
    if (state.italic) node = <em key={`${key}-em`}>{node}</em>;
    if (state.bold) node = <strong key={`${key}-strong`}>{node}</strong>;
    return node;
  };

  const flush = () => {
    if (!buffer) return;
    const key = `text-${state.key++}`;
    nodes.push(wrap(buffer, key));
    buffer = "";
  };

  while (index < text.length) {
    const rest = text.slice(index);
    const link = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/);

    if (link) {
      flush();
      nodes.push(
        <a
          key={`link-${state.key++}`}
          href={safeHref(link[2])}
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline decoration-current/30 underline-offset-4"
        >
          {link[1]}
        </a>,
      );
      index += link[0].length;
      continue;
    }

    if (rest.startsWith("**") || rest.startsWith("__")) {
      flush();
      state.bold = !state.bold;
      index += 2;
      continue;
    }

    if (rest.startsWith("*") || rest.startsWith("_")) {
      flush();
      state.italic = !state.italic;
      index += 1;
      continue;
    }

    buffer += text[index];
    index += 1;
  }

  flush();
  return nodes;
}

export function FormattedBio({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const lines = (value ?? "").split(/\r?\n/);
  if (!value?.trim()) return null;

  const blocks: ReactNode[] = [];
  const inlineState: InlineState = { bold: false, italic: false, key: 0 };
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-2 list-inside list-disc space-y-1 text-left">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{inlineFormat(item, inlineState)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList();

    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h3 key={index} className="mt-3 text-base font-bold leading-snug">
          {inlineFormat(trimmed.slice(3), inlineState)}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={index}
          className="my-2 border-l-2 border-current/25 pl-3 text-left italic opacity-90"
        >
          {inlineFormat(trimmed.slice(2), inlineState)}
        </blockquote>,
      );
      return;
    }

    blocks.push(
      <p key={index} className="leading-relaxed">
        {inlineFormat(trimmed, inlineState)}
      </p>,
    );
  });

  flushList();

  return <div className={className}>{blocks}</div>;
}
