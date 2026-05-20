# Eliminating Waterfalls (CRITICAL)

Waterfalls are sequential async operations where each waits for the previous to finish before starting. They are the single biggest source of slow page loads in React/Next.js apps. These rules eliminate unnecessary sequencing.

---

## `async-defer-await` — Move await into branches where actually used

**Why it matters:** Awaiting a promise before you know if you need the result creates an unnecessary delay for every request, even when the branch is skipped.

### BAD
```typescript
// app/dashboard/page.tsx
export default async function DashboardPage({ searchParams }: { searchParams: { tab?: string } }) {
  // Awaited unconditionally — even when tab !== 'analytics'
  const analyticsData = await fetchAnalytics();
  const tab = searchParams.tab ?? 'overview';

  if (tab === 'analytics') {
    return <AnalyticsTab data={analyticsData} />;
  }
  return <OverviewTab />;
}
```

### GOOD
```typescript
// app/dashboard/page.tsx
export default async function DashboardPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = searchParams.tab ?? 'overview';

  if (tab === 'analytics') {
    // Await only when the branch is actually entered
    const analyticsData = await fetchAnalytics();
    return <AnalyticsTab data={analyticsData} />;
  }
  return <OverviewTab />;
}
```

---

## `async-parallel` — Use Promise.all() for independent operations

**Why it matters:** Sequential awaits of independent operations add their latencies together. Promise.all() runs them concurrently, cutting wait time to the slowest single operation.

### BAD
```typescript
// app/profile/[id]/page.tsx
export default async function ProfilePage({ params }: { params: { id: string } }) {
  // Total wait: ~300ms + ~200ms + ~150ms = 650ms
  const user = await fetchUser(params.id);       // ~300ms
  const posts = await fetchUserPosts(params.id); // ~200ms
  const followers = await fetchFollowers(params.id); // ~150ms

  return <Profile user={user} posts={posts} followers={followers} />;
}
```

### GOOD
```typescript
// app/profile/[id]/page.tsx
export default async function ProfilePage({ params }: { params: { id: string } }) {
  // Total wait: ~300ms (the slowest operation)
  const [user, posts, followers] = await Promise.all([
    fetchUser(params.id),
    fetchUserPosts(params.id),
    fetchFollowers(params.id),
  ]);

  return <Profile user={user} posts={posts} followers={followers} />;
}
```

---

## `async-dependencies` — Use better-all for partial dependencies

**Why it matters:** When some operations depend on earlier results but others don't, neither pure sequential nor pure parallel is optimal. Start independent work immediately, then await what's needed.

### BAD
```typescript
// Sequential: user → [org, settings] one after another
export default async function WorkspacePage({ params }: { params: { id: string } }) {
  const user = await fetchUser(params.id);
  const org = await fetchOrg(user.orgId);       // depends on user
  const settings = await fetchSettings(user.id); // depends on user, but independent of org
  return <Workspace org={org} settings={settings} />;
}
```

### GOOD
```typescript
// Start both org and settings as soon as user resolves
export default async function WorkspacePage({ params }: { params: { id: string } }) {
  const user = await fetchUser(params.id);

  // org and settings are independent of each other — run in parallel
  const [org, settings] = await Promise.all([
    fetchOrg(user.orgId),
    fetchSettings(user.id),
  ]);

  return <Workspace org={org} settings={settings} />;
}
```

### BETTER (with `better-all` for complex dependency graphs)
```typescript
import betterAll from 'better-all';

export default async function WorkspacePage({ params }: { params: { id: string } }) {
  const [org, settings] = await betterAll({
    // better-all automatically resolves dependency order
    user: () => fetchUser(params.id),
    org: ({ user }) => fetchOrg(user.orgId),
    settings: ({ user }) => fetchSettings(user.id),
  }, ['org', 'settings']);

  return <Workspace org={org} settings={settings} />;
}
```

---

## `async-api-routes` — Start promises early, await late in API routes

**Why it matters:** In API route handlers, you can kick off async work before performing synchronous validation or transformation steps, reducing total handler latency.

### BAD
```typescript
// app/api/dashboard/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 });
  }

  // Synchronous work happens before fetches start
  const parsed = parseQueryParams(searchParams);

  // Sequential awaits — each waits for the previous
  const user = await fetchUser(userId);
  const metrics = await fetchMetrics(userId);

  return Response.json({ user, metrics, parsed });
}
```

### GOOD
```typescript
// app/api/dashboard/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 });
  }

  // Start promises IMMEDIATELY before any synchronous work
  const userPromise = fetchUser(userId);
  const metricsPromise = fetchMetrics(userId);

  // Synchronous work runs while fetches are in-flight
  const parsed = parseQueryParams(searchParams);

  // Await only when you actually need the values
  const [user, metrics] = await Promise.all([userPromise, metricsPromise]);

  return Response.json({ user, metrics, parsed });
}
```

---

## `async-suspense-boundaries` — Use Suspense to stream content

**Why it matters:** Wrapping slow components in `<Suspense>` lets Next.js stream the rest of the page immediately while the slow parts load in parallel. Users see content faster even if some sections are still loading.

### BAD
```typescript
// app/home/page.tsx — entire page blocks on the slowest fetch
export default async function HomePage() {
  // All three must resolve before ANY HTML is sent
  const [feed, trending, recommendations] = await Promise.all([
    fetchFeed(),       // ~500ms
    fetchTrending(),   // ~200ms
    fetchRecommendations(), // ~800ms — slowest — blocks everything
  ]);

  return (
    <main>
      <Feed items={feed} />
      <Trending items={trending} />
      <Recommendations items={recommendations} />
    </main>
  );
}
```

### GOOD
```typescript
// app/home/page.tsx — shell streams immediately, sections load independently
import { Suspense } from 'react';

export default function HomePage() {
  return (
    <main>
      {/* Fast sections render as soon as their data is ready */}
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
      <Suspense fallback={<TrendingSkeleton />}>
        <Trending />
      </Suspense>
      {/* Slow section doesn't block the others */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </main>
  );
}

// Each component fetches its own data
async function Feed() {
  const items = await fetchFeed(); // ~500ms
  return <FeedList items={items} />;
}

async function Trending() {
  const items = await fetchTrending(); // ~200ms — renders first
  return <TrendingList items={items} />;
}

async function Recommendations() {
  const items = await fetchRecommendations(); // ~800ms — renders last
  return <RecommendationsList items={items} />;
}
```
