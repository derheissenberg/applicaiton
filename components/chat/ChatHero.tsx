"use client";

import { cn } from "@/lib/utils";
import {
  HeroDescription,
  HeroTitle,
  Kicker,
} from "@/components/ui/typography";
import { ChatInputRow } from "./ChatInputRow";

const GREETING_PLACEHOLDER = "Aloha! You can ask me anything about Stefan…";

const ROTATING_PLACEHOLDERS = [
  "Ask about Stefan's fit for your company…",
  "Ask about Stefan's professional experience…",
  "Ask about Stefan's startup background…",
  "Ask about Stefan's experience with AI…",
  "Ask about Stefan's fit for your corporate culture…",
  "Ask about Stefan's enterprise experience…",
];

type ChatHeroProps = {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sendDisabled: boolean;
  rotatingIndex: number;
  placeholderVisible: boolean;
  showGreetingPlaceholder: boolean;
  onFocus: () => void;
  onBlur: () => void;
  isHidden: boolean;
};

export function ChatHero({
  input,
  onInputChange,
  onSend,
  sendDisabled,
  rotatingIndex,
  placeholderVisible,
  showGreetingPlaceholder,
  onFocus,
  onBlur,
  isHidden,
}: ChatHeroProps) {
  const placeholderText = showGreetingPlaceholder
    ? GREETING_PLACEHOLDER
    : ROTATING_PLACEHOLDERS[rotatingIndex];

  return (
    <div
      className={cn(
        "chat-hero-min-height relative flex w-full flex-col items-center justify-center px-5 py-20 lg:px-12 lg:py-[120px]",
        "transition-[opacity,transform] duration-300 ease-out",
        isHidden
          ? "pointer-events-none -translate-y-5 opacity-0"
          : "translate-y-0 opacity-100"
      )}
    >
      {/* Decorative portrait layers - styles from CSS vars only */}
      <div
        aria-hidden="true"
        className="chat-portrait chat-portrait-desktop pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="chat-portrait chat-portrait-mobile pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="chat-portrait chat-portrait-overlay pointer-events-none"
      />
      <div className="relative z-10 mx-auto w-full max-w-[var(--chat-hero-max-width)] text-center">
        {/* Pass theme colors via style/class overrides */}
        <Kicker
          className="text-[var(--chat-hero-kicker-fg)]"
          style={{ color: "var(--chat-hero-kicker-fg)" }}
        >
          By Stefan Heißenberg
        </Kicker>

        <HeroTitle
          className="text-[var(--chat-hero-title-fg)]"
          style={{ color: "var(--chat-hero-title-fg)" }}
        >
          Get to know me{" "}
          <em
            className={cn(
              "chat-accent-text inline-block pr-[0.06em] font-bold italic"
            )}
          >
            faster.
          </em>
        </HeroTitle>

        <HeroDescription
          className="text-[var(--chat-hero-description-fg)]"
          style={{ color: "var(--chat-hero-description-fg)" }}
        >
          Fifteen years designing digital products across agencies, consulting,
          startups, and enterprise. Ask question and find out directly what you
          need to know.
        </HeroDescription>

        <ChatInputRow
          input={input}
          onInputChange={onInputChange}
          onSend={onSend}
          sendDisabled={sendDisabled}
          showRotatingPlaceholder
          placeholderText={placeholderText}
          placeholderVisible={placeholderVisible}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}
