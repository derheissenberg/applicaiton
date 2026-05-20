# Re-render Optimization (MEDIUM)

Unnecessary re-renders are a common React performance pitfall. These rules address the root causes: unstable references, subscriptions to more state than needed, and effects used where event handlers or render-time derivation suffice.

---

## `rerender-defer-reads` — Don't subscribe to state only used in callbacks

**Why it matters:** Reading state inside a callback (click handler, timer, etc.) via `useRef` instead of direct state subscription prevents the component from re-rendering every time that state changes, since the component never "sees" the value during render.

### BAD
```typescript
// ❌ Component re-renders on every count change just for the click handler
'use client';
function SubmitButton({ count }: { count: number }) {
  // Subscribing to count causes re-render every time it changes
  const handleClick = () => {
    console.log('Clicked with count:', count);
    submitWithCount(count);
  };
  return <button onClick={handleClick}>Submit</button>;
}
```

### GOOD
```typescript
// ✅ Ref holds current value without causing re-renders
'use client';
function SubmitButton({ count }: { count: number }) {
  const countRef = useRef(count);
  // Keep ref in sync without subscribing to renders
  useEffect(() => { countRef.current = count; });

  const handleClick = useCallback(() => {
    console.log('Clicked with count:', countRef.current);
    submitWithCount(countRef.current);
  }, []); // Stable reference — never causes child re-renders

  return <button onClick={handleClick}>Submit</button>;
}
```

---

## `rerender-memo` — Extract expensive work into memoized components

**Why it matters:** When a parent re-renders, all children re-render by default. If a child does expensive work (sorts, filters, complex JSX) and its props haven't changed, `React.memo` skips the re-render entirely.

### BAD
```typescript
// ❌ DataTable re-renders every time Parent state changes, even if rows didn't change
'use client';
function DataTable({ rows }: { rows: Row[] }) {
  // Expensive sort on every render
  const sorted = rows.slice().sort((a, b) => a.name.localeCompare(b.name));
  return <table>{sorted.map(r => <TableRow key={r.id} row={r} />)}</table>;
}

function Parent() {
  const [filter, setFilter] = useState('');
  const rows = useRows();
  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <DataTable rows={rows} /> {/* Re-renders on every keystroke */}
    </>
  );
}
```

### GOOD
```typescript
// ✅ DataTable only re-renders when rows reference changes
'use client';
const DataTable = React.memo(function DataTable({ rows }: { rows: Row[] }) {
  const sorted = useMemo(
    () => rows.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [rows]
  );
  return <table>{sorted.map(r => <TableRow key={r.id} row={r} />)}</table>;
});

function Parent() {
  const [filter, setFilter] = useState('');
  const rows = useRows(); // Assumed stable reference
  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <DataTable rows={rows} /> {/* Skipped on keystrokes */}
    </>
  );
}
```

---

## `rerender-memo-with-default-value` — Hoist default non-primitive props

**Why it matters:** Inline object/array/function literals passed as default props create a new reference on every render, breaking `React.memo` and `useMemo` dependency checks.

### BAD
```typescript
// ❌ [] is recreated on every render — DataTable's memo never skips
function Parent({ rows }: { rows?: Row[] }) {
  return <DataTable rows={rows ?? []} />; // New [] reference each render
}
```

### GOOD
```typescript
// ✅ Stable reference — hoisted outside component
const EMPTY_ROWS: Row[] = [];

function Parent({ rows }: { rows?: Row[] }) {
  return <DataTable rows={rows ?? EMPTY_ROWS} />; // Same reference always
}
```

### Applied to functions and objects
```typescript
// BAD
function Form() {
  return (
    <Input
      style={{ color: 'red' }}    // New object every render
      onSubmit={() => submit()}   // New function every render
    />
  );
}

// GOOD
const ERROR_STYLE = { color: 'red' };

function Form() {
  const handleSubmit = useCallback(() => submit(), []);
  return <Input style={ERROR_STYLE} onSubmit={handleSubmit} />;
}
```

---

## `rerender-dependencies` — Use primitive dependencies in effects

**Why it matters:** Objects and arrays as effect dependencies trigger the effect on every render because their reference changes even if their contents are the same. Extract primitive values to stabilize dependencies.

### BAD
```typescript
// ❌ Effect runs on every render because `user` object reference changes
useEffect(() => {
  syncToAnalytics(user.id, user.role);
}, [user]); // user is a new object reference every render
```

### GOOD
```typescript
// ✅ Primitive values are compared by value, not reference
const { id, role } = user;
useEffect(() => {
  syncToAnalytics(id, role);
}, [id, role]); // Stable — only runs when id or role actually changes
```

---

## `rerender-derived-state` — Subscribe to derived booleans, not raw values

**Why it matters:** If a component only cares about whether a value is above/below a threshold, subscribing to the raw numeric value re-renders on every increment. Subscribe to the derived boolean instead.

### BAD
```typescript
// ❌ Re-renders every time count changes (0, 1, 2, 3...)
function WarningBadge() {
  const count = useNotificationCount(); // Changes frequently
  return count > 0 ? <Badge /> : null; // Only cares about > 0
}
```

### GOOD
```typescript
// ✅ Re-renders only when the boolean flips (false→true or true→false)
function WarningBadge() {
  const hasNotifications = useNotificationCount() > 0;
  return hasNotifications ? <Badge /> : null;
}

// If using a store, select the derived value
function WarningBadge() {
  const hasNotifications = useStore(state => state.notificationCount > 0);
  return hasNotifications ? <Badge /> : null;
}
```

---

## `rerender-derived-state-no-effect` — Derive state during render, not effects

**Why it matters:** Using `useEffect` + `setState` to compute derived state causes an extra render cycle: render → effect fires → setState → re-render. Compute it inline during render instead.

### BAD
```typescript
// ❌ Renders twice: once with stale filteredItems, once after effect
'use client';
function FilteredList({ items, query }: { items: Item[]; query: string }) {
  const [filteredItems, setFilteredItems] = useState<Item[]>(items);
  useEffect(() => {
    setFilteredItems(items.filter(i => i.name.includes(query)));
  }, [items, query]);
  return <List items={filteredItems} />;
}
```

### GOOD
```typescript
// ✅ Single render, no effect needed
'use client';
function FilteredList({ items, query }: { items: Item[]; query: string }) {
  // Derive during render
  const filteredItems = useMemo(
    () => items.filter(i => i.name.includes(query)),
    [items, query]
  );
  return <List items={filteredItems} />;
}
```

---

## `rerender-functional-setstate` — Use functional setState for stable callbacks

**Why it matters:** When a callback needs the current state value to compute the next state, reading state directly makes the callback depend on state (causing it to be recreated on every render). Functional setState always has access to the latest state without the dependency.

### BAD
```typescript
// ❌ handleIncrement recreated every time count changes
'use client';
function Counter() {
  const [count, setCount] = useState(0);
  const handleIncrement = useCallback(() => {
    setCount(count + 1); // Depends on count — stale closure problem
  }, [count]); // Must include count — new reference on every count change
  return <Button onClick={handleIncrement}>{count}</Button>;
}
```

### GOOD
```typescript
// ✅ Stable callback — never needs to change
'use client';
function Counter() {
  const [count, setCount] = useState(0);
  const handleIncrement = useCallback(() => {
    setCount(c => c + 1); // Functional form — no dependency on count
  }, []); // Empty deps — created once
  return <Button onClick={handleIncrement}>{count}</Button>;
}
```

---

## `rerender-lazy-state-init` — Pass function to useState for expensive values

**Why it matters:** The initial value expression passed to `useState(expr)` is evaluated on every render, but only used on the first. Wrapping it in a function (`useState(() => expr)`) ensures expensive initialization runs only once.

### BAD
```typescript
// ❌ parseLocalStorage() runs on every render, not just the first
'use client';
function Settings() {
  // Expensive operation re-runs on every re-render
  const [settings, setSettings] = useState(parseLocalStorage('settings'));
  return <SettingsForm settings={settings} onChange={setSettings} />;
}
```

### GOOD
```typescript
// ✅ Lazy initializer — parseLocalStorage runs only once
'use client';
function Settings() {
  const [settings, setSettings] = useState(
    () => parseLocalStorage('settings') // Function form — called once
  );
  return <SettingsForm settings={settings} onChange={setSettings} />;
}
```

---

## `rerender-simple-expression-in-memo` — Avoid memo for simple primitives

**Why it matters:** `useMemo` has overhead (storing the cached value, comparing dependencies). For cheap operations like property access or simple arithmetic, the overhead exceeds the savings.

### BAD
```typescript
// ❌ useMemo for trivial property access — pure overhead
const userId = useMemo(() => user.id, [user]);
const isAdmin = useMemo(() => user.role === 'admin', [user]);
const fullName = useMemo(() => `${user.first} ${user.last}`, [user]);
```

### GOOD
```typescript
// ✅ Compute inline — faster than memo overhead for simple expressions
const userId = user.id;
const isAdmin = user.role === 'admin';
const fullName = `${user.first} ${user.last}`;

// Save useMemo for genuinely expensive work
const sortedItems = useMemo(
  () => items.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [items]
);
```

---

## `rerender-move-effect-to-event` — Put interaction logic in event handlers

**Why it matters:** If a `useEffect` only runs because a state change triggered by a user interaction, that logic belongs in the event handler. Effects should respond to external synchronization, not user events.

### BAD
```typescript
// ❌ isSubmitting in effect — extra render cycle + harder to trace
'use client';
function Form() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (isSubmitting) {
      submitForm(formData).then(() => setIsSubmitting(false));
    }
  }, [isSubmitting]);

  return <button onClick={() => setIsSubmitting(true)}>Submit</button>;
}
```

### GOOD
```typescript
// ✅ Logic directly in the event handler — no effect, no extra render
'use client';
function Form() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitForm(formData);
    setIsSubmitting(false);
  };
  return <button onClick={handleSubmit} disabled={isSubmitting}>Submit</button>;
}
```

---

## `rerender-transitions` — Use startTransition for non-urgent updates

**Why it matters:** `startTransition` marks state updates as non-urgent, letting React prioritize urgent updates (user input) over deferred work (filtering a large list). This keeps the UI responsive during expensive state transitions.

### BAD
```typescript
// ❌ Filtering 10,000 items blocks input rendering
'use client';
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>(allItems);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    // ❌ This expensive filter runs synchronously, blocking the keystroke
    setResults(allItems.filter(i => i.name.includes(q)));
  }
  return (
    <>
      <input value={query} onChange={handleSearch} />
      <ResultsList items={results} />
    </>
  );
}
```

### GOOD
```typescript
// ✅ Input updates instantly, filtering is deferred
'use client';
import { startTransition, useState } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>(allItems);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q); // Urgent — input updates immediately
    startTransition(() => {
      // Non-urgent — deferred until input is done
      setResults(allItems.filter(i => i.name.includes(q)));
    });
  }
  return (
    <>
      <input value={query} onChange={handleSearch} />
      <ResultsList items={results} />
    </>
  );
}
```

---

## `rerender-use-ref-transient-values` — Use refs for transient frequent values

**Why it matters:** Values that change at high frequency (mouse position, scroll offset, animation frames) but don't need to trigger a re-render should be stored in refs, not state.

### BAD
```typescript
// ❌ 60+ state updates/second for cursor tracking — re-renders each time
'use client';
function CursorFollower() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  // Component re-renders 60+ times/second
  return <div style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }} />;
}
```

### GOOD
```typescript
// ✅ Ref updates without re-renders — DOM updated directly via ref
'use client';
function CursorFollower() {
  const elementRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Update DOM directly — no re-render triggered
      if (elementRef.current) {
        elementRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return <div ref={elementRef} />;
}
```
