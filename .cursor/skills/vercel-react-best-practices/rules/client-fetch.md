# Client-Side Data Fetching (MEDIUM-HIGH)

Client-side fetching is necessary for user-specific, real-time, or interactive data. These rules prevent the most common pitfalls: duplicate network requests, memory leaks from event listeners, and stale localStorage reads.

---

## `client-swr-dedup` — Use SWR for automatic request deduplication

**Why it matters:** Multiple components mounting simultaneously and fetching the same resource will each fire their own network request. SWR (and React Query) deduplicate concurrent requests to the same key, so 10 components sharing a key trigger 1 network call.

### BAD
```typescript
// ❌ Two components both call fetchUser('/api/user') on mount
// = 2 network requests for the same data

// components/Header.tsx
'use client';
function Header() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(setUser);
  }, []);
  return <nav>{user?.name}</nav>;
}

// components/Sidebar.tsx
'use client';
function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(setUser); // Duplicate request!
  }, []);
  return <aside>{user?.email}</aside>;
}
```

### GOOD
```typescript
// ✅ Both components share the same SWR key — 1 network request, shared cache

// hooks/useUser.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useUser() {
  return useSWR<User>('/api/user', fetcher);
}

// components/Header.tsx
'use client';
function Header() {
  const { data: user } = useUser();
  return <nav>{user?.name}</nav>;
}

// components/Sidebar.tsx
'use client';
function Sidebar() {
  const { data: user } = useUser(); // Same key — reuses cached response
  return <aside>{user?.email}</aside>;
}
```

### With loading and error states
```typescript
// components/UserProfile.tsx
'use client';
import useSWR from 'swr';

export function UserProfile() {
  const { data: user, error, isLoading } = useUser();

  if (isLoading) return <ProfileSkeleton />;
  if (error) return <ErrorBoundary error={error} />;
  if (!user) return null;

  return <div>{user.name}</div>;
}
```

---

## `client-event-listeners` — Deduplicate global event listeners

**Why it matters:** When multiple component instances each add the same global event listener (e.g., `window` `resize`, `scroll`, `online`), the handler fires N times per event. This wastes CPU and can cause race conditions.

### BAD
```typescript
// ❌ 50 instances of this component = 50 resize listeners
'use client';
function ResponsiveCard() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler); // Adds a NEW listener each mount
    return () => window.removeEventListener('resize', handler);
  }, []);
  return <div style={{ width: width > 768 ? '50%' : '100%' }}>...</div>;
}
```

### GOOD
```typescript
// ✅ One listener shared across all consumers via a custom hook

// hooks/useWindowWidth.ts
import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getSnapshot() {
  return window.innerWidth;
}

function getServerSnapshot() {
  return 0; // Safe default for SSR
}

export function useWindowWidth() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// components/ResponsiveCard.tsx
'use client';
function ResponsiveCard() {
  const width = useWindowWidth(); // 1 listener regardless of how many instances
  return <div style={{ width: width > 768 ? '50%' : '100%' }}>...</div>;
}
```

### Alternative: module-level singleton listener
```typescript
// lib/networkStatus.ts — one listener for the entire app
type Listener = () => void;
const listeners = new Set<Listener>();
let isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { isOnline = true; listeners.forEach(l => l()); });
  window.addEventListener('offline', () => { isOnline = false; listeners.forEach(l => l()); });
}

export function subscribeToNetwork(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNetworkSnapshot() { return isOnline; }

// hooks/useOnlineStatus.ts
import { useSyncExternalStore } from 'react';
import { subscribeToNetwork, getNetworkSnapshot } from '@/lib/networkStatus';

export function useOnlineStatus() {
  return useSyncExternalStore(subscribeToNetwork, getNetworkSnapshot, () => true);
}
```

---

## `client-passive-event-listeners` — Use passive listeners for scroll

**Why it matters:** Scroll and touch event listeners without `{ passive: true }` block the browser's scroll thread waiting to see if `preventDefault()` is called, causing janky scrolling even when you never call it.

### BAD
```typescript
// ❌ Blocks the browser's scroll optimization thread
'use client';
function ScrollTracker() {
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      // Never calls e.preventDefault() but browser doesn't know that
      trackScrollPosition(window.scrollY);
    };
    window.addEventListener('wheel', handler);
    return () => window.removeEventListener('wheel', handler);
  }, []);
  return null;
}
```

### GOOD
```typescript
// ✅ { passive: true } tells the browser it can scroll immediately
'use client';
function ScrollTracker() {
  useEffect(() => {
    const handler = () => {
      trackScrollPosition(window.scrollY);
    };
    window.addEventListener('wheel', handler, { passive: true });
    window.addEventListener('touchmove', handler, { passive: true });
    return () => {
      window.removeEventListener('wheel', handler);
      window.removeEventListener('touchmove', handler);
    };
  }, []);
  return null;
}
```

### Passive scroll hook
```typescript
// hooks/useScrollPosition.ts
import { useState, useEffect } from 'react';

export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    // ✅ passive: true — critical for scroll performance
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return scrollY;
}
```

---

## `client-localstorage-schema` — Version and minimize localStorage data

**Why it matters:** Unversioned localStorage schemas cause silent failures when the data shape changes. Uncompressed large objects bloat storage and slow parsing. Always version your schema and store only what's necessary.

### BAD
```typescript
// ❌ No versioning, entire objects stored, no error handling
'use client';
function saveUserPrefs(prefs: UserPreferences) {
  // If UserPreferences shape changes, old data silently corrupts
  localStorage.setItem('prefs', JSON.stringify(prefs));
}

function loadUserPrefs(): UserPreferences | null {
  const raw = localStorage.getItem('prefs');
  return raw ? JSON.parse(raw) : null; // Will throw if data is malformed
}
```

### GOOD
```typescript
// lib/storage.ts
const PREFS_KEY = 'prefs';
const PREFS_VERSION = 2;

interface StoredPrefs {
  version: number;
  theme: 'light' | 'dark' | 'system';
  language: string;
  // Only store what's needed — not the full user object
}

export function saveUserPrefs(prefs: Omit<StoredPrefs, 'version'>) {
  try {
    const payload: StoredPrefs = { ...prefs, version: PREFS_VERSION };
    localStorage.setItem(PREFS_KEY, JSON.stringify(payload));
  } catch (e) {
    // localStorage can be full or blocked in private mode
    console.warn('Failed to save preferences:', e);
  }
}

export function loadUserPrefs(): Omit<StoredPrefs, 'version'> | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredPrefs;

    // ✅ Version check — discard stale data rather than silently using it
    if (parsed.version !== PREFS_VERSION) {
      localStorage.removeItem(PREFS_KEY);
      return null;
    }

    return { theme: parsed.theme, language: parsed.language };
  } catch {
    // Malformed JSON or access denied
    return null;
  }
}
```

### Caching localStorage reads
```typescript
// ✅ Cache in module scope — localStorage.getItem is synchronous but not free
let cachedPrefs: StoredPrefs | null | undefined;

export function getCachedPrefs(): StoredPrefs | null {
  if (cachedPrefs !== undefined) return cachedPrefs;
  cachedPrefs = loadUserPrefs() as StoredPrefs | null;
  return cachedPrefs;
}

export function invalidatePrefsCache() {
  cachedPrefs = undefined;
}
```
