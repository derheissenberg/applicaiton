"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { formatChatErrorMessage } from "@/lib/chat-errors";
import { ChatInputRow } from "./ChatInputRow";
import { CloseIcon } from "./CloseIcon";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

type ChatConversationProps = {
  messages: UIMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sendDisabled: boolean;
  onClose: () => void;
  status: string;
  error: Error | null | undefined;
  isEntering: boolean;
};

export function ChatConversation({
  messages,
  input,
  onInputChange,
  onSend,
  sendDisabled,
  onClose,
  status,
  error,
  isEntering,
}: ChatConversationProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastAssistantText = lastAssistant ? getMessageText(lastAssistant) : "";
  const showStreamingDots =
    status === "submitted" ||
    (status === "streaming" && lastAssistant !== undefined && !lastAssistantText);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lastAssistantText, showStreamingDots]);

  return (
    <div
      className="fixed inset-0 z-[var(--chat-overlay-z)] flex h-[100dvh] flex-col bg-[var(--chat-page-bg)] chat-conversation-overlay"
      data-entering={isEntering}
      role="dialog"
      aria-modal="true"
      aria-label="Chat conversation"
    >
      {/* Inner column - max-width centered */}
      <div className="mx-auto flex h-full w-full max-w-[var(--chat-conversation-max-width)] flex-col px-4 sm:px-5">
        {/* Header with close button - 44x44 tap target on mobile */}
        <header className="flex shrink-0 items-center justify-end py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="chat-close-btn flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:h-10 sm:w-10"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>

        {/* Messages scroll area with bottom padding for sticky input */}
        <div
          className="flex flex-1 flex-col gap-3 overflow-y-auto pb-24 pt-2"
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
                    ? "chat-bubble-user"
                    : "chat-bubble-assistant"
                }
              >
                <p
                  className="whitespace-pre-wrap text-base"
                  style={{ fontFamily: "var(--chat-font-sans)" }}
                >
                  {getMessageText(message)}
                </p>
              </div>
            </div>
          ))}

          {showStreamingDots && (
            <div className="flex justify-start">
              <div className="chat-bubble-assistant">
                <span className="inline-flex gap-1" aria-hidden>
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse [animation-delay:150ms]">.</span>
                  <span className="animate-pulse [animation-delay:300ms]">.</span>
                </span>
              </div>
            </div>
          )}

          {error && (
            <p className="chat-error-text" role="alert">
              {formatChatErrorMessage(error)}
            </p>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sticky input bar at bottom */}
        <footer className="sticky bottom-0 w-full shrink-0 border-t border-[var(--chat-input-border)]/30 bg-[var(--chat-page-bg)] py-3 sm:py-4">
          <ChatInputRow
            input={input}
            onInputChange={onInputChange}
            onSend={onSend}
            sendDisabled={sendDisabled}
            showRotatingPlaceholder={false}
            placeholderText=""
            placeholderVisible
            onFocus={() => {}}
            onBlur={() => {}}
            className="mt-0"
          />
        </footer>
      </div>
    </div>
  );
}
