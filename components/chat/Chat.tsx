"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Button, SendIcon } from "@/components/ui/Button";
import { Heading } from "@/components/ui/typography/Heading";
import { Text } from "@/components/ui/typography/Text";

const PLACEHOLDERS = [
  "Ask about Stefan\u2019s fit for your company\u2026",
  "Ask about Stefan\u2019s professional experience\u2026",
  "Ask about Stefan\u2019s startup background\u2026",
  "Ask about Stefan\u2019s experience with AI\u2026",
  "Ask about Stefan\u2019s fit for your corporate culture\u2026",
  "Ask about Stefan\u2019s enterprise experience\u2026",
];

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function ChatInputRow({
  input,
  onInputChange,
  onSend,
  sendDisabled,
  showRotatingPlaceholder,
  placeholderIndex,
  placeholderVisible,
  onFocus,
  onBlur,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sendDisabled: boolean;
  showRotatingPlaceholder: boolean;
  placeholderIndex: number;
  placeholderVisible: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex w-full max-w-[600px] items-center gap-2">
      <div className="relative min-w-0 flex-1 border-b border-neutral-600 pb-2">
        {showRotatingPlaceholder && !input && (
          <span
            className={`pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 font-outfit text-sm text-white/50 transition-opacity duration-300 sm:text-base ${
              placeholderVisible ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden
          >
            {PLACEHOLDERS[placeholderIndex]}
          </span>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label="Ask about Stefan"
          className="w-full bg-transparent font-outfit text-sm text-white outline-none sm:text-base"
        />
      </div>
      <Button
        variant="icon"
        type="button"
        aria-label="Send message"
        disabled={sendDisabled}
        onClick={onSend}
      >
        <SendIcon />
      </Button>
    </div>
  );
}

export function Chat() {
  const [stage, setStage] = useState<"hero" | "chat">("hero");
  const [heroHidden, setHeroHidden] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [input, setInput] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);

  const sessionIdRef = useRef(crypto.randomUUID());
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      body: { sessionId: sessionIdRef.current },
    }),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isStreaming = status === "streaming" || status === "submitted";
  const sendDisabled = !input.trim() || isStreaming;

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastAssistantText = lastAssistant ? getMessageText(lastAssistant) : "";
  const showStreamingDots =
    status === "submitted" ||
    (status === "streaming" && lastAssistant !== undefined && !lastAssistantText);

  useEffect(() => {
    if (stage !== "hero" || inputFocused || input.length > 0) return;

    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [stage, inputFocused, input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lastAssistantText, showStreamingDots]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    if (stage === "hero") {
      setHeroHidden(true);
      setTimeout(() => {
        setStage("chat");
        setChatVisible(true);
      }, 400);
    }

    sendMessage({ text });
    setInput("");
  }, [input, isStreaming, stage, sendMessage]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      {stage === "hero" && (
        <div
          className={`flex flex-1 flex-col items-center justify-center px-4 transition-all duration-[400ms] ${
            heroHidden
              ? "pointer-events-none -translate-y-5 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          <div className="flex w-full max-w-[600px] flex-col items-center gap-6 text-center">
            <Heading>Stefan Heißenberg</Heading>
            <Text variant="muted">
              Head of Design at DHL, founder of OnlyPN, builder
            </Text>
            <div className="mt-4 flex w-full flex-col items-center gap-3">
              <Text variant="muted">
                Aloha! You can ask me anything about Stefan…
              </Text>
              <ChatInputRow
                input={input}
                onInputChange={setInput}
                onSend={handleSend}
                sendDisabled={sendDisabled}
                showRotatingPlaceholder
                placeholderIndex={placeholderIndex}
                placeholderVisible={placeholderVisible}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
            </div>
          </div>
        </div>
      )}

      {stage === "chat" && (
        <div
          className={`mx-auto flex h-[100dvh] w-full max-w-[700px] flex-col px-4 transition-opacity duration-300 ${
            chatVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="flex flex-1 flex-col gap-3 overflow-y-auto py-8"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[80%] rounded-2xl bg-neutral-900 px-4 py-2 text-white"
                      : "max-w-[90%] rounded-2xl border border-neutral-200 bg-neutral-100 px-4 py-2 text-neutral-900"
                  }
                >
                  <p className="whitespace-pre-wrap font-outfit text-base">
                    {getMessageText(message)}
                  </p>
                </div>
              </div>
            ))}

            {showStreamingDots && (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-neutral-900">
                  <span className="inline-flex gap-1" aria-hidden>
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse [animation-delay:150ms]">.</span>
                    <span className="animate-pulse [animation-delay:300ms]">.</span>
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="font-outfit text-sm text-white/80">
                Something went wrong. Try again.
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 pb-8 pt-2">
            <ChatInputRow
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              sendDisabled={sendDisabled}
              showRotatingPlaceholder={false}
              placeholderIndex={0}
              placeholderVisible
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
