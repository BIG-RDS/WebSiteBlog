/* =========================================================
   All About the World - Shared Script
   Handles: header/footer injection, data loading, rendering,
   search & filter, and contact form submission.
   ========================================================= */

// ---------------------------------------------------------
// Category registry - add a new category here to extend the
// site (e.g. news). Each category needs a data file, a color
// class name (used in style.css as .badge.<key>) and a path.
// ---------------------------------------------------------
const CATEGORIES = {
  stock: {
    label: "Stock Analysis",
    dataUrl: "data/stocks.json",
    listPath: "stock/index.html",
    postPath: "stock/post.html",
  },
  travel: {
    label: "Travel",
    dataUrl: "data/travel.json",
    listPath: "travel/index.html",
    postPath: "travel/post.html",
  },
  // news: { label: "News", dataUrl: "data/news.json", listPath: "news/index.html", postPath: "news/post.html" },
};

// Directory that script.js itself lives in (the site root), regardless of
// whether the current page included it as "script.js" or "../script.js".
// This lets us build correct links whether the site is hosted at a domain
// root (e.g. https://airsky.com/) or under a GitHub Pages project path
// (e.g. https://user.github.io/repo/).
const SCRIPT_DIR = (function resolveScriptDir() {
  const currentScript =
    document.currentScript ||
    Array.from(document.getElementsByTagName("script")).find((s) => /script\.js$/.test(s.src));
  const src = currentScript ? currentScript.src : document.baseURI;
  return src.replace(/[^/]*$/, "");
})();

function resolveUrl(path) {
  return new URL(path, SCRIPT_DIR).toString();
}

async function fetchCategoryData(categoryKey) {
  const category = CATEGORIES[categoryKey];
  if (!category) return [];
  try {
    const res = await fetch(resolveUrl(category.dataUrl));
    if (!res.ok) throw new Error(`Failed to load ${category.dataUrl}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function fetchAllPosts() {
  const keys = Object.keys(CATEGORIES);
  const results = await Promise.all(keys.map((k) => fetchCategoryData(k)));
  return keys.flatMap((k, i) => results[i].map((post) => ({ ...post, category: post.category || k })));
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Only allow http(s) URLs to be used in href/src attributes, to avoid
// javascript: or other unsafe schemes being injected from data files.
function safeUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch (err) {
    // ignore invalid URLs
  }
  return "";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function cardTemplate(post) {
  const category = CATEGORIES[post.category];
  const label = category ? category.label : post.category;
  const postUrl = category ? `${resolveUrl(category.postPath)}?slug=${encodeURIComponent(post.slug)}` : "#";
  const secondary = post.ticker ? `(${post.ticker})` : post.location || "";
  const tags = (post.tags || [])
    .map((t) => `<span class="tag">#${escapeHtml(t)}</span>`)
    .join("");

  return `
    <article class="card" data-title="${escapeHtml((post.title || "").toLowerCase())}" data-tags="${escapeHtml((post.tags || []).join(",").toLowerCase())}">
      <a href="${escapeHtml(postUrl)}">
        <img src="${escapeHtml(safeUrl(post.image))}" alt="${escapeHtml(post.title || "")}" loading="lazy" />
      </a>
      <div class="card-body">
        <span class="badge ${escapeHtml(post.category)}">${escapeHtml(label)}</span>
        <h3><a href="${escapeHtml(postUrl)}">${escapeHtml(post.title)}</a> ${secondary ? `<small>${escapeHtml(secondary)}</small>` : ""}</h3>
        <p class="summary">${escapeHtml(post.summary || "")}</p>
        <div class="tags">${tags}</div>
        <div class="card-meta">
          <span>${escapeHtml(formatDate(post.date))}</span>
          <a class="card-link" href="${escapeHtml(postUrl)}">Read More →</a>
        </div>
      </div>
    </article>
  `;
}

function renderCards(container, posts) {
  if (!container) return;
  if (!posts.length) {
    container.innerHTML = '<p class="empty-state">No posts to display.</p>';
    return;
  }
  container.innerHTML = posts.map(cardTemplate).join("");
}

function sortByDateDesc(posts) {
  return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ---------------------------------------------------------
// Search & Filter (used on home page and category list pages)
// ---------------------------------------------------------
function setupSearchAndFilter({ searchInputId, filterBarId, cardGridId, getAllPosts }) {
  const searchInput = document.getElementById(searchInputId);
  const filterBar = document.getElementById(filterBarId);
  const cardGrid = document.getElementById(cardGridId);
  let allPosts = [];
  let activeFilter = "all";

  function applyFilters() {
    const query = (searchInput && searchInput.value.trim().toLowerCase()) || "";
    let filtered = allPosts;
    if (activeFilter !== "all") {
      filtered = filtered.filter((p) => p.category === activeFilter);
    }
    if (query) {
      filtered = filtered.filter((p) => {
        const haystack = [p.title, p.summary, ...(p.tags || [])].join(" ").toLowerCase();
        return haystack.includes(query);
      });
    }
    renderCards(cardGrid, sortByDateDesc(filtered));
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  if (filterBar) {
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      activeFilter = btn.dataset.filter;
      filterBar.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    });
  }

  getAllPosts().then((posts) => {
    allPosts = posts;
    applyFilters();
  });
}

// ---------------------------------------------------------
// Post detail page rendering
// ---------------------------------------------------------
async function renderPostDetail(categoryKey, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const posts = await fetchCategoryData(categoryKey);
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    container.innerHTML = '<p class="empty-state">The requested post could not be found.</p>';
    return;
  }

  document.title = `${escapeHtml(post.title)} | All About the World`;
  const category = CATEGORIES[categoryKey];
  const secondary = post.ticker ? `Ticker ${post.ticker}` : post.location || "";
  const body = (post.content || []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  const tags = (post.tags || []).map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join("");
  const link = safeUrl(post.link);

  container.innerHTML = `
    <img class="cover" src="${escapeHtml(safeUrl(post.image))}" alt="${escapeHtml(post.title)}" />
    <span class="badge ${escapeHtml(categoryKey)}">${escapeHtml(category ? category.label : categoryKey)}</span>
    <h1>${escapeHtml(post.title)}</h1>
    <div class="post-meta">${secondary ? `${escapeHtml(secondary)} · ` : ""}${escapeHtml(formatDate(post.date))}</div>
    <div class="tags">${tags}</div>
    <div class="post-body">${body}</div>
    ${link ? `<a class="external-link" href="${escapeHtml(link)}" target="_blank" rel="noopener">Open Related Link</a>` : ""}
  `;
}

// ---------------------------------------------------------
// Mobile navigation toggle (optional, header contains nav)
// ---------------------------------------------------------
function setupNavToggle(toggleId, navId) {
  const toggle = document.getElementById(toggleId);
  const nav = document.getElementById(navId);
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}
