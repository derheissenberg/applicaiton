# patterns-compound-components

**Priority:** MEDIUM  
**Category:** Implementation Patterns

Compound components give consumers surgical control over structure without requiring the parent component to anticipate every layout variation upfront. The parent owns state; the children own rendering. Consumers wire them together.

---

## Why It Matters

Monolithic components accumulate props for every customization a consumer ever needed. Compound components stop this accumulation dead: new rendering requirements are met by adding new sub-components, not new props on the parent.

---

## ❌ Bad: Monolithic component with configuration props

```tsx
// Six months of feature requests compressed into one prop list.
// The component "knows" too much about every consumer's layout needs.
interface AccordionProps {
  title: string;
  content: string;
  subtitle?: string;
  icon?: React.ReactNode;
  footer?: string;
  footerAlign?: 'left' | 'right';
  collapsible?: boolean;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  showDivider?: boolean;
  elevation?: 'none' | 'sm' | 'md';
}

function Accordion({
  title,
  content,
  subtitle,
  icon,
  footer,
  footerAlign = 'left',
  collapsible = true,
  defaultOpen = false,
  onToggle,
  headerClassName,
  bodyClassName,
  footerClassName,
  showDivider,
  elevation = 'none',
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  // ...
}

// The consumer is at the mercy of what Accordion decided to expose.
<Accordion
  title="Shipping Options"
  subtitle="Choose delivery speed"
  icon={<TruckIcon />}
  content="Standard, Express, Overnight..."
  footer="Prices shown before tax"
  footerAlign="right"
  showDivider
  elevation="sm"
/>
```

---

## ✅ Good: Compound components with shared context

```tsx
// 1. Define the shared state that sub-components need access to.
interface AccordionContextValue {
  open: boolean;
  toggle: () => void;
  id: string; // for ARIA
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

function useAccordionContext() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion sub-components must be used inside <Accordion>');
  return ctx;
}

// 2. Parent manages state, exposes it via context.
interface AccordionProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

function Accordion({ children, defaultOpen = false, onToggle }: AccordionProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      onToggle?.(!prev);
      return !prev;
    });
  }, [onToggle]);

  return (
    <AccordionContext.Provider value={{ open, toggle, id }}>
      <div className="accordion">{children}</div>
    </AccordionContext.Provider>
  );
}

// 3. Sub-components pull state from context — no prop drilling.
Accordion.Header = function AccordionHeader({ children }: { children: React.ReactNode }) {
  const { open, toggle, id } = useAccordionContext();
  return (
    <button
      id={`${id}-header`}
      aria-expanded={open}
      aria-controls={`${id}-body`}
      className="accordion-header"
      onClick={toggle}
    >
      {children}
      <ChevronIcon className={cn('transition-transform', open && 'rotate-180')} />
    </button>
  );
};

Accordion.Body = function AccordionBody({ children }: { children: React.ReactNode }) {
  const { open, id } = useAccordionContext();
  return (
    <div
      id={`${id}-body`}
      role="region"
      aria-labelledby={`${id}-header`}
      hidden={!open}
      className="accordion-body"
    >
      {children}
    </div>
  );
};

Accordion.Footer = function AccordionFooter({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  return <div className={cn('accordion-footer', alignClass[align])}>{children}</div>;
};

// Consumer has total layout control. No new props needed for new layouts.
<Accordion defaultOpen onToggle={(open) => analytics.track('accordion_toggle', { open })}>
  <Accordion.Header>
    <TruckIcon /> Shipping Options
    <span className="text-sm text-muted">Choose delivery speed</span>
  </Accordion.Header>
  <Accordion.Body>
    <ShippingOptionList />
  </Accordion.Body>
  <Accordion.Footer align="right">
    <span className="text-xs text-muted">Prices shown before tax</span>
  </Accordion.Footer>
</Accordion>
```

---

## ❌ Bad: Using React.Children + cloneElement for prop injection

`cloneElement` is fragile — it breaks when consumers wrap sub-components in other elements, and it requires runtime type-checking to identify which children to clone.

```tsx
function TabGroup({ children, activeTab, onChange }: TabGroupProps) {
  return (
    <div>
      {React.Children.map(children, (child, index) => {
        // Breaks if child is wrapped in a <div> or <Fragment>
        // Breaks if child is a string or null
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<any>, {
          isActive: index === activeTab,
          onClick: () => onChange(index),
        });
      })}
    </div>
  );
}
```

---

## ✅ Good: Context is the correct prop-sharing mechanism for compound components

```tsx
// All sub-components read from context — no cloneElement, no Children traversal.
interface TabGroupContextValue {
  activeTab: number;
  setActiveTab: (index: number) => void;
}

const TabGroupContext = React.createContext<TabGroupContextValue | undefined>(undefined);

function TabGroup({
  children,
  defaultTab = 0,
}: {
  children: React.ReactNode;
  defaultTab?: number;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabGroupContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tab-group">{children}</div>
    </TabGroupContext.Provider>
  );
}

TabGroup.List = function TabList({ children }: { children: React.ReactNode }) {
  return <div role="tablist" className="tab-list">{children}</div>;
};

TabGroup.Tab = function Tab({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const { activeTab, setActiveTab } = useContext(TabGroupContext)!;
  return (
    <button
      role="tab"
      aria-selected={activeTab === index}
      className={cn('tab', activeTab === index && 'tab-active')}
      onClick={() => setActiveTab(index)}
    >
      {children}
    </button>
  );
};

TabGroup.Panel = function TabPanel({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const { activeTab } = useContext(TabGroupContext)!;
  if (activeTab !== index) return null;
  return (
    <div role="tabpanel" className="tab-panel">
      {children}
    </div>
  );
};

// Consumer: index-based coupling between Tab and Panel, but no prop drilling.
<TabGroup defaultTab={0}>
  <TabGroup.List>
    <TabGroup.Tab index={0}>Overview</TabGroup.Tab>
    <TabGroup.Tab index={1}>Reviews</TabGroup.Tab>
    <TabGroup.Tab index={2}>Specifications</TabGroup.Tab>
  </TabGroup.List>
  <TabGroup.Panel index={0}><ProductOverview /></TabGroup.Panel>
  <TabGroup.Panel index={1}><ProductReviews /></TabGroup.Panel>
  <TabGroup.Panel index={2}><ProductSpecs /></TabGroup.Panel>
</TabGroup>
```

---

## ✅ Alternative: Render Props for inversion of control

Use render props (or the function-as-children pattern) when a component needs to share computed state with consumers who want full rendering control — without creating named sub-components.

```tsx
// Render props: consumer controls rendering, component controls behavior.
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  children: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
}

function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  children,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length,
  );

  return (
    <div
      style={{ height: containerHeight, overflowY: 'auto', position: 'relative' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {items.slice(startIndex, endIndex).map((item, i) =>
          children(item, startIndex + i, {
            position: 'absolute',
            top: (startIndex + i) * itemHeight,
            height: itemHeight,
            width: '100%',
          }),
        )}
      </div>
    </div>
  );
}

// Consumer controls how each item renders — VirtualList controls windowing logic.
<VirtualList items={products} itemHeight={72} containerHeight={400}>
  {(product, index, style) => (
    <div key={product.id} style={style}>
      <ProductRow product={product} rank={index + 1} />
    </div>
  )}
</VirtualList>
```

---

## Choosing Between Patterns

| Scenario | Pattern |
|---|---|
| Complex component with interdependent parts (tabs, accordion) | Compound components + context |
| Component that delegates rendering of data it controls | Render props / function children |
| Simple structural variants (button styles) | Explicit `variant` prop |
| Layout slots (header, body, footer) | Named children via compound components |

---

## References

- `architecture-avoid-boolean-props.md` — When compound components replace booleans
- `state-context-interface.md` — Typing context correctly
