# Advanced Patterns (LOW)

These patterns solve subtle, hard-to-debug problems that arise in production React applications — stale closures in event handlers, repeated initialization across re-renders, and unstable callback references in hooks.

---

## `advanced-event-handler-refs` — Store event handlers in refs

**Why it matters:** When an event handler reads from props or state, it forms a closure over those values. If the handler is registered once (e.g., in a `useEffect` with empty deps), it captures stale values. Storing the handler in a ref and calling the ref from a stable wrapper solves this without re-registering listeners.

### BAD
```typescript
// ❌ Stale closure — onMessage captures the initial value of messages
'use client';
function MessageStream({ onMessage }: { onMessage: (msg: string) => void }) {
  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/stream');
    // onMessage is captured at mount time — if parent re-renders with a new
    // callback, this handler is stale (calls the old function)
    ws.onmessage = (event) => onMessage(event.data);
    return () => ws.close();
  }, []); // Empty deps — intentional for WebSocket lifecycle
  return null;
}
```

### GOOD
```typescript
// ✅ Ref holds latest callback — stable listener, always current handler
'use client';
function MessageStream({ onMessage }: { onMessage: (msg: string) => void }) {
  const onMessageRef = useRef(onMessage);

  // Keep ref current on every render without triggering effect re-runs
  useEffect(() => { onMessageRef.current = onMessage; });

  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/stream');
    // Calls through the ref — always has the latest onMessage
    ws.onmessage = (event) => onMessageRef.current(event.data);
    return () => ws.close();
  }, []); // WebSocket created once — ref handles handler updates

  return null;
}
```

### Applied to DOM event listeners
```typescript
// ✅ Pattern: stable listener + mutable ref
'use client';
function KeyboardShortcut({
  shortcut,
  onActivate,
}: {
  shortcut: string;
  onActivate: () => void;
}) {
  const onActivateRef = useRef(onActivate);
  useEffect(() => { onActivateRef.current = onActivate; });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === shortcut) onActivateRef.current();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcut]); // Re-register only when shortcut key changes

  return null;
}
```

---

## `advanced-init-once` — Initialize app once per app load

**Why it matters:** Initialization code placed directly in a Server Component or module body may re-run with hot reload, Vercel edge restarts, or serverless cold starts more often than expected. Guarding with a module-level flag ensures one-time setup runs exactly once per process lifetime.

### BAD
```typescript
// ❌ Runs on every module evaluation — hot reload, serverless restart, etc.
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

// This runs every time the module is imported/re-evaluated
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### GOOD
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

let initialized = false;

export function initMonitoring() {
  if (initialized) return; // Guard — run exactly once per process
  initialized = true;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}
```

```typescript
// instrumentation.ts (Next.js App Router — called once at startup)
import { initMonitoring } from '@/lib/monitoring';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initMonitoring();
  }
}
```

### For client-side one-time initialization
```typescript
// lib/analytics-client.ts
'use client';
let clientInitialized = false;

export function initAnalytics() {
  if (typeof window === 'undefined') return; // SSR guard
  if (clientInitialized) return;
  clientInitialized = true;

  window.gtag?.('config', process.env.NEXT_PUBLIC_GA_ID!);
}
```

---

## `advanced-use-latest` — useLatest for stable callback refs

**Why it matters:** The pattern of keeping a ref synchronized with the latest value of a prop or callback is so common it deserves its own hook. `useLatest` encapsulates it, providing a stable ref that always holds the most recent value without causing re-renders.

### The Hook
```typescript
// hooks/useLatest.ts
import { useRef, useEffect } from 'react';

/**
 * Returns a ref that always holds the latest value of the provided argument.
 * The ref itself is stable — its identity never changes across renders.
 * Useful for accessing current props/state inside callbacks without stale closures.
 */
export function useLatest<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);
  // Synchronous assignment is intentional — runs before any effects
  ref.current = value;
  return ref;
}
```

### BAD — Before useLatest
```typescript
// ❌ Manual ref sync duplicated across components
'use client';
function InfiniteScroll({ onLoadMore }: { onLoadMore: () => Promise<void> }) {
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => { onLoadMoreRef.current = onLoadMore; }); // Manual sync

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onLoadMoreRef.current();
    });
    observer.observe(sentinelRef.current!);
    return () => observer.disconnect();
  }, []);
  // ...
}
```

### GOOD — With useLatest
```typescript
// ✅ Encapsulated pattern — no manual sync
'use client';
import { useLatest } from '@/hooks/useLatest';

function InfiniteScroll({ onLoadMore }: { onLoadMore: () => Promise<void> }) {
  const onLoadMoreRef = useLatest(onLoadMore); // Always current
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onLoadMoreRef.current();
    });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []); // No deps — sentinel doesn't change; callback always current via ref

  return <div ref={sentinelRef} style={{ height: 1 }} />;
}
```

### With timer callbacks
```typescript
// ✅ useLatest prevents stale closure in setInterval
'use client';
import { useEffect } from 'react';
import { useLatest } from '@/hooks/useLatest';

function AutoSave({ onSave, intervalMs = 30000 }: { onSave: () => void; intervalMs?: number }) {
  const onSaveRef = useLatest(onSave);

  useEffect(() => {
    const id = setInterval(() => {
      onSaveRef.current(); // Always calls the latest onSave
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]); // Only re-creates interval when intervalMs changes

  return null;
}
```
