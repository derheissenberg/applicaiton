"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { formatChatErrorMessage } from "@/lib/chat-errors";
import { ChatInputRow } from "./ChatInputRow";
import { MinimizeIcon } from "./MinimizeIcon";

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
  assistantLabel?: string;
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
  assistantLabel = "Assistant",
}: ChatConversationProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastAssistantText = lastAssistant ? getMessageText(lastAssistant) : "";
  const showStreamingDots =
    status === "submitted" ||
    (status === "streaming" && lastAssistant !== undefined && !lastAssistantText);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, lastAssistantText, showStreamingDots]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="chat-conversation-surface chat-conversation-overlay"
      data-entering={isEntering}
      role="dialog"
      aria-modal="true"
      aria-label="Chat conversation"
    >
      {/* Close button - Minimize2 style per Lovable */}
      <button
        type="button"
        aria-label="Close conversation"
        className="chat-close-surface"
        onClick={onClose}
      >
        <MinimizeIcon />
      </button>

      {/* Scroll stream */}
      <div className="chat-stream" role="log" aria-live="polite" aria-label="Chat messages">
        <div className="chat-column">
          {messages.map((message, index) => {
            const delay = 0.24 + index * 0.07;
            return (
              <div
                key={message.id}
                className={`chat-row ${message.role} chat-message-enter`}
                style={{ animationDelay: `${delay}s` }}
              >
                {message.role === "assistant" ? (
                  <div className="chat-assistant-block">
                    <div className="chat-meta">{assistantLabel}</div>
                    <div className="chat-bubble-assistant-clean">
                      {getMessageText(message).split("\n\n").map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="chat-bubble-user-bordered">{getMessageText(message)}</div>
                )}
              </div>
            );
          })}

          {showStreamingDots && (
            <div className="chat-row assistant chat-message-enter" style={{ animationDelay: `${0.24 + messages.length * 0.07}s` }}>
              <div className="chat-assistant-block">
                <div className="chat-meta">{assistantLabel}</div>
                <div className="chat-typing" aria-label="Assistant is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="chat-row">
              <p className="chat-error-text" role="alert">
                {formatChatErrorMessage(error)}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} aria-hidden className="h-0 w-full shrink-0" />
        </div>
      </div>

      {/* Sticky dock at bottom */}
      <div className="chat-dock">
        <div className="chat-dock-inner">
          <ChatInputRow
            input={input}
            onInputChange={onInputChange}
            onSend={onSend}
            sendDisabled={sendDisabled}
            showRotatingPlaceholder={false}
            placeholderText="Ask anything…"
            placeholderVisible
            onFocus={() => {}}
            onBlur={() => {}}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  );
}
