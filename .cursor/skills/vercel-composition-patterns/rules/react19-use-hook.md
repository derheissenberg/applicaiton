# react19-use-hook

**Priority:** MEDIUM  
**Category:** React 19 APIs

> **⚠️ React 19+ only.** These APIs require React 19 or a canary release. Do not apply in React 18 codebases.

React 19 ships APIs that eliminate entire categories of boilerplate: `use()` for conditional context and promise reading, `useOptimistic` for optimistic UI, `useFormStatus` + Server Actions for progressive enhancement, and `useTransition` for non-blocking updates.

---

## `use()` — Conditional context and promise reading

### Why It Matters

`useContext()` is a hook — it can only be called at the top level of a component. This prevents conditionally reading context based on props, which forces awkward workarounds (intermediate components, lifting logic up).

`use()` is not a hook in the traditional sense: it can be called inside conditionals, loops, and early returns.

---

### ❌ Bad: `useContext` forces unconditional call, workarounds break readability

```tsx
// You want to skip reading the theme when a prop says "use default".
// But useContext can't be called conditionally — so you must always call it
// and then ignore it.
function Icon({ useDefaultTheme, name }: { useDefaultTheme?: boolean; name: string }) {
  // Can't do: if (useDefaultTheme) return <DefaultIcon name={name} />;
  // MUST call useContext before any early return.
  const theme = useContext(ThemeContext); // always runs, even when unused
  if (useDefaultTheme) {
    return <DefaultIcon name={name} />;
  }
  return <ThemedIcon name={name} color={theme.iconColor} />;
}
```

---

### ✅ Good: `use()` can be called conditionally

```tsx
import { use } from 'react';

function Icon({ useDefaultTheme, name }: { useDefaultTheme?: boolean; name: string }) {
  // Early return BEFORE reading context — `use()` supports this.
  if (useDefaultTheme) {
    return <DefaultIcon name={name} />;
  }

  // Only reads context when actually needed.
  const theme = use(ThemeContext);
  return <ThemedIcon name={name} color={theme.iconColor} />;
}
```

---

### ✅ Good: `use()` for reading promises (Suspense integration)

`use()` integrates with Suspense: it suspends the component while the promise is pending and resumes when it resolves. Unlike `useEffect` data fetching, no intermediate loading state variable is needed in the component.

```tsx
import { use, Suspense } from 'react';

// Fetch happens outside the component — stable promise reference matters.
async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch user ${id}`);
  return res.json();
}

// The promise is created once and passed down (or cached in a framework like Next.js).
function UserCard({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // suspends until promise resolves
  return (
    <div className="user-card">
      <img src={user.avatarUrl ?? '/default.png'} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// Parent wraps with Suspense — the boundary catches the suspension.
function UserProfile({ userId }: { userId: string }) {
  const userPromise = useMemo(() => fetchUser(userId), [userId]);
  return (
    <Suspense fallback={<UserCardSkeleton />}>
      <UserCard userPromise={userPromise} />
    </Suspense>
  );
}
```

---

## `useOptimistic` — Optimistic UI updates

### Why It Matters

Without `useOptimistic`, implementing optimistic updates requires manual rollback logic: track "real" state, track "optimistic" state, roll back on error. `useOptimistic` handles the rollback automatically when the async operation completes.

---

### ❌ Bad: Manual optimistic state management

```tsx
function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleLike = async () => {
    // Optimistically update
    setIsLiked(true);
    setLikes((n) => n + 1);
    setIsPending(true);
    try {
      await likePost(postId);
    } catch {
      // Manual rollback — easy to forget, easy to get wrong
      setIsLiked(false);
      setLikes((n) => n - 1);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button onClick={handleLike} disabled={isPending}>
      {isLiked ? '❤️' : '🤍'} {likes}
    </button>
  );
}
```

---

### ✅ Good: `useOptimistic` with automatic rollback

```tsx
import { useOptimistic, useTransition } from 'react';

interface LikeState {
  count: number;
  isLiked: boolean;
}

function LikeButton({ postId, initialCount, initialIsLiked }: {
  postId: string;
  initialCount: number;
  initialIsLiked: boolean;
}) {
  const [serverState, setServerState] = useState<LikeState>({
    count: initialCount,
    isLiked: initialIsLiked,
  });

  // optimisticState is the value shown to the user.
  // When the async action completes (or fails), it automatically reverts to serverState.
  const [optimisticState, addOptimisticLike] = useOptimistic(
    serverState,
    (current: LikeState, optimisticValue: boolean): LikeState => ({
      count: current.count + (optimisticValue ? 1 : -1),
      isLiked: optimisticValue,
    }),
  );

  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    const newIsLiked = !optimisticState.isLiked;

    startTransition(async () => {
      addOptimisticLike(newIsLiked); // immediate UI update
      try {
        const updated = await toggleLike(postId);
        setServerState(updated); // sync with server truth
      } catch {
        // useOptimistic automatically reverts to serverState on unmount or transition end
        toast.error('Failed to update like');
      }
    });
  };

  return (
    <button onClick={handleLike} disabled={isPending} aria-pressed={optimisticState.isLiked}>
      {optimisticState.isLiked ? '❤️' : '🤍'} {optimisticState.count}
    </button>
  );
}
```

---

## Server Actions + `useFormStatus`

### Why It Matters

`useFormStatus` reads the pending state of the nearest parent `<form>` that uses a Server Action. This lets you build submit buttons that automatically disable during submission — without threading `isPending` through props.

---

### ❌ Bad: Manual form state, prop-drilled loading state

```tsx
function ContactForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      await submitContact(Object.fromEntries(formData));
    } catch (err) {
      setError('Submission failed. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <textarea name="message" required />
      {/* isPending must be prop-drilled to every button in the form */}
      <SubmitButton isPending={isPending} />
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return <button type="submit" disabled={isPending}>{isPending ? 'Sending...' : 'Send'}</button>;
}
```

---

### ✅ Good: Server Action + `useFormStatus` + `useActionState`

```tsx
'use server';
// actions/contact.ts
export async function submitContactAction(
  prevState: { error: string | null; success: boolean },
  formData: FormData,
): Promise<{ error: string | null; success: boolean }> {
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  if (!email || !message) {
    return { error: 'Email and message are required.', success: false };
  }

  try {
    await sendEmail({ email, message });
    return { error: null, success: true };
  } catch {
    return { error: 'Failed to send. Please try again.', success: false };
  }
}
```

```tsx
'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitContactAction } from '@/actions/contact';

// SubmitButton reads form pending state directly — no props needed.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? 'Sending...' : 'Send Message'}
    </button>
  );
}

function ContactForm() {
  const [state, action] = useActionState(submitContactAction, {
    error: null,
    success: false,
  });

  if (state.success) {
    return <p className="text-green-600">Message sent! We'll be in touch.</p>;
  }

  return (
    <form action={action}>
      <input name="email" type="email" required placeholder="your@email.com" />
      <textarea name="message" required placeholder="Your message..." />
      {state.error && <p role="alert" className="text-red-500">{state.error}</p>}
      {/* SubmitButton reads pending from the form — zero prop drilling */}
      <SubmitButton />
    </form>
  );
}
```

---

## `useTransition` — Non-blocking state updates

### Why It Matters

`useTransition` marks a state update as low-priority. React can interrupt it to handle higher-priority updates (e.g., user input), keeping the UI responsive during expensive re-renders.

---

### ❌ Bad: Synchronous filter blocks the input

```tsx
function ProductSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');

  // Every keystroke triggers filtering 10,000 items synchronously.
  // The input field visually lags because React can't interrupt the render.
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." />
      <ProductGrid products={filtered} />
    </>
  );
}
```

---

### ✅ Good: Deferred filtering with `useTransition` + `useDeferredValue`

```tsx
import { useState, useTransition, useDeferredValue, useMemo } from 'react';

function ProductSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // deferredQuery lags behind query — input stays responsive, filter is interruptible.
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(deferredQuery.toLowerCase())),
    [products, deferredQuery],
  );

  return (
    <>
      <input
        value={query}
        onChange={(e) => {
          // Input update is always immediate (high priority)
          setQuery(e.target.value);
        }}
        placeholder="Search products..."
      />
      {/* Visual indicator that results are stale while re-rendering */}
      <div style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 200ms' }}>
        <ProductGrid products={filtered} />
      </div>
    </>
  );
}
```

Use `startTransition` for explicit non-urgent updates like tab switches:

```tsx
function TabView({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <nav>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            aria-selected={activeTab === i}
            onClick={() => {
              // Tab switch is non-urgent — React may interrupt if user clicks again quickly
              startTransition(() => setActiveTab(i));
            }}
          >
            {tab.label}
            {isPending && activeTab !== i && <Spinner size="xs" />}
          </button>
        ))}
      </nav>
      <Suspense fallback={<TabSkeleton />}>
        {tabs[activeTab].content}
      </Suspense>
    </>
  );
}
```

---

## No `forwardRef` in React 19

In React 19, `ref` is a regular prop — `forwardRef` is no longer needed.

### ❌ Bad: React 18 forwardRef pattern

```tsx
// React 18: extra wrapper, extra type annotation, worse readability.
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, ...rest },
  ref,
) {
  return (
    <label>
      {label}
      <input ref={ref} {...rest} />
    </label>
  );
});
```

### ✅ Good: React 19 — ref as a prop

```tsx
// React 19: ref is just a prop. No forwardRef wrapper.
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  ref?: React.Ref<HTMLInputElement>;
}

function Input({ label, ref, ...rest }: InputProps) {
  return (
    <label>
      {label}
      <input ref={ref} {...rest} />
    </label>
  );
}

// Usage is identical — no change at the call site.
const inputRef = useRef<HTMLInputElement>(null);
<Input label="Email" ref={inputRef} type="email" />
```

---

## Quick Decision Guide

| Need | React 18 | React 19 |
|---|---|---|
| Read context | `useContext(Ctx)` | `use(Ctx)` — can be conditional |
| Read promise | `useEffect` + state | `use(promise)` + Suspense |
| Optimistic update | Manual rollback | `useOptimistic` |
| Form submission state | Prop-drilled `isPending` | `useFormStatus()` in child |
| Non-blocking update | `useTransition` | `useTransition` (unchanged) |
| Forward ref | `forwardRef(fn)` | `ref` as plain prop |

---

## References

- `state-context-interface.md` — Typing context for `use()`
- `patterns-compound-components.md` — Context-based compound components
