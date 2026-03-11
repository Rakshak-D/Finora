// popup.js — Finora Extension v2
// 4 tabs: Analyse | Echo | Portfolio | Deep Dive
// Silent auto-scrape on open; user clicks Run Analysis manually.

const DEFAULTS = {
  apiUrl: "http://localhost:8000",
  webappUrl: "http://localhost:3000",
};

let apiUrl = DEFAULTS.apiUrl;
let webappUrl = DEFAULTS.webappUrl;
let appConfig = { sectors: [], tracked_assets: [] };
let lastResult = null;

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await fetchConfig();
  setupTabs();
  setupAnalysePanel();
  setupNewsPanel();
  setupPortfolioPanel();
  setupDeepPanel();
  checkBackendStatus();
  silentScrapeActiveTab();
});

// ── Settings ──────────────────────────────────────────────────────────────────

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiUrl", "webappUrl", "portfolio", "selectedSectors"], (d) => {
      if (d.apiUrl) apiUrl = d.apiUrl.trim().replace(/\/$/, "");
      if (d.webappUrl) webappUrl = d.webappUrl.trim().replace(/\/$/, "");
      resolve();
    });
  });
}

async function fetchConfig() {
  try {
    const res = await fetch(`${apiUrl}/api/config`);
    if (res.ok) appConfig = { ...appConfig, ...(await res.json()) };
  } catch (_) { }
  renderSectorPills();
}

// ── Backend status ────────────────────────────────────────────────────────────

async function checkBackendStatus() {
  const badge = document.getElementById("statusBadge");
  const txt = document.getElementById("statusText");
  try {
    const res = await fetch(`${apiUrl}/api/health`);
    const ok = res.ok && (await res.json()).status === "ok";
    badge.className = `status-badge ${ok ? "online" : "offline"}`;
    txt.textContent = ok ? "Connected" : "Offline";
  } catch (_) {
    badge.className = "status-badge offline";
    txt.textContent = "Offline";
  }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function setupTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tab-" + tab.dataset.tab)?.classList.add("active");
      if (tab.dataset.tab === "echo") renderEchoPanel();
      if (tab.dataset.tab === "news") loadNewsPanel();
      if (tab.dataset.tab === "portfolio") loadPortfolioUI();
    });
  });
}

// ── Silent auto-scrape ────────────────────────────────────────────────────────
// Runs on popup open — grabs headline from active page, pre-fills textarea.

async function silentScrapeActiveTab() {
  const input = document.getElementById("headlineInput");
  if (!input || input.value.trim()) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    let text = "";

    // Attempt 1: content script (richer selector extraction)
    try {
      const resp = await Promise.race([
        chrome.tabs.sendMessage(tab.id, { type: "GET_HEADLINES" }),
        new Promise((_, rej) => setTimeout(() => rej(), 800)),
      ]);
      if (resp?.headlines?.length) text = resp.headlines.slice(0, 3).join(" | ");
    } catch (_) { }

    // Attempt 2: executeScript fallback
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

    if (text.length > 15) {
      input.value = text;
      // Brief teal border flash to signal auto-fill
      input.style.borderColor = "var(--accent)";
      setTimeout(() => (input.style.borderColor = ""), 1400);
    }
  } catch (_) { }
}

// ── Analyse panel ─────────────────────────────────────────────────────────────

function setupAnalysePanel() {
  document.getElementById("analyseBtn").addEventListener("click", runAnalysis);
}

// Add after setupAnalysePanel()
document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const btn = document.getElementById('scrapeBtn');
  btn.disabled = true;
  btn.innerHTML = '...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const title = document.querySelector('h1')?.innerText || document.title;
        const article = document.querySelector('article')?.innerText || '';
        return (title + ' ' + article).substring(0, 500);
      }
    });
    const text = results?.[0]?.result || '';
    if (text) document.getElementById('headlineInput').value = text;
  } catch (e) { console.error(e); }

  btn.disabled = false;
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/></svg>';
});

async function runAnalysis() {
  const text = document.getElementById("headlineInput").value.trim();
  if (!text) return;

  const btn = document.getElementById("analyseBtn");
  const spinner = document.getElementById("spinner");
  const errMsg = document.getElementById("errMsg");
  const card = document.getElementById("resultCard");

  card.classList.remove("show");
  errMsg.classList.remove("show");
  spinner.style.display = "block";
  btn.disabled = true;

  const savedSectors = await getSavedSectors();
  const persona = savedSectors.length ? { sectors: savedSectors } : null;

  try {
    const res = await fetch(`${apiUrl}/api/analyze_event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: { text, deep_analysis: true }, persona }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail || `HTTP ${res.status}`);
    }

    lastResult = await res.json();
    renderAnalyseResults(lastResult);
    card.classList.add("show");

    const sig = lastResult.signal_score || 0.5;
    chrome.runtime.sendMessage({
      type: "ANALYSIS_DONE",
      impactLevel: (sig > 0.65 || sig < 0.35) ? "high" : "medium",
    });

  } catch (err) {
    errMsg.textContent = "Error: " + (err.message || "Unknown");
    errMsg.classList.add("show");
  } finally {
    spinner.style.display = "none";
    btn.disabled = false;
  }
}

function renderAnalyseResults(data) {
  // Sentiment
  const sent = (data.sentiment?.label || "neutral").toLowerCase();
  document.getElementById("r-sent").innerHTML =
    `<span class="pill pill-${sent}">${sent.toUpperCase()}</span>`;

  document.getElementById("r-sector").textContent =
    (data.classification?.primary_sector || "—").toUpperCase();

  document.getElementById("r-etype").textContent =
    data.classification?.event_type || "—";

  const conf = data.classification?.confidence;
  document.getElementById("r-conf").textContent =
    conf != null ? `${(conf * 100).toFixed(1)}%` : "—";

  // Signal bar (0-1 score → displayed as /100)
  const score = Math.max(0, Math.min(1, data.signal_score ?? 0.5));
  document.getElementById("r-sig-text").textContent = `${Math.round(score * 100)} / 100`;
  document.getElementById("r-sig-fill").style.transform = `scaleX(${score})`;

  // Sector mini-bars
  const scores = data.classification?.all_sector_scores || {};
  const top6 = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxS = Math.max(...top6.map((e) => e[1]), 0.01);
  document.getElementById("r-sector-bars").innerHTML = top6.map(([k, v]) => `
    <div class="sbar-row">
      <span class="sbar-name">${esc(k)}</span>
      <div class="sbar-track"><div class="sbar-fill" style="transform:scaleX(${(v / maxS).toFixed(3)})"></div></div>
      <span class="sbar-score">${(v * 100).toFixed(0)}%</span>
    </div>`).join("");

  // Historical asset chart
  const impacts = data.history_echo?.avg_asset_impacts || {};
  const chartBlock = document.getElementById("r-chart-block");
  if (Object.keys(impacts).length) {
    chartBlock.style.display = "block";
    document.getElementById("r-asset-chart").innerHTML = buildDivChart(impacts);
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
            <span class="pill pill-${n.direction === 'up' ? 'positive' : n.direction === 'down' ? 'negative' : 'neutral'}" style="font-size:8.5px">
              ${n.direction === 'up' ? '↑' : n.direction === 'down' ? '↓' : '→'} ${n.direction.toUpperCase()}
            </span>
            <span class="pill pill-warn" style="font-size:8px;margin-left:2px">${esc(n.magnitude)}</span>
          </div>
          <div class="dnode-reason">${esc(n.reason)}</div>
        </div>`).join("")
    : `<div style="color:var(--text-m);font-size:11px">No domino chain available.</div>`;

  // Persona summary
  const pb = document.getElementById("r-persona-block");
  if (data.persona_summary) {
    pb.style.display = "block";
    document.getElementById("r-persona").textContent = data.persona_summary;
  } else {
    pb.style.display = "none";
  }
}

// ── Echo panel ────────────────────────────────────────────────────────────────

function renderEchoPanel() {
  const list = document.getElementById("echoList");
  const badge = document.getElementById("echoBadge");

  if (!lastResult?.history_echo) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div>Run an analysis first to see similar historical events.</div>`;
    badge.textContent = "";
    return;
  }

  const echo = lastResult.history_echo;
  badge.textContent = echo.echo_summary || "";

  if (!echo.parallels?.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📭</div>No historical parallels found for this event.</div>`;
    return;
  }

  list.innerHTML = echo.parallels.map((p) => {
    const tags = Object.entries(p.price_changes || {})
      .slice(0, 5)
      .map(([asset, pct]) => {
        const isP = pct >= 0;
        return `<span class="etag ${isP ? 'p' : 'n'}">${esc(asset)} ${isP ? '+' : ''}${pct.toFixed(1)}%</span>`;
      }).join("");

    return `
      <div class="ecard">
        <div class="ecard-date">${esc(p.event_date)} · ${esc(p.sector.toUpperCase())}</div>
        <div class="ecard-text">${esc(p.event_summary)}</div>
        <div class="ecard-tags">${tags}</div>
        <div class="ecard-sim">Similarity ${(p.similarity_score * 100).toFixed(0)}%</div>
      </div>`;
  }).join("");
}

// ── News panel ────────────────────────────────────────────────────────────────

let newsLoaded = false;
function setupNewsPanel() {
  document.getElementById("refreshNewsBtn").addEventListener("click", () => {
    newsLoaded = false;
    loadNewsPanel();
  });
}

async function loadNewsPanel() {
  if (newsLoaded) return;
  const list = document.getElementById("newsList");
  list.innerHTML = `<div class="spinner" style="display:block;margin-top:20px;"></div>`;

  try {
    const res = await fetch(`${apiUrl}/api/news`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data || !data.length) {
      list.innerHTML = `<div class="empty"><div class="empty-icon">📭</div>No fresh news available at the moment.</div>`;
      return;
    }

    list.innerHTML = data.map(item => `
      <div class="ecard" style="border-left-color:var(--accent);cursor:pointer;" onclick="document.getElementById('headlineInput').value = this.dataset.title; document.querySelector('.tab[data-tab=\\'analyse\\']').click();" data-title="${esc(item.title)}">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <div class="ecard-date">${esc(item.source.toUpperCase())}</div>
          <div style="font-size:8.5px;color:var(--text-m);font-family:var(--mono);">${esc(item.timestamp)}</div>
        </div>
        <div class="ecard-text" style="font-weight:600;margin-bottom:6px;">${esc(item.title)}</div>
        <div class="ecard-text" style="color:var(--text-2);font-size:10.5px;">${esc(item.summary)}</div>
        <div style="font-size:9px;color:var(--accent-dim);margin-top:6px;">→ Click to Analyze</div>
      </div>
    `).join("");

    newsLoaded = true;
  } catch (err) {
    list.innerHTML = `<div class="err show">Error fetching news: ${esc(err.message)}</div>`;
  }
}

// ── Portfolio panel ───────────────────────────────────────────────────────────

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
    : ["defence", "banking", "it", "pharma", "energy", "auto", "infra", "fmcg", "metals", "realestate"];

  chrome.storage.local.get(["selectedSectors"], (d) => {
    const saved = new Set(Array.isArray(d.selectedSectors) ? d.selectedSectors : []);
    grid.innerHTML = sectors.map((s) =>
      `<div class="spill${saved.has(s) ? ' sel' : ''}" data-sector="${esc(s)}">${esc(s.toUpperCase())}</div>`
    ).join("");
    grid.querySelectorAll(".spill").forEach((pill) => {
      pill.addEventListener("click", () => {
        pill.classList.toggle("sel");
        chrome.storage.local.set({
          selectedSectors: [...document.querySelectorAll(".spill.sel")].map((p) => p.dataset.sector)
        });
      });
    });
  });
}

function loadPortfolioUI() {
  renderSectorPills();
  chrome.storage.local.get(["portfolio"], (d) => {
    const list = document.getElementById("holdingsList");
    if (!list) return;
    list.innerHTML = "";
    const saved = Array.isArray(d.portfolio) ? d.portfolio : [];
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
    <input type="text"   placeholder="TICKER.NS" value="${esc(ticker)}"/>
    <input type="number" placeholder="Qty"        value="${esc(qty)}" min="1"/>
    <button class="btn-rm" type="button">×</button>`;
  row.querySelector(".btn-rm").addEventListener("click", () => row.remove());
  list.appendChild(row);
}

function setupPortfolioPanel() {
  document.getElementById("addHoldingBtn").addEventListener("click", () => addHoldingRow());
  document.getElementById("savePortfolioBtn").addEventListener("click", saveAndSimulate);
}

async function saveAndSimulate() {
  const rows = document.querySelectorAll(".holding-row");
  const portfolio = [];
  rows.forEach((row) => {
    const inputs = row.querySelectorAll("input");
    const ticker = (inputs[0]?.value || "").trim().toUpperCase();
    const qty = (inputs[1]?.value || "").trim();
    if (ticker) portfolio.push({ ticker, qty });
  });

  const sectors = [...document.querySelectorAll(".spill.sel")].map((p) => p.dataset.sector);
  chrome.storage.local.set({ portfolio, selectedSectors: sectors });

  const resultDiv = document.getElementById("portfolioResult");
  const portSpinner = document.getElementById("portSpinner");
  const text = document.getElementById("headlineInput").value.trim();

  if (!text) {
    resultDiv.innerHTML = `<div style="color:var(--text-m);font-size:11px;margin-top:10px">
      Go to Analyse tab first — auto-scrape or paste a headline, then come back here.</div>`;
    return;
  }
  if (!sectors.length) {
    resultDiv.innerHTML = `<div style="color:var(--warn);font-size:11px;margin-top:10px">Select at least one sector above.</div>`;
    return;
  }

  resultDiv.innerHTML = "";
  portSpinner.style.display = "block";

  try {
    const res = await fetch(`${apiUrl}/api/portfolio_impact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        news_text: text,
        persona: {
          sectors,
          holdings: portfolio.map((h) => ({
            ticker: h.ticker,
            quantity: parseInt(h.qty) || 1,
            avg_buy_price: 100,
          })),
        },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderPortfolioImpact(data, resultDiv);
  } catch (err) {
    resultDiv.innerHTML = `<div style="color:var(--neg);font-size:11px;margin-top:10px">Error: ${esc(err.message)}</div>`;
  } finally {
    portSpinner.style.display = "none";
  }
}

function renderPortfolioImpact(data, container) {
  const signal = Math.max(0, Math.min(1, data.overall_signal || 0.5));
  const sigPct = Math.round(signal * 100);
  const sigCls = signal > 0.6 ? "positive" : signal < 0.4 ? "negative" : "neutral";
  const sector = (data.primary_sector_affected || "—").toUpperCase();
  const impact = data.estimated_portfolio_impact || "—";
  const advisory = data.ai_advisory || "";

  const assetImpacts = data.asset_impacts || {};
  const chartHtml = Object.keys(assetImpacts).length
    ? `<div style="margin-top:11px">
         <div class="chart-hdr">Asset-level impact</div>
         ${buildDivChart(assetImpacts)}
       </div>`
    : "";

  container.innerHTML = `
    <div class="pcard">
      <div class="pcard-row">
        <span class="pcard-sector">${esc(sector)}</span>
        <span class="pill pill-${sigCls}">Signal ${sigPct}/100</span>
      </div>
      <div class="pcard-impact">${esc(impact)}</div>
      <div class="sig-track" style="height:5px;margin-bottom:10px">
        <div class="sig-fill" style="transform:scaleX(${signal})"></div>
      </div>
      <div class="pcard-advisory">${esc(advisory)}</div>
      ${chartHtml}
    </div>`;
}

// ── Deep Dive panel ───────────────────────────────────────────────────────────

function setupDeepPanel() {
  const urlLabel = document.getElementById("webappUrlLabel");
  if (urlLabel) urlLabel.textContent = webappUrl;

  document.getElementById("openWebappBtn").addEventListener("click", () => {
    // Pass current headline as query param so webapp can pre-load it
    const text = document.getElementById("headlineInput").value.trim();
    const url = text
      ? `${webappUrl}?q=${encodeURIComponent(text)}`
      : webappUrl;
    chrome.tabs.create({ url });
  });
}

// ── Shared: diverging bar chart ───────────────────────────────────────────────

function buildDivChart(impacts) {
  const ORDER = ["Nifty 50", "Bank Nifty", "Nifty IT", "Gold INR", "Crude Oil", "USD INR", "Crypto", "Bonds"];
  const present = ORDER.filter((a) => a in impacts);
  if (!present.length) return "";

  const maxAbs = Math.max(...present.map((a) => Math.abs(impacts[a])), 0.1);

  return present.map((asset) => {
    const pct = impacts[asset];
    const barW = Math.min((Math.abs(pct) / maxAbs) * 100, 100).toFixed(1);
    const isPos = pct >= 0;
    const sign = isPos ? "+" : "";
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
        <span class="chart-pct ${isPos ? 'p' : 'n'}">${sign}${pct.toFixed(1)}%</span>
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