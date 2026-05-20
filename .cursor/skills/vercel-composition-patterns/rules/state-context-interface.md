# state-context-interface

**Priority:** MEDIUM  
**Category:** State Management

Context without a typed interface is a runtime landmine. Untyped context, monolithic context, and missing wrapper hooks are the three failure modes that make context-based state management painful to maintain and extend.

---

## Why It Matters

Context is not a state manager — it's a dependency injection mechanism. Treating it as one leads to: consumers that re-render on every state change (even unrelated keys), impossible-to-mock context in tests, and TypeScript losing track of what's actually available.

---

## ❌ Bad: Untyped `any` context

```tsx
// No type safety, consumers can't know what's available without reading the provider.
const UserContext = React.createContext<any>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <UserContext.Provider value={{ user, setUser, loading, setLoading }}>
      {children}
    </UserContext.Provider>
  );
}

// Consumer: TypeScript can't help here.
function Avatar() {
  const { user } = useContext(UserContext); // type: any
  return <img src={user.avatar} />; // no autocomplete, no null check
}
```

---

## ✅ Good: Typed context with explicit interface and wrapper hook

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface UserContextValue {
  // State
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  // Actions — expose stable function references, not raw setters
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'avatarUrl'>>) => Promise<void>;
}

// undefined initial value forces the hook to check for missing Provider
const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const u = await authApi.login(credentials);
      setUser(u);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Login failed'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Pick<User, 'name' | 'avatarUrl'>>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : null));
    await userApi.updateProfile(patch);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ user, isLoading, error, login, logout, updateProfile }),
    [user, isLoading, error, login, logout, updateProfile],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Wrapper hook — the ONLY way consumers access this context.
// Throws if used outside Provider. Enables easy mocking in tests.
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (ctx === undefined) {
    throw new Error('useUser must be used within a <UserProvider>');
  }
  return ctx;
}

// Consumer: fully typed, autocomplete works, null checked by the interface.
function Avatar() {
  const { user } = useUser();
  if (!user) return <AvatarPlaceholder />;
  return <img src={user.avatarUrl ?? '/default-avatar.png'} alt={user.name} />;
}
```

---

## ❌ Bad: God context that causes all consumers to re-render

```tsx
// Everything in one context. Any change to cart, theme, OR user causes every consumer to re-render.
const AppContext = React.createContext<{
  user: User | null;
  cart: CartItem[];
  theme: 'light' | 'dark';
  notifications: Notification[];
  // ... 15 more fields
} | undefined>(undefined);

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Every time cart changes, ThemeToggle re-renders. Every time user changes, CartBadge re-renders.
  return (
    <AppContext.Provider value={{ user, cart, theme, setUser, setCart, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}
```

---

## ✅ Good: Split contexts by update frequency

Separate contexts by how often their state changes. High-frequency state (cart, notifications) should not share a context with low-frequency state (user, theme).

```tsx
// Stable: changes rarely (login/logout)
interface AuthContextValue {
  user: User | null;
  login: (creds: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

// High frequency: changes on every add/remove
interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, qty: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  totalPrice: number;
}
const CartContext = React.createContext<CartContextValue | undefined>(undefined);

// Static: only changes when user explicitly toggles
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

// Compose providers at the app boundary
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>{children}</CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Consumers only re-render when their specific context changes.
function CartBadge() {
  const { items } = useCart(); // re-renders on cart changes only
  return <span>{items.length}</span>;
}

function UserMenu() {
  const { user } = useAuth(); // re-renders on auth changes only
  return <span>{user?.name}</span>;
}
```

---

## ✅ Good: Context with useReducer for complex state transitions

When actions outnumber setters, replace `useState` + callbacks with `useReducer`. This also makes the interface more stable — dispatch is always the same reference.

```tsx
type CartAction =
  | { type: 'ADD_ITEM'; product: Product; qty: number }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'UPDATE_QTY'; itemId: string; qty: number }
  | { type: 'CLEAR' };

interface CartState {
  items: CartItem[];
  totalPrice: number;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.productId === action.product.id);
      const items = existing
        ? state.items.map((i) =>
            i.productId === action.product.id ? { ...i, qty: i.qty + action.qty } : i,
          )
        : [...state.items, { productId: action.product.id, product: action.product, qty: action.qty }];
      return { items, totalPrice: computeTotal(items) };
    }
    case 'REMOVE_ITEM': {
      const items = state.items.filter((i) => i.productId !== action.itemId);
      return { items, totalPrice: computeTotal(items) };
    }
    case 'UPDATE_QTY': {
      const items = state.items.map((i) =>
        i.productId === action.itemId ? { ...i, qty: action.qty } : i,
      );
      return { items, totalPrice: computeTotal(items) };
    }
    case 'CLEAR':
      return { items: [], totalPrice: 0 };
    default:
      return state;
  }
}

interface CartContextValue {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
}

const CartContext = React.createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], totalPrice: 0 });
  // dispatch is always the same reference — no useMemo needed for the context value
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}

// Consumer dispatches typed actions — no callback prop drilling needed.
function AddToCartButton({ product }: { product: Product }) {
  const { dispatch } = useCart();
  return (
    <button onClick={() => dispatch({ type: 'ADD_ITEM', product, qty: 1 })}>
      Add to Cart
    </button>
  );
}
```

---

## ✅ Good: Context selector pattern to prevent unnecessary re-renders

When you can't split a context further, memoize derived values in the consumer via `useMemo` or a custom selector hook.

```tsx
// Custom hook that selects only what this component needs.
// The component won't re-render if other cart fields change.
function useCartItemCount() {
  const { state } = useCart();
  return useMemo(() => state.items.reduce((sum, i) => sum + i.qty, 0), [state.items]);
}

function CartBadge() {
  const count = useCartItemCount();
  return count > 0 ? <span className="badge">{count}</span> : null;
}
```

---

## Testing: Mock the wrapper hook, not the context

```tsx
// ✅ Easy to mock because consumers call useUser(), not useContext() directly.
jest.mock('@/contexts/user-context', () => ({
  useUser: () => ({
    user: { id: '1', name: 'Alice', email: 'alice@example.com', avatarUrl: null },
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
  }),
}));
```

---

## References

- `architecture-avoid-boolean-props.md` — Component API design
- `patterns-compound-components.md` — Compound component pattern (context-based)
