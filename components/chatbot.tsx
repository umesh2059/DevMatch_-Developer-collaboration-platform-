"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setDraft("");
    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-20) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full !p-0 shadow-lg"
        aria-label="Open chat assistant"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:w-96">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <span className="text-sm font-medium">DevMatch Assistant</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          aria-label="Close chat assistant"
        >
          ✕
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">Ask me anything — about DevMatch or anything else.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <p className="text-xs text-zinc-500">{m.role === "user" ? "You" : "Assistant"}</p>
            <p
              className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-md px-3 py-1.5 text-left text-sm ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              {m.content}
            </p>
          </div>
        ))}
        {sending && <p className="text-sm text-zinc-500">Thinking…</p>}
      </div>

      {error && <p className="px-4 text-xs text-red-600">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="input"
          placeholder="Ask a question..."
          disabled={sending}
        />
        <button type="submit" className="btn-primary !px-3" disabled={sending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
