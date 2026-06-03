import {
  loadSession,
  refreshSession,
  saveSession,
  type BlueskySession,
} from "./bluesky-auth";
import { env } from "./env";

export type BskyProfile = {
  did: string;
  handle: string;
  displayName: string;
  description: string;
  avatar: string | null;
  banner: string | null;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  createdAt: string | null;
  indexedAt: string | null;
  viewer?: {
    following?: string;
    followedBy?: string;
  };
};

export type BskyPostAuthor = {
  did: string;
  handle: string;
  displayName: string;
  avatar: string | null;
};

export type BskyPostImage = {
  thumb: string;
  fullsize: string;
  alt: string;
};

export type BskyPostFacet = {
  index: { byteStart: number; byteEnd: number };
  features: Array<
    | { $type: "app.bsky.richtext.facet#mention"; did: string }
    | { $type: "app.bsky.richtext.facet#link"; uri: string }
    | { $type: "app.bsky.richtext.facet#tag"; tag: string }
  >;
};

export type BskyPostRecord = {
  text: string;
  facets?: BskyPostFacet[];
  createdAt?: string;
  reply?: { parent?: { uri?: string }; root?: { uri?: string } };
};

export type BskyEmbedExternal = {
  uri: string;
  title?: string;
  description?: string;
  thumb?: string;
};

export type BskyEmbedRecord = {
  uri: string;
  cid?: string;
  author?: BskyPostAuthor;
  value?: { text?: string; createdAt?: string };
};

export type BskyVideoEmbed = {
  cid: string;
  playlist: string;
  thumbnail?: string;
  alt?: string;
  aspectRatio?: { width: number; height: number };
  presentation?: "default" | "gif";
};

export type BskyEmbed = {
  images?: BskyPostImage[];
  external?: BskyEmbedExternal;
  record?: BskyEmbedRecord;
  video?: BskyVideoEmbed;
};

export type BskySearchPost = {
  uri: string;
  cid: string;
  author: BskyPostAuthor;
  record: BskyPostRecord;
  embed?: BskyEmbed;
  replyCount: number;
  repostCount: number;
  likeCount: number;
  indexedAt: string;
};

export type BskyFeedItem = {
  uri: string;
  cid: string;
  indexedAt: string;
  author: BskyPostAuthor;
  text: string;
  record?: BskyPostRecord;
  embed?: BskyEmbed;
  facets?: BskyPostFacet[];
  isReply: boolean;
  isRepost: boolean;
  repostedBy: { handle: string; displayName: string } | null;
  images: BskyPostImage[];
  replyCount: number;
  repostCount: number;
  likeCount: number;
};

const PUBLIC_API = env.BLUESKY_PUBLIC_API;

async function authedFetch(
  session: BlueskySession,
  path: string,
  init?: RequestInit
): Promise<Response> {
  let current = session;
  let res = await fetch(`${current.pdsUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${current.accessJwt}`,
    },
  });

  if (res.status === 401 || res.status === 400) {
    let needsRefresh = res.status === 401;
    if (res.status === 400) {
      try {
        const body = await res.clone().json();
        if (body?.error === "ExpiredToken") needsRefresh = true;
      } catch {}
    }
    if (needsRefresh) {
      try {
        current = await refreshSession(current);
        await saveSession(current);
      } catch {
        throw new Error("Session expired — please sign in again");
      }
      res = await fetch(`${current.pdsUrl}${path}`, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${current.accessJwt}`,
        },
      });
    }
  }

  return res;
}

export async function fetchMyProfile(): Promise<BskyProfile> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");

  const url = `${PUBLIC_API}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(
    session.did
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
  const data = await res.json();
  const viewerData = data.viewer;

  return {
    did: data.did,
    handle: data.handle,
    displayName: data.displayName ?? data.handle,
    description: data.description ?? "",
    avatar: data.avatar ?? null,
    banner: data.banner ?? null,
    followersCount: data.followersCount ?? 0,
    followsCount: data.followsCount ?? 0,
    postsCount: data.postsCount ?? 0,
    createdAt: data.createdAt ?? null,
    indexedAt: data.indexedAt ?? null,
    viewer: viewerData
      ? {
          following: viewerData.following ?? undefined,
          followedBy: viewerData.followedBy ?? undefined,
        }
      : undefined,
  };
}

export async function fetchProfileByDid(
  actor: string
): Promise<BskyProfile> {
  const url = `${PUBLIC_API}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
  const data = await res.json();
  const viewerData = data.viewer;
  return {
    did: data.did,
    handle: data.handle,
    displayName: data.displayName ?? data.handle,
    description: data.description ?? "",
    avatar: data.avatar ?? null,
    banner: data.banner ?? null,
    followersCount: data.followersCount ?? 0,
    followsCount: data.followsCount ?? 0,
    postsCount: data.postsCount ?? 0,
    createdAt: data.createdAt ?? null,
    indexedAt: data.indexedAt ?? null,
    viewer: viewerData
      ? {
          following: viewerData.following ?? undefined,
          followedBy: viewerData.followedBy ?? undefined,
        }
      : undefined,
  };
}

export async function fetchActorFeedByDid(
  actor: string,
  filter: "posts_with_replies" | "posts_no_replies" | "posts_with_media" | "posts_and_author_threads" = "posts_with_replies",
  limit = 50
): Promise<BskyFeedItem[]> {
  const url = `${PUBLIC_API}/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(actor)}&filter=${filter}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load feed (${res.status})`);
  const data = await res.json();
  return ((data.feed ?? []) as any[])
    .map(mapFeedView)
    .filter((x): x is BskyFeedItem => x !== null);
}

export async function fetchTimeline(
  limit = 30,
  cursor?: string
): Promise<{ posts: BskyFeedItem[]; cursor: string | null }> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");

  let path = `/xrpc/app.bsky.feed.getTimeline?limit=${limit}`;
  if (cursor) path += `&cursor=${encodeURIComponent(cursor)}`;

  const res = await authedFetch(session, path);
  if (!res.ok) throw new Error(`Failed to load timeline (${res.status})`);
  const data = await res.json();
  const posts = ((data.feed ?? []) as any[])
    .map(mapFeedView)
    .filter((x): x is BskyFeedItem => x !== null);
  return { posts, cursor: data.cursor ?? null };
}

export async function fetchAuthorFeed(
  filter:
    | "posts_with_replies"
    | "posts_no_replies"
    | "posts_with_media"
    | "posts_and_author_threads" = "posts_with_replies",
  limit = 50
): Promise<BskyFeedItem[]> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");

  const url = `${PUBLIC_API}/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(
    session.did
  )}&filter=${filter}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load feed (${res.status})`);
  const data = await res.json();
  return ((data.feed ?? []) as any[])
    .map(mapFeedView)
    .filter((x): x is BskyFeedItem => x !== null);
}

export async function updateMyProfile(updates: {
  displayName?: string;
  description?: string;
}): Promise<void> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");

  // Read the existing profile record (may not exist yet for brand-new accounts).
  const getRes = await authedFetch(
    session,
    `/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(
      session.did
    )}&collection=app.bsky.actor.profile&rkey=self`
  );

  let existingValue: Record<string, unknown> = {};
  let swapRecord: string | undefined;

  if (getRes.ok) {
    const data = await getRes.json();
    existingValue = (data.value ?? {}) as Record<string, unknown>;
    swapRecord = data.cid;
  } else if (getRes.status !== 404 && getRes.status !== 400) {
    throw new Error(`Failed to read profile record (${getRes.status})`);
  }

  const nextValue: Record<string, unknown> = {
    ...existingValue,
    $type: "app.bsky.actor.profile",
  };
  if (updates.displayName !== undefined)
    nextValue.displayName = updates.displayName;
  if (updates.description !== undefined)
    nextValue.description = updates.description;

  const body: Record<string, unknown> = {
    repo: session.did,
    collection: "app.bsky.actor.profile",
    rkey: "self",
    record: nextValue,
  };
  if (swapRecord) body.swapRecord = swapRecord;

  const putRes = await authedFetch(session, "/xrpc/com.atproto.repo.putRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const txt = await putRes.text();
    let msg = `Failed to update profile (${putRes.status})`;
    try {
      const parsed = JSON.parse(txt);
      if (parsed.message) msg = parsed.message;
    } catch {}
    throw new Error(msg);
  }
}

export async function fetchMyLikes(limit = 50): Promise<BskyFeedItem[]> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");

  const res = await authedFetch(
    session,
    `/xrpc/app.bsky.feed.getActorLikes?actor=${encodeURIComponent(
      session.did
    )}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`Failed to load likes (${res.status})`);
  const data = await res.json();
  return ((data.feed ?? []) as any[])
    .map(mapFeedView)
    .filter((x): x is BskyFeedItem => x !== null);
}

function uuidRkey(): string {
  const hex = "abcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  for (let i = 0; i < 12; i++) r += hex[Math.floor(Math.random() * hex.length)];
  return r;
}

export async function likePost(uri: string, cid: string): Promise<void> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");
  const rkey = uuidRkey();
  const record = {
    $type: "app.bsky.feed.like",
    subject: { uri, cid },
    createdAt: new Date().toISOString(),
  };
  const res = await authedFetch(session, "/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.like", rkey, record }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Like failed (${res.status}): ${txt}`);
  }
}

export async function unlikePost(likeRkey: string): Promise<void> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");
  const res = await authedFetch(session, "/xrpc/com.atproto.repo.deleteRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.like", rkey: likeRkey }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Unlike failed (${res.status}): ${txt}`);
  }
}

export async function repostPost(uri: string, cid: string): Promise<string> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");
  const rkey = uuidRkey();
  const record = {
    $type: "app.bsky.feed.repost",
    subject: { uri, cid },
    createdAt: new Date().toISOString(),
  };
  const res = await authedFetch(session, "/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.repost", rkey, record }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Repost failed (${res.status}): ${txt}`);
  }
  return rkey;
}

export async function unrepostPost(repostRkey: string): Promise<void> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");
  const res = await authedFetch(session, "/xrpc/com.atproto.repo.deleteRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.repost", rkey: repostRkey }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Unrepost failed (${res.status}): ${txt}`);
  }
}

export async function replyToPost(
  text: string,
  parentUri: string,
  parentCid: string,
  rootUri: string,
  rootCid: string,
  facets?: BskyPostFacet[]
): Promise<void> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");
  const record: Record<string, unknown> = {
    $type: "app.bsky.feed.post",
    text,
    reply: {
      parent: { uri: parentUri, cid: parentCid },
      root: { uri: rootUri, cid: rootCid },
    },
    createdAt: new Date().toISOString(),
  };
  if (facets) record.facets = facets;
  const res = await authedFetch(session, "/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.post", record }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Reply failed (${res.status}): ${txt}`);
  }
}

export async function findMyLike(
  subjectUri: string
): Promise<{ rkey: string; cid: string } | null> {
  const session = await loadSession();
  if (!session) return null;
  const res = await authedFetch(
    session,
    `/xrpc/com.atproto.repo.listRecords?repo=${encodeURIComponent(session.did)}&collection=app.bsky.feed.like&limit=100`
  );
  if (!res.ok) return null;
  const data = await res.json();
  for (const record of data.records ?? []) {
    const val = record.value ?? {};
    if (val.subject?.uri === subjectUri) {
      const rkey = record.uri?.split("/").pop();
      if (rkey) return { rkey, cid: record.cid ?? val.subject?.cid ?? "" };
    }
  }
  return null;
}

export async function findMyRepost(
  subjectUri: string
): Promise<{ rkey: string; cid: string } | null> {
  const session = await loadSession();
  if (!session) return null;
  const res = await authedFetch(
    session,
    `/xrpc/com.atproto.repo.listRecords?repo=${encodeURIComponent(session.did)}&collection=app.bsky.feed.repost&limit=100`
  );
  if (!res.ok) return null;
  const data = await res.json();
  for (const record of data.records ?? []) {
    const val = record.value ?? {};
    if (val.subject?.uri === subjectUri) {
      const rkey = record.uri?.split("/").pop();
      if (rkey) return { rkey, cid: record.cid ?? val.subject?.cid ?? "" };
    }
  }
  return null;
}

export type BskyThreadView = {
  post: BskyFeedItem;
  replies: BskyFeedItem[];
};

export async function getPostThread(
  uri: string,
  depth = 6
): Promise<BskyThreadView | null> {
  const url = `${PUBLIC_API}/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=${depth}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const thread = data.thread;
  if (!thread?.post) return null;

  const post = mapFeedView({ post: thread.post });
  if (!post) return null;

  const replies: BskyFeedItem[] = [];
  const walk = (node: any) => {
    if (!node) return;
    if (node.replies) {
      for (const r of node.replies) {
        const mapped = mapFeedView(r);
        if (mapped) replies.push(mapped);
        walk(r);
      }
    }
  };
  walk(thread);

  return { post, replies };
}

export type BskyNotification = {
  uri: string;
  cid: string;
  author: BskyPostAuthor;
  reason: "like" | "repost" | "follow" | "reply" | "quote";
  reasonSubject?: string;
  record?: BskyPostRecord;
  isRead: boolean;
  indexedAt: string;
};

export async function listNotifications(
  limit = 50
): Promise<{ notifications: BskyNotification[]; cursor: string | null }> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");
  const res = await authedFetch(
    session,
    `/xrpc/app.bsky.notification.listNotifications?limit=${limit}`
  );
  if (!res.ok) throw new Error(`Failed to load notifications (${res.status})`);
  const data = await res.json();
  const notifications: BskyNotification[] = (data.notifications ?? []).map((n: any) => ({
    uri: n.uri,
    cid: n.cid,
    author: {
      did: n.author?.did ?? "",
      handle: n.author?.handle ?? "",
      displayName: n.author?.displayName ?? n.author?.handle ?? "",
      avatar: n.author?.avatar ?? null,
    },
    reason: n.reason,
    reasonSubject: n.reasonSubject,
    record: n.record
      ? {
          text: n.record.text ?? "",
          facets: n.record.facets,
          createdAt: n.record.createdAt,
        }
      : undefined,
    isRead: n.isRead ?? false,
    indexedAt: n.indexedAt,
  }));
  return { notifications, cursor: data.cursor ?? null };
}

export type BskyFeedView = {
  uri: string;
  displayName: string;
  avatar?: string;
};

export async function getAvailableFeeds(
  actor: string
): Promise<BskyFeedView[]> {
  const url = `${PUBLIC_API}/xrpc/app.bsky.feed.getActorFeeds?actor=${encodeURIComponent(actor)}&limit=50`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.feeds ?? []).map((f: any) => ({
    uri: f.uri,
    displayName: f.displayName ?? "Untitled Feed",
    avatar: f.avatar,
  }));
}

export async function fetchCustomFeed(
  feedUri: string,
  limit = 30,
  cursor?: string
): Promise<{ posts: BskyFeedItem[]; cursor: string | null }> {
  let url = `${PUBLIC_API}/xrpc/app.bsky.feed.getFeed?feed=${encodeURIComponent(feedUri)}&limit=${limit}`;
  if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load feed (${res.status})`);
  const data = await res.json();
  const posts = ((data.feed ?? []) as any[])
    .map(mapFeedView)
    .filter((x): x is BskyFeedItem => x !== null);
  return { posts, cursor: data.cursor ?? null };
}

export async function followActor(did: string): Promise<string> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");
  const rkey = uuidRkey();
  const record = {
    $type: "app.bsky.graph.follow",
    subject: did,
    createdAt: new Date().toISOString(),
  };
  const res = await authedFetch(session, "/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo: session.did, collection: "app.bsky.graph.follow", rkey, record }),
  });
  if (!res.ok) throw new Error(`Follow failed (${res.status})`);
  return rkey;
}

export async function unfollowActor(followUri: string): Promise<void> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");
  const rkey = followUri.split("/").pop();
  if (!rkey) throw new Error("Invalid follow URI");
  const res = await authedFetch(session, "/xrpc/com.atproto.repo.deleteRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo: session.did, collection: "app.bsky.graph.follow", rkey }),
  });
  if (!res.ok) throw new Error(`Unfollow failed (${res.status})`);
}

export async function createPost(
  text: string,
  embed?: Record<string, unknown>
): Promise<void> {
  const session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");
  const record: Record<string, unknown> = {
    $type: "app.bsky.feed.post",
    text,
    createdAt: new Date().toISOString(),
  };
  if (embed) record.embed = embed;
  const res = await authedFetch(session, "/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.post", record }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Post failed (${res.status}): ${txt}`);
  }
}

export async function sharePostUrl(uri: string): Promise<string> {
  const parts = uri.replace("at://", "").split("/");
  const did = parts[0];
  const rkey = parts[2];
  if (did && rkey) {
    return `https://bsky.app/profile/${did}/post/${rkey}`;
  }
  return uri;
}
