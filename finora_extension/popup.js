// popup.js — Finora Extension v2
// Tabs: Analyse | News | Echo | Portfolio | Deep Dive

const DEFAULTS = {
  apiUrl:    "http://localhost:8000",
  webappUrl: "http://localhost:3000",
};

let apiUrl    = DEFAULTS.apiUrl;
let webappUrl = DEFAULTS.webappUrl;
let appConfig = { sectors: [], tracked_assets: [], ...DEFAULTS };
let lastResult = null;  // shared across Echo + Portfolio tabs

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await fetchConfig();
  setupTabs();
  setupAnalysePanel();
  setupPortfolioPanel();
  setupDeepDivePanel();
  setupNewsPanel();
  checkBackendStatus();
  silentScrapeActiveTab();   // auto-fill textarea silently on popup open
});

// ── Settings ──────────────────────────────────────────────────────────────────

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiUrl", "webappUrl", "portfolio", "selectedSectors"], (data) => {
      if (data.apiUrl)    apiUrl    = data.apiUrl.trim().replace(/\/$/, "");
      if (data.webappUrl) webappUrl = data.webappUrl.trim().replace(/\/$/, "");
      resolve();
    });
  });
}

async function fetchConfig() {
  try {
    const res = await fetch(`${apiUrl}/api/config`);
    if (res.ok) {
      const data = await res.json();
      appConfig = { ...appConfig, ...data };
    }
  } catch (_) { /* keep defaults when backend is down */ }
  renderSectorPills();
}

// ── Backend status ────────────────────────────────────────────────────────────

async function checkBackendStatus() {
  const badge = document.getElementById("statusBadge");
  const txt   = document.getElementById("statusText");
  try {
    const res = await fetch(`${apiUrl}/api/health`);
    const ok  = res.ok && (await res.json()).status === "ok";
    if (badge) badge.className = `status-badge ${ok ? "online" : "offline"}`;
    if (txt)   txt.textContent  = ok ? "Connected" : "Offline";
  } catch (_) {
    if (badge) badge.className = "status-badge offline";
    if (txt)   txt.textContent  = "Offline";
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function setupTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.getElementById("tab-" + tab.dataset.tab);
      if (panel) panel.classList.add("active");
      if (tab.dataset.tab === "echo")      renderEchoPanel();
      if (tab.dataset.tab === "portfolio") loadPortfolioUI();
      if (tab.dataset.tab === "news")      loadNewsFeed();
    });
  });
}

// ── Silent auto-scrape ────────────────────────────────────────────────────────
// Runs on popup open. Pre-fills textarea without any button click.

async function silentScrapeActiveTab() {
  const input = document.getElementById("headlineInput");
  if (!input || input.value.trim()) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    let text = null;

    // Try content script first (better headline selection)
    try {
      const resp = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { type: "GET_HEADLINES" }),
        new Promise((_, rej) => setTimeout(() => rej(), 800)),
      ]);
      if (resp?.headlines?.length) {
        text = resp.headlines.slice(0, 3).join(" | ");
      }
    } catch (_) { /* content script not ready yet */ }

    // Fallback: grab h1/h2 or title via executeScript
    if (!text) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const h1 = document.querySelector("article h1, h1")?.innerText?.trim();
          const h2 = document.querySelector("article h2, h2")?.innerText?.trim();
          return (h1 || h2 || document.title || "").replace(/\s+/g, " ").substring(0, 300);
        },
      });
      text = results?.[0]?.result || "";
    }

    if (text && text.length > 15) {
      input.value = text;
      // Brief teal flash to indicate auto-fill
      input.style.borderColor = "var(--accent)";
      setTimeout(() => (input.style.borderColor = ""), 1400);
    }
  } catch (_) {
    // chrome:// pages and extension pages can't be scripted — ignore silently
  }
}

// Manual scrape button (globe icon next to textarea)
async function manualScrape() {
  const btn   = document.getElementById("scrapeBtn");
  const input = document.getElementById("headlineInput");
  if (!btn || !input) return;

  const origContent = btn.innerHTML;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
  btn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    let text = null;

    try {
      const resp = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { type: "GET_HEADLINES" }),
        new Promise((_, rej) => setTimeout(() => rej(), 1000)),
      ]);
      if (resp?.headlines?.length) {
        text = resp.headlines.slice(0, 3).join(" | ");
      }
    } catch (_) {}

    if (!text) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const h1 = document.querySelector("article h1, h1")?.innerText?.trim();
          const h2 = document.querySelector("article h2, h2")?.innerText?.trim();
          return (h1 || h2 || document.title || "").replace(/\s+/g, " ").substring(0, 300);
        },
      });
      text = results?.[0]?.result || "";
    }

    input.value = text && text.length > 15 ? text : "No headline found on this page.";
    input.focus();
  } catch (_) {
    input.value = "Scraping not available on this page.";
  } finally {
    btn.innerHTML  = origContent;
    btn.disabled   = false;
  }
}

// ── Analyse Panel ─────────────────────────────────────────────────────────────

function setupAnalysePanel() {
  document.getElementById("analyseBtn").addEventListener("click", runAnalysis);
  document.getElementById("scrapeBtn").addEventListener("click", manualScrape);
}

async function runAnalysis() {
  const text = document.getElementById("headlineInput").value.trim();
  if (!text) return;

  const btn     = document.getElementById("analyseBtn");
  const spinner = document.getElementById("spinner");
  const errMsg  = document.getElementById("errMsg");
  const card    = document.getElementById("resultCard");

  card.classList.remove("show");
  errMsg.classList.remove("show");
  spinner.style.display = "block";
  btn.disabled = true;

  const savedSectors = await getSavedSectors();
  const persona = savedSectors.length ? { sectors: savedSectors } : null;

  try {
    const res = await fetch(`${apiUrl}/api/analyze_event`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        event:   { text, deep_analysis: true },
        persona,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    lastResult = await res.json();
    renderAnalyseResults(lastResult);
    card.classList.add("show");

    const signal = lastResult.signal_score || 0.5;
    chrome.runtime.sendMessage({
      type:        "ANALYSIS_DONE",
      impactLevel: signal > 0.65 || signal < 0.35 ? "high" : "medium",
    });

  } catch (err) {
    errMsg.textContent = "Error: " + (err.message || "Unknown error");
    errMsg.classList.add("show");
  } finally {
    spinner.style.display = "none";
    btn.disabled = false;
  }
}

function renderAnalyseResults(data) {
  // Sentiment
  const sentLabel = (data.sentiment?.label || "neutral").toLowerCase();
  document.getElementById("r-sent").innerHTML =
    `<span class="pill pill-${sentLabel}">${sentLabel.toUpperCase()}</span>`;

  // Sector & event type
  document.getElementById("r-sector").textContent =
    (data.classification?.primary_sector || "—").toUpperCase();
  document.getElementById("r-etype").textContent =
    data.classification?.event_type || "—";

  // Confidence
  const conf = data.classification?.confidence;
  document.getElementById("r-conf").textContent =
    conf != null ? `${(conf * 100).toFixed(1)}%` : "—";

  // Signal bar  (score is 0–1)
  const score = Math.max(0, Math.min(1, data.signal_score || 0.5));
  document.getElementById("r-sig-text").textContent = `${Math.round(score * 100)} / 100`;
  document.getElementById("r-sig-fill").style.transform = `scaleX(${score})`;

  // Sector mini-bars
  const scores = data.classification?.all_sector_scores || {};
  const top6   = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxS   = Math.max(...top6.map((e) => e[1]), 0.01);
  document.getElementById("r-sector-bars").innerHTML = top6.map(([name, s]) => `
    <div class="sbar-row">
      <span class="sbar-name">${esc(name)}</span>
      <div class="sbar-track">
        <div class="sbar-fill" style="transform:scaleX(${(s / maxS).toFixed(3)})"></div>
      </div>
      <span class="sbar-score">${(s * 100).toFixed(0)}%</span>
    </div>`).join("");

  // Historical asset chart
  const avgImpacts = data.history_echo?.avg_asset_impacts || {};
  const chartBlock = document.getElementById("r-chart-block");
  if (Object.keys(avgImpacts).length > 0) {
    chartBlock.style.display = "block";
    document.getElementById("r-asset-chart").innerHTML = buildDivergingChart(avgImpacts);
  } else {
    chartBlock.style.display = "none";
  }

  // Domino chain
  const chain = data.domino_chain?.chain || [];
  document.getElementById("r-domino").innerHTML = chain.length
    ? chain.map((n) => `
        <div class="dnode">
          <div class="dnode-top">
            <span class="dnode-sector">${esc(n.sector.toUpperCase())}</span>
            <span class="pill pill-${n.direction === 'up' ? 'up' : n.direction === 'down' ? 'down' : 'flat'}"
              style="font-size:8.5px">${n.direction.toUpperCase()}</span>
            <span class="pill pill-${n.magnitude === 'high' ? 'negative' : n.magnitude === 'medium' ? 'warn' : 'neutral'}"
              style="font-size:8px">${n.magnitude}</span>
          </div>
          <div class="dnode-reason">${esc(n.reason)}</div>
        </div>`).join("")
    : `<div style="color:var(--text-m);font-size:11px">Enable deep_analysis=true for Gemini domino chain.</div>`;

  // Persona summary
  const personaBlock = document.getElementById("r-persona-block");
  if (data.persona_summary) {
    personaBlock.style.display = "block";
    document.getElementById("r-persona").textContent = data.persona_summary;
  } else {
    personaBlock.style.display = "none";
  }
}

// ── News Panel ────────────────────────────────────────────────────────────────

function setupNewsPanel() {
  document.getElementById("refreshNewsBtn")?.addEventListener("click", loadNewsFeed);
}

async function loadNewsFeed() {
  const list    = document.getElementById("newsList");
  const spinner = document.getElementById("newsSpinner");
  if (!list) return;

  if (spinner) spinner.style.display = "block";
  list.innerHTML = "";

  const count = Math.min(50, Math.max(1, appConfig.news_default_count || 15));
  try {
    const res = await fetch(`${apiUrl}/api/news?count=${count}`);
    if (!res.ok) throw new Error("API error");
    const items = await res.json();

    if (!items.length) {
      list.innerHTML = `<div class="empty"><div class="empty-icon">📭</div>No news available.</div>`;
      return;
    }

    list.innerHTML = items.map((n) => `
      <div class="ecard" onclick="fillHeadline(${JSON.stringify(esc(n.title))})">
        <div class="ecard-date">${esc(n.source)}
          <span style="margin-left:6px;color:var(--text-m)">${esc(formatAge(n.timestamp))}</span>
        </div>
        <div class="ecard-text">${esc(n.title)}</div>
        ${n.summary ? `<div style="font-size:10.5px;color:var(--text-m);line-height:1.4">${esc(n.summary.substring(0, 100))}…</div>` : ""}
      </div>`).join("");
  } catch (_) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div>Could not load news. Is the backend running?</div>`;
  }
}

// Clicking a news card copies its title to the Analyse textarea
function fillHeadline(title) {
  const input = document.getElementById("headlineInput");
  if (input) {
    input.value = title;
    // Switch to Analyse tab
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    document.querySelector('[data-tab="analyse"]').classList.add("active");
    document.getElementById("tab-analyse").classList.add("active");
    input.focus();
  }
}

function formatAge(iso) {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch (_) { return ""; }
}

// ── Echo Panel ────────────────────────────────────────────────────────────────

function renderEchoPanel() {
  const list  = document.getElementById("echoList");
  const badge = document.getElementById("echoBadge");

  if (!lastResult?.history_echo) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div>Run an analysis first to see similar historical events.</div>`;
    if (badge) badge.textContent = "";
    return;
  }

  const echo = lastResult.history_echo;
  if (badge) badge.textContent = echo.echo_summary || "";

  if (!echo.parallels?.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📭</div>No historical parallels found for this event.</div>`;
    return;
  }

  list.innerHTML = echo.parallels.map((p) => {
    const tags = Object.entries(p.price_changes || {})
      .slice(0, 5)
      .map(([asset, pct]) => {
        const cls  = pct >= 0 ? "p" : "n";
        const sign = pct >= 0 ? "+" : "";
        return `<span class="etag ${cls}">${esc(asset)} ${sign}${pct.toFixed(1)}%</span>`;
      }).join("");

    const gainLine = p.portfolio_gain_inr != null
      ? `<div style="font-size:9px;font-family:var(--mono);margin-top:3px;color:${p.portfolio_gain_inr >= 0 ? 'var(--pos)' : 'var(--neg)'}">
           Portfolio est: ${p.portfolio_gain_inr >= 0 ? '+' : ''}₹${Math.abs(p.portfolio_gain_inr).toLocaleString('en-IN')}
         </div>`
      : "";

    return `
      <div class="ecard">
        <div class="ecard-date">${esc(p.event_date)} · <span style="color:var(--text-2)">${esc(p.sector.toUpperCase())}</span></div>
        <div class="ecard-text">${esc(p.event_summary)}</div>
        <div class="ecard-tags">${tags}</div>
        ${gainLine}
        <div class="ecard-sim">Similarity: ${(p.similarity_score * 100).toFixed(0)}%</div>
      </div>`;
  }).join("");
}

// ── Portfolio Panel ───────────────────────────────────────────────────────────

async function getSavedSectors() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["selectedSectors"], (d) => {
      resolve(Array.isArray(d.selectedSectors) ? d.selectedSectors : []);
    });
  });
}

function renderSectorPills() {
  const grid = document.getElementById("sectorGrid");
  if (!grid) return;
  const sectors = appConfig.sectors?.length
    ? appConfig.sectors
    : ["defence","banking","it","pharma","energy","auto","infra","fmcg","metals","realestate"];

  chrome.storage.local.get(["selectedSectors"], (data) => {
    const saved = new Set(Array.isArray(data.selectedSectors) ? data.selectedSectors : []);
    grid.innerHTML = sectors.map((s) =>
      `<div class="spill ${saved.has(s) ? 'sel' : ''}" data-sector="${esc(s)}">${esc(s.toUpperCase())}</div>`
    ).join("");
    grid.querySelectorAll(".spill").forEach((pill) => {
      pill.addEventListener("click", () => {
        pill.classList.toggle("sel");
        saveSelectedSectors();
      });
    });
  });
}

function saveSelectedSectors() {
  const sel = [...document.querySelectorAll(".spill.sel")].map((p) => p.dataset.sector);
  chrome.storage.local.set({ selectedSectors: sel });
}

function loadPortfolioUI() {
  renderSectorPills();
  chrome.storage.local.get(["portfolio"], (data) => {
    const list  = document.getElementById("holdingsList");
    if (!list) return;
    list.innerHTML = "";
    const saved = Array.isArray(data.portfolio) ? data.portfolio : [];
    if (!saved.length) addHoldingRow();
    else saved.forEach((h) => addHoldingRow(h.ticker, h.qty));
  });
}

function addHoldingRow(ticker = "", qty = "") {
  const list = document.getElementById("holdingsList");
  if (!list) return;
  const row = document.createElement("div");
  row.className = "holding-row";
  row.innerHTML = `
    <input type="text"   placeholder="TICKER.NS" value="${esc(ticker)}" />
    <input type="number" placeholder="Qty"        value="${esc(qty)}"   min="1" />
    <button class="btn-rm" type="button">×</button>`;
  row.querySelector(".btn-rm").addEventListener("click", () => row.remove());
  list.appendChild(row);
}

function setupPortfolioPanel() {
  document.getElementById("addHoldingBtn")?.addEventListener("click", () => addHoldingRow());
  document.getElementById("savePortfolioBtn")?.addEventListener("click", saveAndSimulate);
}

async function saveAndSimulate() {
  // Collect & persist holdings
  const rows      = document.querySelectorAll(".holding-row");
  const portfolio = [];
  rows.forEach((row) => {
    const inputs = row.querySelectorAll("input");
    const ticker = (inputs[0]?.value || "").trim().toUpperCase();
    const qty    = (inputs[1]?.value || "").trim();
    if (ticker) portfolio.push({ ticker, qty });
  });

  saveSelectedSectors();
  chrome.storage.local.set({ portfolio });

  // Validate
  const text = document.getElementById("headlineInput").value.trim();
  const resultDiv = document.getElementById("portfolioResult");
  const spinner   = document.getElementById("portSpinner");

  if (!text) {
    resultDiv.innerHTML = `<div style="color:var(--text-m);font-size:11px;margin-top:10px">
      Go to Analyse tab and enter or scrape a headline first.</div>`;
    return;
  }

  const sectors = [...document.querySelectorAll(".spill.sel")].map((p) => p.dataset.sector);
  if (!sectors.length) {
    resultDiv.innerHTML = `<div style="color:var(--warn);font-size:11px;margin-top:10px">
      Select at least one sector above.</div>`;
    return;
  }

  resultDiv.innerHTML = "";
  if (spinner) spinner.style.display = "block";

  try {
    const res = await fetch(`${apiUrl}/api/portfolio_impact`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        news_text: text,
        persona: {
          sectors,
          holdings: portfolio.map((p) => ({
            ticker:        p.ticker,
            quantity:      parseInt(p.qty) || 1,
            avg_buy_price: 100,
          })),
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    const data = await res.json();
    renderPortfolioResult(data, resultDiv);

  } catch (err) {
    resultDiv.innerHTML = `<div style="color:var(--neg);font-size:11px;margin-top:10px">Error: ${esc(err.message)}</div>`;
  } finally {
    if (spinner) spinner.style.display = "none";
  }
}

function renderPortfolioResult(data, container) {
  const signal    = Math.max(0, Math.min(1, data.overall_signal || 0.5));
  const signalPct = Math.round(signal * 100);
  const signalCls = signal > 0.6 ? "positive" : signal < 0.4 ? "negative" : "neutral";
  const sector    = (data.primary_sector_affected || "—").toUpperCase();
  const impact    = data.estimated_portfolio_impact || "—";
  const advisory  = data.ai_advisory || "";

  // Asset impact chart from portfolio_impact endpoint
  const assetImpacts = data.asset_impacts || {};
  const chartHtml = Object.keys(assetImpacts).length
    ? `<div style="margin-top:12px">
         <div class="chart-hdr">Asset Impact (Historical Avg)</div>
         ${buildDivergingChart(assetImpacts)}
       </div>`
    : "";

  container.innerHTML = `
    <div class="pcard">
      <div class="pcard-row">
        <span class="pcard-sector">${esc(sector)}</span>
        <span class="pill pill-${signalCls}">Signal ${signalPct}%</span>
      </div>
      <div class="pcard-impact">${esc(impact)}</div>
      <div class="sig-track" style="margin-bottom:10px">
        <div class="sig-fill" style="transform:scaleX(${signal})"></div>
      </div>
      <div class="pcard-advisory">${esc(advisory)}</div>
      ${chartHtml}
    </div>`;
}

// ── Deep Dive Panel ───────────────────────────────────────────────────────────

function setupDeepDivePanel() {
  const btn   = document.getElementById("openWebappBtn");
  const label = document.getElementById("webappUrlLabel");

  chrome.storage.local.get(["webappUrl"], (data) => {
    if (data.webappUrl) webappUrl = data.webappUrl.trim().replace(/\/$/, "");
    if (label) label.textContent = webappUrl;
  });

  if (btn) {
    btn.addEventListener("click", () => {
      // Pass the current headline as a query param so the webapp can pre-load it
      const text = document.getElementById("headlineInput")?.value?.trim();
      const url  = text
        ? `${webappUrl}?q=${encodeURIComponent(text)}`
        : webappUrl;
      chrome.tabs.create({ url });
    });
  }
}

// ── Diverging Bar Chart ───────────────────────────────────────────────────────

const ASSET_ORDER = ["Nifty 50","Bank Nifty","Nifty IT","Gold INR","Crude Oil","USD INR","Crypto","Bonds"];

function buildDivergingChart(impacts) {
  // Normalise keys: "Nifty_50" → "Nifty 50" so they match ASSET_ORDER
  const normalised = {};
  for (const [k, v] of Object.entries(impacts)) {
    normalised[k.replace(/_/g, " ")] = v;
  }

  const entries = ASSET_ORDER
    .filter((a) => a in normalised)
    .map((a) => [a, normalised[a]]);

  // Include any extras not in ASSET_ORDER
  for (const [k, v] of Object.entries(normalised)) {
    if (!ASSET_ORDER.includes(k)) entries.push([k, v]);
  }

  if (!entries.length) return "";

  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)), 0.1);

  return entries.map(([asset, pct]) => {
    const barW   = Math.min((Math.abs(pct) / maxAbs) * 100, 100).toFixed(1);
    const isPos  = pct >= 0;
    const sign   = isPos ? "+" : "";
    const cls    = isPos ? "p" : "n";
    return `
      <div class="chart-row">
        <span class="chart-name">${esc(asset)}</span>
        <div class="bar-area">
          <div class="bar-neg">
            ${!isPos ? `<div class="fill-neg" style="width:${barW}%"></div>` : ""}
          </div>
          <div class="bar-center"></div>
          <div class="bar-pos">
            ${isPos ? `<div class="fill-pos" style="width:${barW}%"></div>` : ""}
          </div>
        </div>
        <span class="chart-pct ${cls}">${sign}${pct.toFixed(1)}%</span>
      </div>`;
  }).join("");
}

// ── Util ──────────────────────────────────────────────────────────────────────

function esc(s) {
  if (s == null) return "";
  const d = document.createElement("div");
  d.textContent = String(s);
  return d.innerHTML;
}