import { Chat } from "@/components/chat/Chat";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[var(--background)]"
      style={{ ["--chat-hero-min-height-desktop" as string]: "100dvh" }}
    >
      <Chat />
    </main>
  );
}
