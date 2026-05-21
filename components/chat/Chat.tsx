"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Button, SendIcon } from "@/components/ui/Button";
import { accentGradientText } from "@/lib/gradient-styles";
import { cn } from "@/lib/utils";
import {
  HeroDescription,
  HeroTitle,
  Kicker,
} from "@/components/ui/typography";

const GREETING_PLACEHOLDER = "Aloha! You can ask me anything about Stefan…";

const ROTATING_PLACEHOLDERS = [
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
  placeholderText,
  placeholderVisible,
  onFocus,
  onBlur,
  className,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sendDisabled: boolean;
  showRotatingPlaceholder: boolean;
  placeholderText: string;
  placeholderVisible: boolean;
  onFocus: () => void;
  onBlur: () => void;
  className?: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className={`mx-auto w-full max-w-[56ch] text-left ${className ?? "mt-9"}`}
    >
      <div className="flex w-full items-center gap-2">
        <div className="relative flex min-h-[48px] min-w-0 flex-1 items-center rounded-[10px] border border-white/20 bg-transparent px-4 py-3 transition-[background-color,border-color] duration-200 ease-out focus-within:border-white/40 focus-within:bg-white/[0.06]">
          {showRotatingPlaceholder && !input && (
            <span
              className={`pointer-events-none absolute left-4 right-4 top-1/2 -translate-y-1/2 truncate text-left font-outfit text-sm text-white/50 transition-opacity duration-300 ease-out sm:text-base ${
                placeholderVisible ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden
            >
              {placeholderText}
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
            className="w-full bg-transparent text-left font-outfit text-sm text-white outline-none sm:text-base"
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
    </div>
  );
}

export function Chat() {
  const [stage, setStage] = useState<"hero" | "chat">("hero");
  const [heroHidden, setHeroHidden] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [input, setInput] = useState("");
  const [showGreetingPlaceholder, setShowGreetingPlaceholder] = useState(true);
  const [rotatingIndex, setRotatingIndex] = useState(0);
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

  const placeholderText = showGreetingPlaceholder
    ? GREETING_PLACEHOLDER
    : ROTATING_PLACEHOLDERS[rotatingIndex];

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
        setShowGreetingPlaceholder((showGreeting) => {
          if (showGreeting) {
            setRotatingIndex(0);
            return false;
          }
          setRotatingIndex(
            (i) => (i + 1) % ROTATING_PLACEHOLDERS.length
          );
          return showGreeting;
        });
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
          className={`flex flex-1 flex-col items-center justify-center px-5 py-20 transition-all duration-[400ms] lg:px-12 lg:py-[120px] ${
            heroHidden
              ? "pointer-events-none -translate-y-5 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          <div className="mx-auto w-full max-w-[820px] text-center">
            <Kicker>By Stefan Heißenberg</Kicker>
            <HeroTitle>
              Get to know me{" "}
              <em className={cn(accentGradientText, "inline-block pr-[0.06em] font-bold italic")}>
                faster.
              </em>
            </HeroTitle>
            <HeroDescription>
              Fifteen years designing digital products across agencies,
              consulting, startups, and enterprise. Ask question and find out directly what you need to know.
            </HeroDescription>
            <ChatInputRow
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              sendDisabled={sendDisabled}
              showRotatingPlaceholder
              placeholderText={placeholderText}
              placeholderVisible={placeholderVisible}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      )}

      {stage === "chat" && (
        <div
          className={`mx-auto flex h-[100dvh] w-full max-w-[700px] flex-col px-4 transition-opacity duration-300 sm:px-5 ${
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
              placeholderText=""
              placeholderVisible
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              className="mt-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
