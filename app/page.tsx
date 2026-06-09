import { Chat } from "@/components/chat/Chat";
import { ApplicaitonDocs } from "@/components/docs/ApplicaitonDocs";
import "@/styles/page-themes.css";

export default function Home() {
  return (
    <main
      className="applicaiton-page flex min-h-screen flex-col"
      data-theme="dark-tokyo"
    >
      <section
        className="applicaiton-hero-host w-full"
        style={{ ["--chat-hero-min-height-desktop" as string]: "100dvh" }}
      >
        <Chat
          theme="dark-tokyo"
          scrollCue={{ label: "How it works", targetId: "how-it-works" }}
        />
      </section>
      <ApplicaitonDocs />
    </main>
  );
}
