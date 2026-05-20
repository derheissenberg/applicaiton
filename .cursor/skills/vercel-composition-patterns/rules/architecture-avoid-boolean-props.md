# architecture-avoid-boolean-props

**Priority:** HIGH  
**Category:** Component Architecture

Boolean props are the primary driver of component API rot. Each new boolean represents a new mode, and modes multiply combinatorially — `n` booleans create up to `2^n` possible states, most of which were never designed to coexist.

---

## Why It Matters

Boolean props force consumers to understand internal component modes instead of expressing intent. They also prevent TypeScript from catching illegal state combinations (e.g., `success={true} error={true}`).

---

## ❌ Bad: Boolean prop accumulation

```tsx
// Every new requirement adds another boolean.
// After 6 months this component has 12 booleans and nobody knows which combinations are valid.
interface ButtonProps {
  primary?: boolean;
  secondary?: boolean;
  danger?: boolean;
  large?: boolean;
  small?: boolean;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: boolean;
  iconRight?: boolean;
  fullWidth?: boolean;
  outlined?: boolean;
  ghost?: boolean;
}

function Button({
  primary,
  secondary,
  danger,
  large,
  small,
  loading,
  disabled,
  ...
}: ButtonProps) {
  // Which takes precedence: primary + danger? large + small?
  const variant = primary ? 'primary' : secondary ? 'secondary' : danger ? 'danger' : 'default';
  const size = large ? 'lg' : small ? 'sm' : 'md';
  // ...
}

// Usage: completely opaque intent
<Button primary large iconLeft loading />
```

---

## ✅ Good: Explicit variant and size props

```tsx
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outlined';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(variants[variant], sizes[size], fullWidth && 'w-full')}
    >
      {loading ? <Spinner size={size} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

// Usage: intent is self-documenting
<Button variant="danger" size="lg" leftIcon={<TrashIcon />} loading={isDeleting}>
  Delete Account
</Button>
```

---

## ❌ Bad: Boolean flags encoding component state

```tsx
interface ModalProps {
  open: boolean;
  success?: boolean;
  error?: boolean;
  warning?: boolean;
  title: string;
  message: string;
}

// What does success={true} error={true} mean? The component can't prevent it.
<Modal open={true} success={true} error={false} title="Done" message="All set!" />
```

---

## ✅ Good: Discriminated union encodes valid states

```tsx
type ModalState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; error: Error; onRetry?: () => void }
  | { status: 'warning'; message: string; onConfirm: () => void };

interface ModalProps {
  open: boolean;
  title: string;
  state: ModalState;
  onClose: () => void;
}

function Modal({ open, title, state, onClose }: ModalProps) {
  return (
    <dialog open={open}>
      <h2>{title}</h2>
      {state.status === 'success' && <SuccessBanner message={state.message} />}
      {state.status === 'error' && (
        <ErrorBanner error={state.error} onRetry={state.onRetry} />
      )}
      {state.status === 'warning' && (
        <WarningBanner message={state.message} onConfirm={state.onConfirm} />
      )}
      <button onClick={onClose}>Close</button>
    </dialog>
  );
}

// TypeScript enforces that error state must have an Error, not just a boolean.
<Modal
  open={isOpen}
  title="Import Results"
  state={{ status: 'error', error: new Error('Network timeout'), onRetry: handleRetry }}
  onClose={close}
/>
```

---

## ✅ Good: Compound components as the boolean-free alternative

When a component needs deeply customizable structure (not just style), boolean props are fundamentally the wrong tool. Reach for compound components instead — the consumer controls what renders and where.

```tsx
// Instead of: <Card hasHeader hasFooter footerAlign="right" headerSize="lg" collapsible />
// Do this:

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

Card.Header = function CardHeader({
  children,
  size = 'md',
}: {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  return <div className={cn('card-header', headerSizes[size])}>{children}</div>;
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>;
};

Card.Footer = function CardFooter({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  return <div className={cn('card-footer', footerAlign[align])}>{children}</div>;
};

// Usage: the API surface is infinite but the implementation is O(parts), not O(2^booleans)
<Card>
  <Card.Header size="lg">Import Data</Card.Header>
  <Card.Body>
    <p>Select a CSV file to import.</p>
  </Card.Body>
  <Card.Footer align="right">
    <Button variant="ghost" onClick={cancel}>Cancel</Button>
    <Button variant="primary" onClick={submit}>Import</Button>
  </Card.Footer>
</Card>
```

---

## Migration Strategy

When you inherit a component drowning in booleans:

1. **Audit combinations**: list which boolean combinations actually exist in production
2. **Name the variants**: if `primary + large` always appears together, it's probably a named variant
3. **Introduce a `variant` prop** first — it consolidates the most common booleans
4. **Deprecate booleans** with a runtime warning before removing them

```tsx
function Button({ primary, variant, ...rest }: ButtonProps) {
  if (primary !== undefined) {
    console.warn('[Button] `primary` is deprecated. Use `variant="primary"` instead.');
  }
  const resolvedVariant = variant ?? (primary ? 'primary' : 'default');
  return <button className={variants[resolvedVariant]} {...rest} />;
}
```

---

## References

- `patterns-compound-components.md` — Full compound component pattern
- `patterns-explicit-variants.md` — Variant-first component design
