"use client";

import { useEffect, useRef, useState } from "react";
import { SendIcon } from "@/components/ui/Button";

// ─── Constants ────────────────────────────────────────────────────────────────

const GREETING = "Aloha! You can ask me anything about Stefan\u2026";
const SHARED_PREFIX = "Ask about Stefan\u2019s ";
const REDUCED_MOTION_TEXT = "Ask about Stefan\u2019s experience\u2026";

const ROTATING_SUFFIXES = [
  "fit for your company\u2026",
  "professional experience\u2026",
  "startup background\u2026",
  "experience with AI\u2026",
  "fit for your corporate culture\u2026",
  "enterprise experience\u2026",
];

const TIMING = {
  type: 45,
  delete: 28,
  greetingHold: 2500,
  rotationHold: 2000,
  gap: 150,
} as const;

function fullPlaceholder(index: number): string {
  return SHARED_PREFIX + ROTATING_SUFFIXES[index];
}

function startFirstRotationTyping(): Phase {
  return {
    tag: "rotation-typing",
    index: 0,
    suffix: ROTATING_SUFFIXES[0],
    typed: 0,
    fromEmpty: true,
  };
}

// ─── Module-level session state (strict-mode safe — never set in cleanup) ─────

let greetingShownThisSession = false;

// ─── State machine types ──────────────────────────────────────────────────────

type Phase =
  | { tag: "greeting-static" }
  | { tag: "greeting-deleting"; chars: string }
  | {
      tag: "rotation-typing";
      index: number;
      suffix: string;
      typed: number;
      fromEmpty: boolean;
    }
  | { tag: "rotation-holding"; index: number }
  | { tag: "rotation-deleting"; index: number; text: string };

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useHeroPlaceholderTypewriter(paused: boolean): { currentText: string } {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [currentText, setCurrentText] = useState<string>(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return REDUCED_MOTION_TEXT;
    }
    return greetingShownThisSession ? "" : GREETING;
  });

  const phaseRef = useRef<Phase>(
    greetingShownThisSession
      ? startFirstRotationTyping()
      : { tag: "greeting-static" }
  );
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef = useRef<(delay: number) => void>(null!);
  const didMountRef = useRef(false);

  // Animation loop — runs once on mount
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    function schedule(delay: number) {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(tick, delay);
    }

    function tick() {
      if (pausedRef.current) return;

      const phase = phaseRef.current;

      switch (phase.tag) {
        case "greeting-static": {
          phaseRef.current = { tag: "greeting-deleting", chars: GREETING };
          schedule(TIMING.delete);
          break;
        }

        case "greeting-deleting": {
          const next = phase.chars.slice(0, -1);
          setCurrentText(next);
          if (next.length > 0) {
            phaseRef.current = { tag: "greeting-deleting", chars: next };
            schedule(TIMING.delete);
          } else {
            greetingShownThisSession = true;
            setCurrentText("");
            phaseRef.current = startFirstRotationTyping();
            schedule(TIMING.gap);
          }
          break;
        }

        case "rotation-typing": {
          const { index, suffix, typed, fromEmpty } = phase;
          const newTyped = typed + 1;
          const nextText = fromEmpty
            ? fullPlaceholder(index).slice(0, newTyped)
            : SHARED_PREFIX + suffix.slice(0, newTyped);
          const targetLength = fromEmpty
            ? fullPlaceholder(index).length
            : suffix.length;
          setCurrentText(nextText);
          if (newTyped < targetLength) {
            phaseRef.current = {
              tag: "rotation-typing",
              index,
              suffix,
              typed: newTyped,
              fromEmpty,
            };
            schedule(TIMING.type);
          } else {
            phaseRef.current = { tag: "rotation-holding", index };
            schedule(TIMING.rotationHold);
          }
          break;
        }

        case "rotation-holding": {
          const { index } = phase;
          phaseRef.current = {
            tag: "rotation-deleting",
            index,
            text: fullPlaceholder(index),
          };
          schedule(TIMING.delete);
          break;
        }

        case "rotation-deleting": {
          const { index, text } = phase;
          const next = text.slice(0, -1);
          setCurrentText(next);
          if (next.length > SHARED_PREFIX.length) {
            phaseRef.current = { tag: "rotation-deleting", index, text: next };
            schedule(TIMING.delete);
          } else {
            const nextIndex = (index + 1) % ROTATING_SUFFIXES.length;
            phaseRef.current = {
              tag: "rotation-typing",
              index: nextIndex,
              suffix: ROTATING_SUFFIXES[nextIndex],
              typed: 0,
              fromEmpty: false,
            };
            setCurrentText(SHARED_PREFIX);
            schedule(TIMING.gap);
          }
          break;
        }
      }
    }

    scheduleRef.current = schedule;

    if (phaseRef.current.tag === "greeting-static") {
      schedule(TIMING.greetingHold);
    } else {
      schedule(TIMING.gap);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume handler — reacts to paused → unpaused transitions
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (paused) return;

    const phase = phaseRef.current;

    if (phase.tag === "greeting-static" || phase.tag === "greeting-deleting") {
      // Smart restart: skip greeting, type first placeholder from empty
      greetingShownThisSession = true;
      setCurrentText("");
      phaseRef.current = startFirstRotationTyping();
      scheduleRef.current(TIMING.gap);
    } else if (phase.tag === "rotation-holding") {
      // Was paused mid-hold: skip remaining hold, go straight to deleting
      phaseRef.current = {
        tag: "rotation-deleting",
        index: phase.index,
        text: fullPlaceholder(phase.index),
      };
      scheduleRef.current(TIMING.delete);
    } else {
      // rotation-typing or rotation-deleting: resume from current position
      scheduleRef.current(TIMING.gap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return { currentText };
}

// ─── Prop types ───────────────────────────────────────────────────────────────

type ChatInputRowBase = {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sendDisabled: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

export type ChatInputRowProps =
  | (ChatInputRowBase & { showRotatingPlaceholder: true })
  | (ChatInputRowBase & {
      showRotatingPlaceholder: false;
      placeholderText: string;
      placeholderVisible: boolean;
    });

// ─── Typewriter variant ───────────────────────────────────────────────────────

function ChatInputRowWithTypewriter({
  input,
  onInputChange,
  onSend,
  sendDisabled,
  onFocus,
  onBlur,
  className,
  inputRef,
}: ChatInputRowBase) {
  const [focused, setFocused] = useState(false);
  const paused = focused || input.length > 0;
  const { currentText } = useHeroPlaceholderTypewriter(paused);

  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
  };

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
          {!input && (
            <span
              className="pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 text-left font-outfit"
              style={{
                color: "var(--chat-input-placeholder-fg)",
                left: "var(--chat-input-padding-x)",
                right: "var(--chat-input-padding-x)",
                fontSize: "var(--chat-input-font-size)",
              }}
              aria-hidden
            >
              {currentText}
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
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

// ─── Static placeholder variant ───────────────────────────────────────────────

function ChatInputRowStatic({
  input,
  onInputChange,
  onSend,
  sendDisabled,
  placeholderText,
  placeholderVisible,
  onFocus,
  onBlur,
  className,
  inputRef,
}: ChatInputRowBase & { placeholderText: string; placeholderVisible: boolean }) {
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
          {!input && (
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

// ─── Public export ────────────────────────────────────────────────────────────

export function ChatInputRow(props: ChatInputRowProps) {
  if (props.showRotatingPlaceholder) {
    return (
      <ChatInputRowWithTypewriter
        input={props.input}
        onInputChange={props.onInputChange}
        onSend={props.onSend}
        sendDisabled={props.sendDisabled}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        className={props.className}
        inputRef={props.inputRef}
      />
    );
  }
  return (
    <ChatInputRowStatic
      input={props.input}
      onInputChange={props.onInputChange}
      onSend={props.onSend}
      sendDisabled={props.sendDisabled}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      className={props.className}
      inputRef={props.inputRef}
      placeholderText={props.placeholderText}
      placeholderVisible={props.placeholderVisible}
    />
  );
}
