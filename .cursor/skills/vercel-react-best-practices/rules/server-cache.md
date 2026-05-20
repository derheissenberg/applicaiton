# Server-Side Performance (HIGH)

Server Components run in a privileged environment with direct database access and no client round-trips. These rules ensure that privilege is used efficiently — deduplicating work, minimizing data sent to clients, and keeping non-critical work out of the critical path.

---

## `server-auth-actions` — Authenticate server actions like API routes

**Why it matters:** Server Actions are publicly callable. Without authentication checks inside the action, any user can invoke them regardless of UI visibility. Treat every Server Action as a public API endpoint.

### BAD
```typescript
// app/actions/deletePost.ts
'use server';
import { db } from '@/lib/db';

// ❌ No auth check — anyone can delete any post
export async function deletePost(postId: string) {
  await db.post.delete({ where: { id: postId } });
}
```

### GOOD
```typescript
// app/actions/deletePost.ts
'use server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function deletePost(postId: string) {
  // ✅ Authenticate inside the action, not just in the UI
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // ✅ Verify ownership — not just authentication
  const post = await db.post.findUnique({ where: { id: postId } });
  if (post?.authorId !== session.user.id) {
    throw new Error('Forbidden');
  }

  await db.post.delete({ where: { id: postId } });
}
```

---

## `server-cache-react` — Use React.cache() for per-request deduplication

**Why it matters:** Multiple Server Components in the same render tree often need the same data. Without deduplication, each calls the database independently. `React.cache()` memoizes the result for the duration of a single request.

### BAD
```typescript
// lib/data.ts
// ❌ Every call hits the database — if 5 components call this, 5 DB queries run
export async function getUser(id: string) {
  return db.user.findUnique({ where: { id } });
}

// app/page.tsx — three components each trigger a separate DB query for the same user
export default async function Page({ params }: { params: { id: string } }) {
  return (
    <div>
      <Header userId={params.id} />   {/* calls getUser */}
      <Profile userId={params.id} />  {/* calls getUser again */}
      <Sidebar userId={params.id} />  {/* calls getUser a third time */}
    </div>
  );
}
```

### GOOD
```typescript
// lib/data.ts
import { cache } from 'react';

// ✅ Deduplicated per request — 3 components, 1 DB query
export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});
```

**Note:** `React.cache()` is scoped to a single server render. The cache is discarded after the response is sent — use `server-cache-lru` for cross-request caching.

---

## `server-cache-lru` — Use LRU cache for cross-request caching

**Why it matters:** `React.cache()` only lasts one request. For data that changes infrequently (config, feature flags, reference data), an in-memory LRU cache with a TTL avoids redundant database round-trips across requests.

### BAD
```typescript
// lib/config.ts
// ❌ Config is re-fetched from DB on every single request
export async function getSiteConfig() {
  return db.config.findFirst();
}
```

### GOOD
```typescript
// lib/config.ts
import { LRUCache } from 'lru-cache';

const configCache = new LRUCache<string, SiteConfig>({
  max: 100,
  ttl: 1000 * 60 * 5, // 5-minute TTL
});

export async function getSiteConfig(): Promise<SiteConfig> {
  const cached = configCache.get('site-config');
  if (cached) return cached;

  // ✅ Only hits DB when cache is cold or expired
  const config = await db.config.findFirst();
  if (config) configCache.set('site-config', config);
  return config!;
}
```

### For Next.js built-in caching
```typescript
// Use fetch() with revalidation for external APIs
async function getFeatureFlags() {
  const res = await fetch('https://api.flags.example.com/flags', {
    next: { revalidate: 300 }, // Revalidate every 5 minutes
  });
  return res.json();
}
```

---

## `server-dedup-props` — Avoid duplicate serialization in RSC props

**Why it matters:** When a Server Component passes large objects to multiple Client Components, the data is serialized separately for each. Extract shared data into a single prop or context to serialize it once.

### BAD
```typescript
// app/dashboard/page.tsx
// ❌ user is serialized 3 times into the RSC payload
export default async function DashboardPage() {
  const user = await getUser();
  return (
    <div>
      <Header user={user} />        {/* user serialized here */}
      <Sidebar user={user} />       {/* user serialized again */}
      <ProfileCard user={user} />   {/* and again */}
    </div>
  );
}
```

### GOOD
```typescript
// app/dashboard/page.tsx
// ✅ user is serialized once; child components read from context
import { UserProvider } from '@/context/UserContext';

export default async function DashboardPage() {
  const user = await getUser();
  return (
    <UserProvider user={user}>  {/* serialized once */}
      <Header />
      <Sidebar />
      <ProfileCard />
    </UserProvider>
  );
}

// context/UserContext.tsx
'use client';
import { createContext, useContext } from 'react';

const UserContext = createContext<User | null>(null);

export function UserProvider({ user, children }: { user: User; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
```

---

## `server-serialization` — Minimize data passed to client components

**Why it matters:** Every prop passed from a Server Component to a Client Component is serialized into the RSC payload and sent over the wire. Pass only what the client actually renders.

### BAD
```typescript
// app/posts/page.tsx
// ❌ Entire post objects (with body, metadata, author objects) are sent to client
export default async function PostsPage() {
  const posts = await db.post.findMany({
    include: { author: true, tags: true, comments: true },
  });
  return <PostList posts={posts} />;
}
```

### GOOD
```typescript
// app/posts/page.tsx
// ✅ Only the fields needed for rendering are serialized
export default async function PostsPage() {
  const posts = await db.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
      author: { select: { name: true, avatarUrl: true } },
    },
  });
  return <PostList posts={posts} />;
}
```

---

## `server-parallel-fetching` — Restructure components to parallelize fetches

**Why it matters:** A single Server Component that sequentially fetches data for all its children creates a waterfall. Restructuring fetches into leaf components that each own their data allows Next.js to stream them in parallel.

### BAD
```typescript
// app/dashboard/page.tsx — single component owns all fetches sequentially
export default async function DashboardPage() {
  const stats = await fetchStats();        // ~200ms
  const activity = await fetchActivity();  // ~300ms (waits for stats)
  const alerts = await fetchAlerts();      // ~150ms (waits for activity)

  return (
    <div>
      <StatsPanel stats={stats} />
      <ActivityFeed items={activity} />
      <AlertBanner alerts={alerts} />
    </div>
  );
}
```

### GOOD
```typescript
// app/dashboard/page.tsx — each section fetches independently, streams as ready
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel />          {/* fetches its own data */}
      </Suspense>
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityFeed />        {/* fetches its own data */}
      </Suspense>
      <Suspense fallback={<AlertSkeleton />}>
        <AlertBanner />         {/* fetches its own data */}
      </Suspense>
    </div>
  );
}

async function StatsPanel() {
  const stats = await fetchStats();
  return <StatsPanelUI stats={stats} />;
}
```

---

## `server-after-nonblocking` — Use after() for non-blocking operations

**Why it matters:** Side effects like analytics, audit logging, and cache warming don't need to happen before the response is sent. `after()` runs them after the response completes, keeping response latency low.

### BAD
```typescript
// app/actions/createPost.ts
'use server';

export async function createPost(data: CreatePostInput) {
  const post = await db.post.create({ data });

  // ❌ These block the response — user waits for analytics + email
  await trackAnalyticsEvent('post_created', { postId: post.id });
  await sendNewPostNotificationEmail(post);
  await updateSearchIndex(post);

  return post;
}
```

### GOOD
```typescript
// app/actions/createPost.ts
'use server';
import { after } from 'next/server';

export async function createPost(data: CreatePostInput) {
  const post = await db.post.create({ data });

  // ✅ Non-blocking — these run after the response is sent
  after(async () => {
    await trackAnalyticsEvent('post_created', { postId: post.id });
    await sendNewPostNotificationEmail(post);
    await updateSearchIndex(post);
  });

  // Response returns immediately with the created post
  return post;
}
```
