# JavaScript Performance (LOW-MEDIUM)

These are micro-optimizations for hot code paths — loops, lookups, and repeated operations. Individually small, they compound significantly in data-intensive components, Server Components processing large datasets, and utility functions called in tight loops.

---

## `js-batch-dom-css` — Group CSS changes via classes or cssText

**Why it matters:** Each individual style property assignment triggers a separate style recalculation. Applying a class (one change) or setting `cssText` (atomic) triggers one recalculation for all properties.

### BAD
```typescript
// ❌ 4 separate style recalculations
function applyErrorStyles(element: HTMLElement) {
  element.style.color = 'red';
  element.style.borderColor = 'red';
  element.style.backgroundColor = '#fff5f5';
  element.style.outline = '2px solid red';
}
```

### GOOD
```typescript
// ✅ Option 1: Single class — one recalculation
function applyErrorStyles(element: HTMLElement) {
  element.classList.add('input-error');
}
// .input-error { color: red; border-color: red; background: #fff5f5; outline: 2px solid red; }

// ✅ Option 2: cssText — single atomic assignment
function applyErrorStyles(element: HTMLElement) {
  element.style.cssText = 'color:red;border-color:red;background:#fff5f5;outline:2px solid red';
}
```

---

## `js-index-maps` — Build Map for repeated lookups

**Why it matters:** `Array.find()` and `Array.filter()` are O(n) per lookup. If you look up by key more than once, build a `Map` once (O(n)) and do O(1) lookups thereafter.

### BAD
```typescript
// ❌ O(n) lookup inside a loop = O(n²) total
function enrichOrders(orders: Order[], products: Product[]) {
  return orders.map(order => ({
    ...order,
    // products.find is O(n) — called once per order
    product: products.find(p => p.id === order.productId),
  }));
}
```

### GOOD
```typescript
// ✅ Build Map once O(n), then O(1) lookups
function enrichOrders(orders: Order[], products: Product[]) {
  const productMap = new Map(products.map(p => [p.id, p]));
  return orders.map(order => ({
    ...order,
    product: productMap.get(order.productId), // O(1)
  }));
}
```

---

## `js-cache-property-access` — Cache object properties in loops

**Why it matters:** Property access via `.` or `[]` traverses the prototype chain on each access. Caching frequently accessed properties in local variables, especially in hot loops, avoids repeated chain traversal.

### BAD
```typescript
// ❌ items.length re-evaluated each iteration
// (modern engines optimize this, but explicit caching is still good practice for non-array objects)
function processLargeDataset(items: DataItem[]) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].metadata.category === items[i].metadata.primaryCategory) {
      results.push(items[i].metadata.value * items[i].metadata.multiplier);
    }
  }
  return results;
}
```

### GOOD
```typescript
// ✅ Cache deeply accessed properties
function processLargeDataset(items: DataItem[]) {
  const results: number[] = [];
  const len = items.length;
  for (let i = 0; i < len; i++) {
    const meta = items[i].metadata; // Cache property chain
    if (meta.category === meta.primaryCategory) {
      results.push(meta.value * meta.multiplier);
    }
  }
  return results;
}
```

---

## `js-cache-function-results` — Cache function results in module-level Map

**Why it matters:** Pure functions called with the same arguments repeatedly should cache their results. Module-level Maps persist across renders and component instances, making them more effective than `useMemo` for non-React contexts.

### BAD
```typescript
// ❌ formatCurrency called with the same value/locale thousands of times
function PriceList({ prices }: { prices: number[] }) {
  return (
    <ul>
      {prices.map(price => (
        <li key={price}>{formatCurrency(price, 'USD')}</li> // Recomputed each render
      ))}
    </ul>
  );
}
```

### GOOD
```typescript
// lib/formatters.ts
const currencyCache = new Map<string, string>();

export function formatCurrency(amount: number, currency: string): string {
  const key = `${amount}-${currency}`;
  if (currencyCache.has(key)) return currencyCache.get(key)!;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);

  currencyCache.set(key, formatted);
  return formatted;
}
```

---

## `js-cache-storage` — Cache localStorage/sessionStorage reads

**Why it matters:** Storage reads are synchronous but involve browser I/O. Reading the same key in multiple components or on every render is wasteful. Cache the value in a module-level variable.

### BAD
```typescript
// ❌ localStorage.getItem called on every render of every component that uses it
function useAuthToken() {
  return localStorage.getItem('auth-token'); // I/O on every render
}
```

### GOOD
```typescript
// lib/auth-token.ts — single read, module-level cache
let cachedToken: string | null | undefined;

export function getAuthToken(): string | null {
  if (cachedToken !== undefined) return cachedToken;
  try {
    cachedToken = localStorage.getItem('auth-token');
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

export function setAuthToken(token: string | null) {
  cachedToken = token;
  try {
    if (token) localStorage.setItem('auth-token', token);
    else localStorage.removeItem('auth-token');
  } catch { /* storage blocked */ }
}
```

---

## `js-combine-iterations` — Combine multiple filter/map into one loop

**Why it matters:** Chaining `filter().map().reduce()` creates an intermediate array at each step and iterates the full array multiple times. A single `reduce` or `for` loop does the same work in one pass.

### BAD
```typescript
// ❌ Three passes over the array, two intermediate arrays
function getActiveUserNames(users: User[]): string[] {
  return users
    .filter(u => u.isActive)           // Pass 1 → intermediate array
    .filter(u => u.name.length > 0)    // Pass 2 → intermediate array
    .map(u => u.name.trim());          // Pass 3 → result
}
```

### GOOD
```typescript
// ✅ Single pass, no intermediate arrays
function getActiveUserNames(users: User[]): string[] {
  const result: string[] = [];
  for (const user of users) {
    if (user.isActive && user.name.length > 0) {
      result.push(user.name.trim());
    }
  }
  return result;
}
```

---

## `js-length-check-first` — Check array length before expensive comparison

**Why it matters:** If two arrays of different lengths can't be equal, skip the expensive element-by-element comparison immediately. This is a cheap early exit for a potentially costly operation.

### BAD
```typescript
// ❌ Compares elements even when arrays have different lengths
function arraysEqual(a: unknown[], b: unknown[]): boolean {
  return a.every((item, i) => item === b[i]) && a.length === b.length;
}
```

### GOOD
```typescript
// ✅ Fast path: different lengths → not equal
function arraysEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false; // O(1) early exit
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
```

---

## `js-early-exit` — Return early from functions

**Why it matters:** Early returns reduce nesting and allow the JavaScript engine to skip remaining work. Guards at the top of functions are easier to read and let the engine optimize the common path.

### BAD
```typescript
// ❌ Deep nesting — all code executes before any guard
function processUser(user: User | null): string {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission('read')) {
        return generateReport(user);
      } else {
        return 'Permission denied';
      }
    } else {
      return 'User inactive';
    }
  } else {
    return 'No user';
  }
}
```

### GOOD
```typescript
// ✅ Guards at the top — happy path is the final statement
function processUser(user: User | null): string {
  if (!user) return 'No user';
  if (!user.isActive) return 'User inactive';
  if (!user.hasPermission('read')) return 'Permission denied';
  return generateReport(user);
}
```

---

## `js-hoist-regexp` — Hoist RegExp creation outside loops

**Why it matters:** `new RegExp()` and regex literals evaluated inside a function or loop are recompiled on each invocation in some engines. Hoisting to module scope compiles once.

### BAD
```typescript
// ❌ RegExp recompiled on every call to validateEmail
function validateEmails(emails: string[]): boolean[] {
  return emails.map(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  // Regex literal may be recompiled per iteration in some environments
}
```

### GOOD
```typescript
// ✅ Compiled once at module load
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmails(emails: string[]): boolean[] {
  return emails.map(email => EMAIL_REGEX.test(email));
}
```

---

## `js-min-max-loop` — Use loop for min/max instead of sort

**Why it matters:** `Array.sort()` is O(n log n). Finding the min or max of an array is O(n) with a single loop. Never sort just to find an extreme value.

### BAD
```typescript
// ❌ O(n log n) sort just to find the max
function getHighestScore(scores: number[]): number {
  return [...scores].sort((a, b) => b - a)[0];
}
```

### GOOD
```typescript
// ✅ O(n) single pass
function getHighestScore(scores: number[]): number {
  let max = -Infinity;
  for (const score of scores) {
    if (score > max) max = score;
  }
  return max;
}

// Or using Math.max with spread (fine for small arrays, avoid for large)
function getHighestScore(scores: number[]): number {
  return Math.max(...scores); // Safe for < ~100k items
}
```

---

## `js-set-map-lookups` — Use Set/Map for O(1) lookups

**Why it matters:** `Array.includes()` and `Array.indexOf()` are O(n). `Set.has()` and `Map.get()` are O(1). For repeated lookups or membership tests, convert to Set/Map first.

### BAD
```typescript
// ❌ O(n) check in a hot path
const BLOCKED_ROUTES = ['/admin', '/internal', '/debug', '/api/internal'];

function isBlocked(pathname: string): boolean {
  return BLOCKED_ROUTES.includes(pathname); // O(n) every call
}
```

### GOOD
```typescript
// ✅ O(1) Set lookup
const BLOCKED_ROUTES = new Set(['/admin', '/internal', '/debug', '/api/internal']);

function isBlocked(pathname: string): boolean {
  return BLOCKED_ROUTES.has(pathname); // O(1)
}
```

---

## `js-tosorted-immutable` — Use toSorted() for immutability

**Why it matters:** `Array.sort()` mutates the original array in place. This causes subtle bugs when the array is from a prop, state, or shared reference. `toSorted()` returns a new sorted array without mutation.

### BAD
```typescript
// ❌ Mutates the props array — causes React state bugs
function SortedList({ items }: { items: Item[] }) {
  const sorted = items.sort((a, b) => a.name.localeCompare(b.name)); // Mutates items!
  return <ul>{sorted.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}
```

### GOOD
```typescript
// ✅ toSorted() — returns new array, original unchanged
function SortedList({ items }: { items: Item[] }) {
  const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name));
  return <ul>{sorted.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}

// Also available: toReversed(), toSpliced(), with()
const reversed = items.toReversed(); // Non-mutating reverse
```
