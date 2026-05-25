"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { UIMessage } from "ai";
import { formatChatErrorMessage } from "@/lib/chat-errors";
import { ChatInputRow } from "./ChatInputRow";
import { MinimizeIcon } from "./MinimizeIcon";
import { ChevronDownIcon } from "./ChevronDownIcon";
import { useVisualViewportOffset } from "./useVisualViewportOffset";

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
  const surfaceRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  const isNearBottomRef = useRef<boolean>(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const isStreaming = status === "streaming" || status === "submitted";

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastAssistantText = lastAssistant ? getMessageText(lastAssistant) : "";
  const showStreamingDots =
    status === "submitted" ||
    (status === "streaming" && lastAssistant !== undefined && !lastAssistantText);

  // Visual viewport offset for keyboard handling
  useVisualViewportOffset(surfaceRef);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    };
    checkMobile();
    const mql = window.matchMedia("(max-width: 767px)");
    mql.addEventListener("change", checkMobile);
    return () => mql.removeEventListener("change", checkMobile);
  }, []);

  // isAtBottom helper
  const isAtBottom = useCallback(
    (scrollEl: HTMLDivElement, thresholdPx: number) => {
      const { scrollHeight, scrollTop, clientHeight } = scrollEl;
      return scrollHeight - scrollTop - clientHeight <= thresholdPx;
    },
    []
  );

  // Get threshold from CSS variable
  const getThreshold = useCallback((): number => {
    if (!surfaceRef.current) return 8;
    const computed = window.getComputedStyle(surfaceRef.current);
    const cssValue = computed.getPropertyValue("--chat-scroll-at-bottom-threshold").trim();
    if (cssValue) {
      const parsed = parseInt(cssValue, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return 8;
  }, []);

  // Scroll listener on stream updates near bottom
  useEffect(() => {
    const scrollEl = streamRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const threshold = getThreshold();
      const nearBottom = isAtBottom(scrollEl, threshold);
      isNearBottomRef.current = nearBottom;
      setIsNearBottom(nearBottom);
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      scrollEl.removeEventListener("scroll", handleScroll);
    };
  }, [getThreshold, isAtBottom]);

  // Auto-scroll effect: ONLY if isNearBottomRef.current
  useEffect(() => {
    if (!isNearBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages, lastAssistantText, showStreamingDots]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    // Set near bottom before sending so auto-scroll kicks in
    isNearBottomRef.current = true;
    setIsNearBottom(true);
    onSend();
  }, [onSend]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    isNearBottomRef.current = true;
    setIsNearBottom(true);
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const showJumpPill = isMobile && isStreaming && !isNearBottom;

  return (
    <div
      ref={surfaceRef}
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
      <div
        ref={streamRef}
        className="chat-stream"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
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
            <div
              className="chat-row assistant chat-message-enter"
              style={{ animationDelay: `${0.24 + messages.length * 0.07}s` }}
            >
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
      <div className="chat-dock-stack">
        {/* Jump to latest pill - mobile only */}
        {showJumpPill && (
          <button
            type="button"
            className="chat-jump-latest"
            aria-label="Scroll to latest message"
            onClick={() => scrollToBottom("smooth")}
          >
            <ChevronDownIcon />
          </button>
        )}
        <div className="chat-dock">
          <div className="chat-dock-inner">
            <ChatInputRow
              input={input}
              onInputChange={onInputChange}
              onSend={handleSend}
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
    </div>
  );
}
