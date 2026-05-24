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
};

import { Button, SendIcon } from "@/components/ui/Button";

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
      <div className="flex w-full items-center gap-2">
        <div className="chat-input-shell relative">
          {showRotatingPlaceholder && !input && (
            <span
              className={`pointer-events-none absolute left-4 right-4 top-1/2 -translate-y-1/2 truncate text-left font-outfit text-sm transition-opacity duration-300 ease-out sm:text-base ${
                placeholderVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ color: "var(--chat-input-placeholder-fg)" }}
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
            className="chat-input-field text-left"
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
