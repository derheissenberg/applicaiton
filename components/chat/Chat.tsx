"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatHero } from "./ChatHero";
import { ChatConversation } from "./ChatConversation";
import { useBodyScrollLock } from "./useBodyScrollLock";
import "./chat-theme.css";

export function Chat() {
  // Mode state: "hero" | "conversation"
  const [mode, setMode] = useState<"hero" | "conversation">("hero");
  
  // Animation states
  const [heroHidden, setHeroHidden] = useState(false);
  const [conversationEntering, setConversationEntering] = useState(false);
  
  // Input and placeholder states
  const [input, setInput] = useState("");
  const [showGreetingPlaceholder, setShowGreetingPlaceholder] = useState(true);
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);

  // Session for chat
  const sessionIdRef = useRef(crypto.randomUUID());

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport: new DefaultChatTransport({
      body: { sessionId: sessionIdRef.current },
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const sendDisabled = !input.trim() || isStreaming;

  // Rotating placeholder effect (only in hero mode)
  useEffect(() => {
    if (mode !== "hero" || inputFocused || input.length > 0) return;

    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setShowGreetingPlaceholder((showGreeting) => {
          if (showGreeting) {
            setRotatingIndex(0);
            return false;
          }
          setRotatingIndex((i) => (i + 1) % 6);
          return showGreeting;
        });
        setPlaceholderVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [mode, inputFocused, input]);

  // ESC key handler for conversation mode
  useEffect(() => {
    if (mode !== "conversation") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode]);

  // Body scroll lock when in conversation
  useBodyScrollLock(mode === "conversation");

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    if (mode === "hero") {
      // Start exit animation for hero
      setHeroHidden(true);
      
      // Small delay to allow hero exit animation to start
      // Then switch to conversation with enter animation
      setTimeout(() => {
        setMode("conversation");
        // Start conversation with entering=false (will animate in)
        setConversationEntering(false);
        
        // Trigger enter animation after mount
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setConversationEntering(true);
          });
        });
      }, 200);
    }

    sendMessage({ text });
    setInput("");
  }, [input, isStreaming, mode, sendMessage]);

  const handleClose = useCallback(() => {
    if (mode !== "conversation") return;

    // Start exit animation
    setConversationEntering(false);

    // Wait for exit animation to complete, then reset
    setTimeout(() => {
      setMode("hero");
      setHeroHidden(false);
      setInput("");
      setShowGreetingPlaceholder(true);
      setRotatingIndex(0);
      setPlaceholderVisible(true);
      
      // Clear messages and generate new session
      setMessages([]);
      sessionIdRef.current = crypto.randomUUID();
    }, 200);
  }, [mode]);

  return (
    <div className="chat-root w-full" data-theme="dark-tokyo">
      {mode === "hero" && (
        <ChatHero
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          sendDisabled={sendDisabled}
          rotatingIndex={rotatingIndex}
          placeholderVisible={placeholderVisible}
          showGreetingPlaceholder={showGreetingPlaceholder}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          isHidden={heroHidden}
        />
      )}

      {mode === "conversation" && (
        <ChatConversation
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          sendDisabled={sendDisabled}
          onClose={handleClose}
          status={status}
          error={error}
          isEntering={conversationEntering}
        />
      )}
    </div>
  );
}
