"use client";

import { useEffect, useRef, useState } from "react";
import "./applicaiton-docs.css";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done).catch(done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (_e) {
        // fallback failed silently
      }
      document.body.removeChild(ta);
      done();
    }
  }

  return (
    <button
      className={`copy-btn${copied ? " copied" : ""}`}
      type="button"
      onClick={handleCopy}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

const CODE_SNIPPET = `import { Chat } from "@/components/chat/Chat";

<section style={{ ["--chat-hero-min-height-desktop"]: "100dvh" }}>
  <Chat theme="dark-tokyo" />
</section>`;

export function ApplicaitonDocs() {
  const flowProgressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const revealEls = Array.from(
      document.querySelectorAll<HTMLElement>(".applicaiton-docs .reveal")
    );
    const flowProgress = flowProgressRef.current;

    if (!("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("in"));
      if (flowProgress) flowProgress.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el) => io.observe(el));

    let flowIO: IntersectionObserver | null = null;
    if (flowProgress) {
      flowIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              flowProgress.classList.add("in");
              flowIO?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      flowIO.observe(flowProgress);
    }

    return () => {
      io.disconnect();
      flowIO?.disconnect();
    };
  }, []);

  return (
    <div className="applicaiton-docs">
      <div className="docs-wrap">

        {/* BLOCK 1 — statement */}
        <section
          className="block statement"
          id="how-it-works"
          data-screen-label="01-statement"
        >
          <span className="kicker reveal">
            OPEN SOURCE<span className="dot">·</span>MIT LICENSE
          </span>
          <h2 className="reveal" data-d="1">
            You just talked to it.<br />
            <b className="grad-text">Here&rsquo;s how it works —</b> and how you&rsquo;d fork it for yourself.
          </h2>
          <p className="lead reveal" data-d="2">
            One React component, a twelve-file knowledge base, and a request path you can read in a single glance.
          </p>
          <p className="body reveal" data-d="3">
            It&rsquo;s <b>open-source</b>, <b>EU-region by default</b>, and built on opinionated defaults instead of configuration. Clone it, point it at your own story, ship it on a hobby plan. Everything below is real and verified against the repo.
          </p>
        </section>

        {/* BLOCK 2 — five things you can fork */}
        <section className="block" data-screen-label="02-fork">
          <div className="block-head">
            <div className="grad-rule reveal" />
            <span className="kicker reveal">THE PAYLOAD</span>
            <h2 className="reveal" data-d="1">Five things you can <b>fork.</b></h2>
            <p className="reveal" data-d="2">
              Most projects give you one thing worth copying. This one gives you five — each lifts out on its own.
            </p>
          </div>

          <div className="fork-grid">
            <article className="fork-card reveal">
              <div className="num">01</div>
              <div className="label">CHAT COMPONENT</div>
              <div className="claim">Dual-mode chat</div>
              <p className="sub">
                One React component, two modes. A collapsed hero input embedded in the page, and a full conversation overlay it expands into. No separate widgets.
              </p>
            </article>
            <article className="fork-card reveal" data-d="1">
              <div className="num">02</div>
              <div className="label">THEME SYSTEM</div>
              <div className="claim">Identity in CSS vars</div>
              <p className="sub">
                Visual identity lives entirely in CSS custom properties on <span className="inline-code">data-theme</span> blocks. One <span className="inline-code">data-theme</span> on the host recolors the whole page — chat hero and docs together — with no theme branching in component code.
              </p>
            </article>
            <article className="fork-card reveal" data-d="2">
              <div className="num">03</div>
              <div className="label">CONTEXT LOADER</div>
              <div className="claim">Private targeting</div>
              <p className="sub">
                Per-company calibration files live in Upstash, matched by keyword, lifecycle-gated so withdrawn applications drop out automatically. The public component never carries your private targeting.
              </p>
            </article>
            <article className="fork-card reveal" data-d="3">
              <div className="num">04</div>
              <div className="label">WRITING SKILL</div>
              <div className="claim">A documented method</div>
              <p className="sub">
                A method for writing those context files in your own voice — without leaking who you&rsquo;re applying to. Context entries live in Upstash and are matched at runtime — the count changes as applications move through their lifecycle.
              </p>
            </article>
            <article className="fork-card reveal" data-d="4">
              <div className="num">05</div>
              <div className="label">THIN EMBED</div>
              <div className="claim">Host page is three lines</div>
              <p className="sub">
                The component handles its own embedding; the host only controls layout. Drop it into any page and it brings its own everything.
              </p>
            </article>
          </div>
        </section>

        {/* BLOCK 3 — architecture flow */}
        <section className="block" data-screen-label="03-architecture">
          <div className="block-head">
            <div className="grad-rule reveal" />
            <span className="kicker reveal">REQUEST PATH</span>
            <h2 className="reveal" data-d="1">
              How it works, <b>end to end.</b>
            </h2>
            <p className="reveal" data-d="2">
              A single request, left to right. No vector database — the whole knowledge base fits in the context window.
            </p>
          </div>

          <div className="flow reveal" data-d="1">
            <div className="flow-rail">

              <div className="node">
                <span className="n-label">01 · Caller</span>
                <span className="n-title">Host page</span>
                <span className="n-sub">Renders <code>&lt;Chat /&gt;</code> — three lines of markup.</span>
              </div>

              <div className="conn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                </svg>
              </div>

              <div className="route-panel">
                <span className="route-panel__tag">
                  INSIDE <b>/api/chat</b> · NODE RUNTIME
                </span>
                <div className="route-inner">
                  <div className="node">
                    <span className="n-label">02 · Guard</span>
                    <span className="n-title">Rate limit</span>
                    <span className="n-sub">Upstash Redis, sliding window per IP.</span>
                  </div>
                  <div className="node">
                    <span className="n-label">03 · Assemble</span>
                    <span className="n-title">System prompt</span>
                    <span className="n-sub">Twelve-file knowledge base, prompt-stuffed and cached. No RAG.</span>
                  </div>
                  <div className="node">
                    <span className="n-label">04 · Match</span>
                    <span className="n-title">Context match</span>
                    <span className="n-sub">Scans <code>ctx:*</code> keys in Upstash, injects the matched company file if one fires.</span>
                  </div>
                  <div className="node">
                    <span className="n-label">05 · Generate</span>
                    <span className="n-title">Claude Haiku 4.5</span>
                    <span className="n-sub">Streams the response back, token by token.</span>
                  </div>
                </div>
              </div>

              <div className="conn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                </svg>
              </div>

              <div className="node">
                <span className="n-label">06 · Observe</span>
                <span className="n-title">
                  Langfuse (observability wrapper)&nbsp;<span style={{ opacity: 0.6, fontWeight: 400 }}>· EU</span>
                </span>
                <span className="n-sub">Every turn traced via the observe() wrapper, grouped into session replays.</span>
              </div>

            </div>

            <div className="flow-progress" ref={flowProgressRef} />
            <div className="flow-legend">
              <span>Request in</span>
              <span>Streamed response out</span>
            </div>
          </div>
        </section>

        {/* BLOCK 4 — integrate in four steps */}
        <section className="block" data-screen-label="04-integrate">
          <div className="block-head">
            <div className="grad-rule reveal" />
            <span className="kicker reveal">THE FORKER&rsquo;S PATH</span>
            <h2 className="reveal" data-d="1">
              Integrate it in <b>four steps.</b>
            </h2>
            <p className="reveal" data-d="2">
              Concrete, in order, with the real shapes. The host page is the punchline.
            </p>
          </div>

          <div className="steps-layout">
            <ol className="steps reveal">
              <li className="step">
                <span className="dot">1</span>
                <h3>Fork &amp; install</h3>
                <p>Clone the repo, <code>npm install</code>. Standard Next.js app — nothing exotic.</p>
              </li>
              <li className="step">
                <span className="dot">2</span>
                <h3>Set your environment</h3>
                <p><code>ANTHROPIC_API_KEY</code>, Upstash Redis URL + token, Langfuse keys.</p>
                <p className="note">Env vars must <b style={{ color: "var(--app-fg)" }}>not</b> be wrapped in quotes — Next.js fails open silently if they are.</p>
              </li>
              <li className="step">
                <span className="dot">3</span>
                <h3>Pick or write a theme</h3>
                <p>Pass the <code>theme</code> prop; or add a <code>data-theme</code> block of CSS variables for your own identity.</p>
              </li>
              <li className="step">
                <span className="dot">4</span>
                <h3>Embed it</h3>
                <p>The host page is this short →</p>
              </li>
            </ol>

            <div className="code-wrap reveal" data-d="1">
              <div className="code-card">
                <div className="code-top">
                  <span className="dots">
                    <i /><i /><i />
                  </span>
                  <span className="fname">app/page.tsx</span>
                  <CopyButton code={CODE_SNIPPET} />
                </div>
                <pre className="code-body">
                  <code>
                    <span className="tok-kw">import</span>{" "}
                    <span className="tok-punc">{"{"}</span> Chat{" "}
                    <span className="tok-punc">{"}"}</span>{" "}
                    <span className="tok-kw">from</span>{" "}
                    <span className="tok-str">&quot;@/components/chat/Chat&quot;</span>
                    <span className="tok-punc">;</span>
                    {"\n\n"}
                    <span className="tok-punc">&lt;</span>
                    <span className="tok-tag">section</span>
                    {"\n  "}
                    <span className="tok-attr">style</span>
                    <span className="tok-punc">{"={{"}</span>{" "}
                    <span className="tok-punc">[</span>
                    <span className="tok-str">&quot;--chat-hero-min-height-desktop&quot;</span>
                    <span className="tok-punc">]:</span>{" "}
                    <span className="tok-str">&quot;100dvh&quot;</span>{" "}
                    <span className="tok-punc">{"}}"}</span>
                    <span className="tok-punc">&gt;</span>
                    {"\n  "}
                    <span className="tok-punc">&lt;</span>
                    <span className="tok-tag">Chat</span>{" "}
                    <span className="tok-attr">theme</span>
                    <span className="tok-punc">=</span>
                    <span className="tok-str">&quot;dark-tokyo&quot;</span>{" "}
                    <span className="tok-punc">/&gt;</span>
                    {"\n"}
                    <span className="tok-punc">&lt;/</span>
                    <span className="tok-tag">section</span>
                    <span className="tok-punc">&gt;</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK 5 — under the hood */}
        <section className="block" data-screen-label="05-credibility">
          <div className="block-head">
            <div className="grad-rule reveal" />
            <span className="kicker reveal">UNDER THE HOOD</span>
            <h2 className="reveal" data-d="1">
              The proof, <b>not the pitch.</b>
            </h2>
            <p className="reveal" data-d="2">
              Behavioral facts, all verified against the repo. No best-in-class adjectives.
            </p>
          </div>

          <div className="tiles">
            <article className="tile reveal">
              <div className="metric">21<span className="sm"> · 6</span></div>
              <div className="t-label">Eval cases, six suites</div>
              <p className="t-gloss">
                Boundary testing, company context, factual accuracy, persona adherence, response quality, safety &amp; jailbreak. Run as a CI gate.
              </p>
            </article>
            <article className="tile reveal" data-d="1">
              <div className="metric">EU</div>
              <div className="t-label">Region by default</div>
              <p className="t-gloss">Redis and Langfuse both in Frankfurt. No third-party ad trackers.</p>
            </article>
            <article className="tile reveal" data-d="2">
              <div className="metric">Traced</div>
              <div className="t-label">Observability built in</div>
              <p className="t-gloss">Every conversation traced in Langfuse, grouped into session replays.</p>
            </article>
            <article className="tile reveal" data-d="1">
              <div className="metric">Per-IP</div>
              <div className="t-label">Rate-limited</div>
              <p className="t-gloss">
                A sliding window per IP, enforced on the API route before any model call.
              </p>
            </article>
            <article className="tile reveal" data-d="2">
              <div className="metric">&euro;0&ndash;8<span className="sm"> /mo</span></div>
              <div className="t-label">Running cost</div>
              <p className="t-gloss">Vercel Hobby, Upstash free tier, Langfuse Hobby, a Haiku-class model.</p>
            </article>
            <article className="tile reveal" data-d="3">
              <div className="metric">No RAG</div>
              <div className="t-label">A deliberate choice</div>
              <p className="t-gloss">
                Prompt-stuffed knowledge base with caching. Simpler, cheaper, and the whole story fits in context.
              </p>
            </article>
          </div>
        </section>

      </div>

      {/* BLOCK 6 — closing band */}
      <section className="closing" data-screen-label="06-closing">
        <div className="credit reveal">
          <span className="kicker">BUILT ON PRIOR ART</span>
          <p>
            This stands on the foundation of{" "}
            <b>
              Santiago Fern&aacute;ndez&rsquo;s{" "}
              <span className="inline-code" style={{ fontSize: "0.85em" }}>cv-santiago</span>
            </b>{" "}
            — the dual-mode chat idea and the thin-embed pattern started there. Forked forward, themed, and extended.
          </p>
        </div>

        <p className="meta reveal" data-d="1">
          MIT LICENSE&nbsp;&nbsp;&middot;&nbsp;&nbsp;FORK FREELY&nbsp;&nbsp;&middot;&nbsp;&nbsp;MAKE IT YOURS
        </p>

        <div className="cta-row reveal" data-d="2">
          <a
            className="btn btn-primary"
            href="https://github.com/derheissenberg/applicaiton"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.7.5.5 5.7.5 12a11.5 11.5 0 0 0 7.9 10.9c.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5Z" />
            </svg>
            View on GitHub
          </a>
          <a
            className="btn btn-ghost"
            href="https://github.com/derheissenberg/applicaiton/fork"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="12" cy="18" r="3" />
              <path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" />
              <path d="M12 15v0" />
            </svg>
            Fork it
          </a>
        </div>
      </section>
    </div>
  );
}
