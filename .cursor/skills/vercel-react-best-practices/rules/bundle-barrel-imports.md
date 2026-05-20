# Bundle Size Optimization (CRITICAL)

Large JavaScript bundles are the second biggest performance bottleneck after waterfalls. These rules minimize what gets shipped to the browser — both initial load and subsequent navigations.

---

## `bundle-barrel-imports` — Import directly, avoid barrel files

**Why it matters:** Barrel files (`index.ts` that re-export everything) force bundlers to include the entire module tree even when only one export is used. Direct imports let tree-shaking work correctly.

### BAD
```typescript
// ❌ This imports the entire utils barrel — all 40+ functions end up in your bundle
import { formatDate } from '@/utils';
import { Button } from '@/components';

// utils/index.ts (barrel)
export * from './formatDate';
export * from './formatCurrency';
export * from './parseQuery';
// ... 37 more exports
```

### GOOD
```typescript
// ✅ Only formatDate is bundled
import { formatDate } from '@/utils/formatDate';
import { Button } from '@/components/Button';
```

### For library imports, check if the library supports subpath imports
```typescript
// BAD — pulls in all of lodash (~70KB)
import { debounce } from 'lodash';

// GOOD — pulls in only debounce (~2KB)
import debounce from 'lodash/debounce';

// BEST — use native alternatives when possible
function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

---

## `bundle-dynamic-imports` — Use next/dynamic for heavy components

**Why it matters:** Components that are not needed on initial render (modals, rich text editors, charts, code editors) should be loaded on demand to keep the initial bundle small.

### BAD
```typescript
// app/editor/page.tsx
// ❌ Monaco editor (~2MB) is included in the initial page bundle
import MonacoEditor from '@monaco-editor/react';
import { ChartComponent } from '@/components/Chart'; // Recharts ~300KB

export default function EditorPage() {
  const [showChart, setShowChart] = useState(false);
  return (
    <div>
      <MonacoEditor height="400px" language="typescript" />
      {showChart && <ChartComponent />}
    </div>
  );
}
```

### GOOD
```typescript
// app/editor/page.tsx
import dynamic from 'next/dynamic';

// ✅ Monaco loads only when the component mounts
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  loading: () => <div className="h-[400px] animate-pulse bg-muted rounded" />,
  ssr: false, // Monaco requires browser APIs
});

// ✅ Chart loads only when showChart becomes true
const ChartComponent = dynamic(() => import('@/components/Chart'), {
  loading: () => <ChartSkeleton />,
});

export default function EditorPage() {
  const [showChart, setShowChart] = useState(false);
  return (
    <div>
      <MonacoEditor height="400px" language="typescript" />
      {showChart && <ChartComponent />}
    </div>
  );
}
```

---

## `bundle-defer-third-party` — Load analytics/logging after hydration

**Why it matters:** Third-party scripts (analytics, error tracking, chat widgets) compete with React hydration for the main thread. Deferring them until after hydration ensures the app becomes interactive faster.

### BAD
```typescript
// app/layout.tsx
// ❌ Analytics script blocks hydration
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        {/* Loads and executes during hydration */}
        <Script src="https://www.googletagmanager.com/gtag/js" />
        <Script src="https://cdn.segment.com/analytics.js/v1/KEY/analytics.min.js" />
      </body>
    </html>
  );
}
```

### GOOD
```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        {/* strategy="afterInteractive" defers until hydration is complete */}
        <Script
          src="https://www.googletagmanager.com/gtag/js"
          strategy="afterInteractive"
        />
        {/* strategy="lazyOnload" defers until browser is idle */}
        <Script
          src="https://cdn.intercom.com/widget.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

### For programmatic initialization
```typescript
// components/Analytics.tsx
'use client';
import { useEffect } from 'react';

export function Analytics() {
  useEffect(() => {
    // Runs only after hydration, in the browser
    import('@segment/analytics-next').then(({ AnalyticsBrowser }) => {
      window.analytics = AnalyticsBrowser.load({ writeKey: process.env.NEXT_PUBLIC_SEGMENT_KEY! });
    });
  }, []);

  return null;
}
```

---

## `bundle-conditional` — Load modules only when feature is activated

**Why it matters:** Features gated behind flags, permissions, or user actions should not be loaded until the gate opens. This applies to admin panels, pro features, and rarely-used tools.

### BAD
```typescript
// components/Toolbar.tsx
// ❌ PDF exporter (~500KB) always loads even when user never clicks export
import { exportToPDF } from '@/lib/pdf-exporter';

export function Toolbar({ canExport }: { canExport: boolean }) {
  const handleExport = () => {
    if (canExport) exportToPDF(document.getElementById('content')!);
  };
  return <button onClick={handleExport}>Export PDF</button>;
}
```

### GOOD
```typescript
// components/Toolbar.tsx
export function Toolbar({ canExport }: { canExport: boolean }) {
  const handleExport = async () => {
    if (!canExport) return;
    // ✅ PDF exporter loads only when the button is actually clicked
    const { exportToPDF } = await import('@/lib/pdf-exporter');
    exportToPDF(document.getElementById('content')!);
  };

  return <button onClick={handleExport}>Export PDF</button>;
}
```

### For feature flags
```typescript
// components/AdminPanel.tsx
'use client';
import { useEffect, useState } from 'react';

export function AdminPanel({ isAdmin }: { isAdmin: boolean }) {
  const [AdminTools, setAdminTools] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (isAdmin) {
      // ✅ Admin tools only load for admin users
      import('@/components/AdminTools').then((m) => setAdminTools(() => m.AdminTools));
    }
  }, [isAdmin]);

  if (!isAdmin || !AdminTools) return null;
  return <AdminTools />;
}
```

---

## `bundle-preload` — Preload on hover/focus for perceived speed

**Why it matters:** Dynamic imports have a small but perceptible load delay. Preloading on hover/focus hides this latency by starting the load before the user clicks, making the app feel instant.

### BAD
```typescript
// components/Nav.tsx
// ❌ Settings page only starts loading when user clicks — visible delay
export function Nav() {
  return (
    <Link href="/settings">Settings</Link>
  );
}
```

### GOOD
```typescript
// components/Nav.tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Nav() {
  const router = useRouter();

  return (
    <Link
      href="/settings"
      // ✅ Prefetch the page on hover — loads before the click lands
      onMouseEnter={() => router.prefetch('/settings')}
      onFocus={() => router.prefetch('/settings')}
    >
      Settings
    </Link>
  );
}
```

### For dynamic imports with hover preloading
```typescript
// components/Toolbar.tsx
'use client';

// Preload function — callable before component mounts
const preloadExporter = () => import('@/lib/pdf-exporter');

export function ExportButton() {
  const handleClick = async () => {
    const { exportToPDF } = await preloadExporter(); // Already cached from hover
    exportToPDF(document.getElementById('content')!);
  };

  return (
    <button
      onMouseEnter={preloadExporter} // Start loading on hover
      onFocus={preloadExporter}      // Start loading on focus
      onClick={handleClick}
    >
      Export PDF
    </button>
  );
}
```
