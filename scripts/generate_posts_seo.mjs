import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://phdseo.github.io";
const PROJECT_ID = "dr-s-11bd7";
const COLLECTION = "posts";
const POSTS_DIR = path.resolve("posts");

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fromFirestoreValue(val) {
  if (!val || typeof val !== "object") return undefined;
  if ("stringValue" in val) return val.stringValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("timestampValue" in val) return val.timestampValue;
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ("mapValue" in val) {
    const out = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  return undefined;
}

async function fetchAllPosts() {
  const posts = [];
  let pageToken = "";
  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`
    );
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Firestore REST API error: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    for (const doc of data.documents || []) {
      const id = doc.name.split("/").pop();
      const fields = {};
      for (const [k, v] of Object.entries(doc.fields || {})) {
        fields[k] = fromFirestoreValue(v);
      }
      if (!fields.deleted && fields.title && fields.content) {
        posts.push({ id, ...fields });
      }
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  posts.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });
  return posts;
}

function buildDescription(content = "") {
  const singleLine = String(content).replace(/\s+/g, " ").trim();
  return singleLine.length > 155 ? singleLine.slice(0, 152) + "..." : singleLine;
}

function buildPostHtml(post) {
  const pageUrl = `${SITE_URL}/posts/${encodeURIComponent(post.id)}.html`;
  const title = post.title || "AX 게시판 글";
  const description = buildDescription(post.content);
  const publishedIso = post.createdAt || new Date().toISOString();
  const modifiedIso = post.updatedAt || publishedIso;
  const publishedDate = publishedIso.slice(0, 10);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished: publishedIso,
    dateModified: modifiedIso,
    author: {
      "@type": "Person",
      name: "Dr.S",
      url: `${SITE_URL}/`
    },
    publisher: {
      "@type": "Person",
      name: "Dr.S",
      url: `${SITE_URL}/`
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl
    },
    inLanguage: "ko-KR"
  };

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Dr.S AX 게시판</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:site_name" content="Dr.S">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:locale" content="ko_KR">
  <meta property="article:published_time" content="${escapeHtml(publishedIso)}">
  <meta property="article:modified_time" content="${escapeHtml(modifiedIso)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body {
      margin: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(180deg, #04070f 0%, #0d1117 100%);
      color: #f8fafc;
      line-height: 1.8;
      word-break: keep-all;
    }
    .container {
      width: min(820px, 92%);
      margin: 0 auto;
      padding: 3rem 0 5rem;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 2rem;
      color: #22d3ee;
      text-decoration: none;
      font-weight: 600;
    }
    .back-link:hover { text-decoration: underline; }
    article {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 2.25rem;
    }
    h1 {
      font-size: clamp(1.6rem, 3vw, 2.2rem);
      line-height: 1.3;
      margin: 0 0 0.75rem;
    }
    .meta {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-bottom: 1.75rem;
    }
    .content {
      white-space: pre-wrap;
      font-size: 1.02rem;
      color: #e2e8f0;
    }
    .cta-box {
      margin-top: 2.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .cta-box a {
      color: #ff6ec7;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <main class="container">
    <a class="back-link" href="${SITE_URL}/#board">← Dr.S AX 게시판 전체 보기</a>
    <article>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">Dr.S · ${escapeHtml(publishedDate)}</div>
      <div class="content">${escapeHtml(post.content || "")}</div>
      <div class="cta-box">
        <a href="${SITE_URL}/?post=${encodeURIComponent(post.id)}#board">원본 게시판에서 첨부파일 및 전체 보기 →</a>
      </div>
    </article>
  </main>
</body>
</html>
`;
}

function buildStaticBoardPostsHtml(posts) {
  if (!posts.length) {
    return '          <p class="board-empty" data-i18n="board_loading">게시글을 불러오는 중입니다...</p>';
  }

  return posts.map((post) => {
    const url = `/posts/${encodeURIComponent(post.id)}.html`;
    const dateStr = post.createdAt
      ? new Date(post.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
      : "";
    return `          <article class="board-post is-collapsed">
            <div class="board-post-header">
              <h3><a href="${escapeHtml(url)}" style="color: inherit; text-decoration: none;">${escapeHtml(post.title || "")}</a></h3>
              <span class="board-post-meta">Dr.S${dateStr ? ` · ${escapeHtml(dateStr)}` : ""}</span>
            </div>
            <p>${escapeHtml(buildDescription(post.content))}</p>
            <div style="margin-top: 0.5rem;"><a href="${escapeHtml(url)}" style="color: var(--accent-2); font-size: 0.9rem; font-weight: 600;">자세히 보기 →</a></div>
          </article>`;
  }).join("\n");
}

function buildFeedXml(posts) {
  const items = posts.slice(0, 50).map((post) => {
    const link = `${SITE_URL}/posts/${encodeURIComponent(post.id)}.html`;
    const pubDate = post.createdAt ? new Date(post.createdAt).toUTCString() : new Date().toUTCString();
    return `    <item>
      <title>${escapeXml(post.title || "")}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.content || "")}</description>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Dr.S AX 게시판</title>
    <link>${SITE_URL}/</link>
    <description>AI/AX 및 AX-GRC 관련 생각과 소식을 기록하는 Dr.S(서성웅) AX 게시판</description>
    <language>ko</language>
${items.join("\n")}
  </channel>
</rss>
`;
}

function updateIndexHtml(posts) {
  const indexPath = path.resolve("index.html");
  if (!fs.existsSync(indexPath)) return;

  let indexHtml = fs.readFileSync(indexPath, "utf8");
  const rssHref = `${SITE_URL}/rss.xml`;
  if (!indexHtml.includes(rssHref)) {
    const feedLinkPattern = /(\s*<link rel="alternate" type="application\/rss\+xml"[^>]*href="https:\/\/phdseo\.github\.io\/feed\.xml"[^>]*>\s*)/;
    if (!feedLinkPattern.test(indexHtml)) {
      throw new Error("Could not find the existing feed.xml alternate link in index.html");
    }
    indexHtml = indexHtml.replace(
      feedLinkPattern,
      `$1  <link rel="alternate" type="application/rss+xml" title="Dr.S AX 게시판 RSS (rss.xml)" href="${rssHref}">\n`
    );
  }

  const startMarker = "<!-- SEO_BOARD_POSTS_START -->";
  const endMarker = "<!-- SEO_BOARD_POSTS_END -->";
  if (!indexHtml.includes(startMarker) || !indexHtml.includes(endMarker)) {
    const boardPlaceholderPattern = /(<div id="board-posts" class="board-posts">\s*)(<p class="board-empty" data-i18n="board_loading">게시��을 불러오는 중입니다\.\.\.<\/p>)(\s*<\/div>)/;
    if (!boardPlaceholderPattern.test(indexHtml)) {
      throw new Error("Could not find the expected #board-posts loading placeholder in index.html");
    }
    indexHtml = indexHtml.replace(
      boardPlaceholderPattern,
      `$1${startMarker}\n          $2\n          ${endMarker}$3`
    );
  }

  const startIdx = indexHtml.indexOf(startMarker);
  const endIdx = indexHtml.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error("SEO board post markers in index.html are malformed");
  }

  const updatedIndexHtml =
    indexHtml.slice(0, startIdx + startMarker.length) +
    "\n" +
    buildStaticBoardPostsHtml(posts) +
    "\n          " +
    indexHtml.slice(endIdx);
  fs.writeFileSync(indexPath, updatedIndexHtml, "utf8");
}

function buildSitemapXml(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`
  ];

  for (const post of posts) {
    const lastmod = (post.updatedAt || post.createdAt || today).slice(0, 10);
    urls.push(`  <url>
    <loc>${SITE_URL}/posts/${encodeURIComponent(post.id)}.html</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

async function main() {
  const posts = await fetchAllPosts();
  fs.mkdirSync(POSTS_DIR, { recursive: true });

  const expectedFiles = new Set(posts.map((p) => `${p.id}.html`));
  for (const existing of fs.readdirSync(POSTS_DIR)) {
    if (existing.endsWith(".html") && !expectedFiles.has(existing)) {
      fs.unlinkSync(path.join(POSTS_DIR, existing));
    }
  }

  for (const post of posts) {
    fs.writeFileSync(path.join(POSTS_DIR, `${post.id}.html`), buildPostHtml(post), "utf8");
  }

  const rssXml = buildFeedXml(posts);
  fs.writeFileSync(path.resolve("sitemap.xml"), buildSitemapXml(posts), "utf8");
  fs.writeFileSync(path.resolve("feed.xml"), rssXml, "utf8");
  fs.writeFileSync(path.resolve("rss.xml"), rssXml, "utf8");
  updateIndexHtml(posts);

  console.log(`Generated ${posts.length} static post pages, sitemap.xml, feed.xml, rss.xml, and updated index.html.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
