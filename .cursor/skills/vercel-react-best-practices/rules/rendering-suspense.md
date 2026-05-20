# Rendering Performance (MEDIUM)

These rules target the browser rendering pipeline — avoiding layout thrashing from SVG animations, leveraging CSS containment for long pages, eliminating hydration mismatches, and choosing the right conditional rendering pattern.

---

## `rendering-animate-svg-wrapper` — Animate div wrapper, not SVG element

**Why it matters:** Animating CSS `transform`/`opacity` on SVG elements can trigger full layout recalculations in some browsers. Wrapping the SVG in a `<div>` and animating the wrapper uses the GPU-composited layer instead, giving smooth 60fps animations.

### BAD
```typescript
// ❌ Animating SVG directly can cause layout in some browsers
function SpinnerIcon() {
  return (
    <svg
      className="animate-spin" // Tailwind — applies transform to the SVG element
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}
```

### GOOD
```typescript
// ✅ Animate the wrapper div — GPU-composited, no layout recalculation
function SpinnerIcon() {
  return (
    <div className="animate-spin inline-block"> {/* Animate the wrapper */}
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}
```

---

## `rendering-content-visibility` — Use content-visibility for long lists

**Why it matters:** `content-visibility: auto` tells the browser to skip rendering off-screen content entirely. For long lists or content-heavy pages, this can reduce initial render time by 50–80%.

### BAD
```typescript
// ❌ All 500 items are fully rendered, even those 10,000px below the fold
function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
```

### GOOD
```typescript
// ✅ Off-screen items are skipped by the browser's rendering engine
function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul>
      {posts.map(post => (
        <li
          key={post.id}
          style={{
            contentVisibility: 'auto',
            // containIntrinsicSize tells browser the estimated height
            // to prevent layout shift when items are scrolled into view
            containIntrinsicSize: '0 200px',
          }}
        >
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
```

### Via CSS class
```css
/* styles/globals.css */
.content-auto {
  content-visibility: auto;
  contain-intrinsic-size: 0 200px;
}
```

```typescript
function PostCard({ post }: { post: Post }) {
  return (
    <article className="content-auto">
      {/* ... */}
    </article>
  );
}
```

---

## `rendering-hoist-jsx` — Extract static JSX outside components

**Why it matters:** JSX declared inside a component body creates new React element objects on every render. Hoisting static JSX (icons, static wrappers, decoration) to module scope creates them once.

### BAD
```typescript
// ❌ CheckIcon JSX is recreated as a new object on every render of ListItem
function ListItem({ label }: { label: string }) {
  return (
    <li>
      <svg viewBox="0 0 24 24" width="16" height="16"> {/* New object each render */}
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" />
      </svg>
      {label}
    </li>
  );
}
```

### GOOD
```typescript
// ✅ Static JSX created once at module load
const CHECK_ICON = (
  <svg viewBox="0 0 24 24" width="16" height="16">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

function ListItem({ label }: { label: string }) {
  return (
    <li>
      {CHECK_ICON} {/* Reuses the same object every render */}
      {label}
    </li>
  );
}
```

---

## `rendering-svg-precision` — Reduce SVG coordinate precision

**Why it matters:** SVG exports from design tools often include coordinates like `12.34567890`. The browser parses these as high-precision floats. Rounding to 1-2 decimal places reduces parse time and file size with no visible quality difference.

### BAD
```svg
<!-- ❌ Exported from Figma — unnecessary precision -->
<path d="M 12.34567890 23.45678901 L 45.67890123 12.34567890 C 67.89012345 34.56789012 89.01234567 45.67890123 100.12345678 56.78901234" />
```

### GOOD
```svg
<!-- ✅ 1 decimal place — visually identical, faster to parse -->
<path d="M 12.3 23.5 L 45.7 12.3 C 67.9 34.6 89.0 45.7 100.1 56.8" />
```

```typescript
// Automate with a build-time script using svgo
// svgo.config.js
export default {
  plugins: [
    { name: 'convertPathData', params: { floatPrecision: 1 } },
    { name: 'cleanupNumericValues', params: { floatPrecision: 1 } },
  ],
};
```

---

## `rendering-hydration-no-flicker` — Use inline script for client-only data

**Why it matters:** Theme preferences, language, and other client-only values read from localStorage after hydration cause a visible flash (server renders one value, client reads the correct value and re-renders). An inline script in `<head>` reads localStorage synchronously before the first paint.

### BAD
```typescript
// ❌ Theme is read after hydration — causes flash of wrong theme
'use client';
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light'); // Server default
  useEffect(() => {
    setTheme(localStorage.getItem('theme') ?? 'light'); // Client update = flash
  }, []);
  return <div data-theme={theme}>{children}</div>;
}
```

### GOOD
```typescript
// app/layout.tsx — inline script runs before first paint
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {/* ✅ Runs synchronously before CSS is applied — no flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') ?? 'system';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## `rendering-hydration-suppress-warning` — Suppress expected mismatches

**Why it matters:** Certain content legitimately differs between server and client (timestamps rendered as "X time ago", random IDs, browser-only content). React's hydration warning is noise for these cases; suppress it with `suppressHydrationWarning`.

### BAD
```typescript
// ❌ Causes hydration mismatch warning every render
function LastSeen({ timestamp }: { timestamp: Date }) {
  return <span>{formatRelativeTime(timestamp)}</span>; // "2 hours ago" differs server/client
}
```

### GOOD
```typescript
// ✅ Suppress the expected mismatch — we know it will differ
function LastSeen({ timestamp }: { timestamp: Date }) {
  return (
    <time
      dateTime={timestamp.toISOString()}
      suppressHydrationWarning // Only suppresses this element, not children
    >
      {formatRelativeTime(timestamp)}
    </time>
  );
}
```

**Note:** Only use `suppressHydrationWarning` for genuinely expected mismatches. Overuse hides real bugs.

---

## `rendering-activity` — Use Activity component for show/hide

**Why it matters:** `display: none` hides elements but React still re-renders their subtree. The `<Activity>` component (React 19+) pauses rendering for hidden content, preserving state while eliminating render cost.

### BAD
```typescript
// ❌ Hidden panel still re-renders when parent state changes
'use client';
function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  return (
    <div>
      {/* Both are rendered even when hidden */}
      <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
        <HeavyOverviewPanel />
      </div>
      <div style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
        <HeavyDetailsPanel />
      </div>
    </div>
  );
}
```

### GOOD
```typescript
// ✅ Activity pauses rendering of hidden content, preserves state on show
'use client';
import { Activity } from 'react'; // React 19+

function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  return (
    <div>
      <Activity mode={activeTab === 'overview' ? 'visible' : 'hidden'}>
        <HeavyOverviewPanel />
      </Activity>
      <Activity mode={activeTab === 'details' ? 'visible' : 'hidden'}>
        <HeavyDetailsPanel />
      </Activity>
    </div>
  );
}
```

---

## `rendering-conditional-render` — Use ternary, not && for conditionals

**Why it matters:** `{count && <Component />}` renders `0` when count is falsy-but-not-false. The ternary is explicit and type-safe. For boolean values this is a style issue; for numbers it's a correctness issue.

### BAD
```typescript
// ❌ Renders "0" to the DOM when items.length is 0
function List({ items }: { items: Item[] }) {
  return (
    <div>
      {items.length && <ItemList items={items} />}
    </div>
  );
}
```

### GOOD
```typescript
// ✅ Explicit ternary — renders nothing for empty list
function List({ items }: { items: Item[] }) {
  return (
    <div>
      {items.length > 0 ? <ItemList items={items} /> : null}
    </div>
  );
}

// Or with a boolean coercion
function List({ items }: { items: Item[] }) {
  return (
    <div>
      {!!items.length && <ItemList items={items} />}
    </div>
  );
}
```

---

## `rendering-usetransition-loading` — Prefer useTransition for loading state

**Why it matters:** `useTransition` lets you show a pending state while React prepares the next render in the background, without an explicit loading state variable. The current UI stays visible and interactive during the transition.

### BAD
```typescript
// ❌ Manual loading state — UI unmounts during transition
'use client';
function TabBar() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  async function switchTab(tab: string) {
    setIsLoading(true);
    setActiveTab(tab);
    setIsLoading(false);
  }

  if (isLoading) return <div>Loading...</div>; // Current UI disappears
  return <TabContent tab={activeTab} />;
}
```

### GOOD
```typescript
// ✅ useTransition — current UI stays visible during the transition
'use client';
import { useTransition, useState } from 'react';

function TabBar() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPending, startTransition] = useTransition();

  function switchTab(tab: string) {
    startTransition(() => {
      setActiveTab(tab); // React prepares this in background
    });
  }

  return (
    <div style={{ opacity: isPending ? 0.7 : 1 }}>
      {/* Current content stays visible — just dims slightly */}
      <TabContent tab={activeTab} />
      <TabButtons active={activeTab} onSwitch={switchTab} isPending={isPending} />
    </div>
  );
}
```
