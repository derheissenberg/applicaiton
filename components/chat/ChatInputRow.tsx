"use client";

type ChatInputRowProps = {
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
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

import { SendIcon } from "@/components/ui/Button";

export function ChatInputRow({
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
  inputRef,
}: ChatInputRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className={`mx-auto w-full max-w-[var(--chat-input-max-width)] text-left ${className ?? "mt-9"}`}
    >
      <div className="flex w-full items-center gap-[0.625rem]">
        <div className="chat-input-shell relative">
          {showRotatingPlaceholder && !input && (
            <span
              className={`pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 truncate text-left font-outfit transition-opacity duration-300 ease-out ${
                placeholderVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{
                color: "var(--chat-input-placeholder-fg)",
                left: "var(--chat-input-padding-x)",
                right: "var(--chat-input-padding-x)",
                fontSize: "var(--chat-input-font-size)",
              }}
              aria-hidden
            >
              {placeholderText}
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            aria-label="Ask about Stefan"
            className="chat-input-field text-left"
          />
        </div>
        <button
          type="button"
          aria-label="Send message"
          disabled={sendDisabled}
          onClick={onSend}
          className="chat-send-btn inline-flex items-center justify-center"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
