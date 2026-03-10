// ══════════════════════════════════════════════
//  Finora Intelligence — popup.js
// ══════════════════════════════════════════════

const DEFAULT_API = "http://localhost:8001";

// ── State ──────────────────────────────────────
let apiUrl  = DEFAULT_API;
let userId  = "user1";
let lastResult = null;   // last /api/scrape response

// ── Init ───────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  setupTabs();
  setupAnalysePanel();
  setupPortfolioPanel();
  setupFeedPanel();
  setupSettingsPanel();
  checkBackendStatus();
});

// ══ SETTINGS ══════════════════════════════════

async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(["apiUrl", "userId", "portfolio"], data => {
      if (data.apiUrl)  apiUrl  = data.apiUrl;
      if (data.userId)  userId  = data.userId;
      resolve();
    });
  });
}

function setupSettingsPanel() {
  const apiInput    = document.getElementById("apiUrlInput");
  const userInput   = document.getElementById("userIdInput");
  const saveBtn     = document.getElementById("saveSettingsBtn");
  const settingsMsg = document.getElementById("settingsMsg");

  apiInput.value  = apiUrl;
  userInput.value = userId;

  saveBtn.addEventListener("click", () => {
    apiUrl = apiInput.value.trim().replace(/\/$/, "") || DEFAULT_API;
    userId = userInput.value.trim() || "user1";
    chrome.storage.local.set({ apiUrl, userId });
    showMsg(settingsMsg, "info", "Settings saved ✓");
    checkBackendStatus();
  });
}

// ══ BACKEND STATUS ═════════════════════════════

async function checkBackendStatus() {
  const dot = document.getElementById("statusDot");
  try {
    const res = await fetch(`${apiUrl}/`, { signal: AbortSignal.timeout(3000) });
    dot.style.background = res.ok ? "#22c55e" : "#ef4444";
    dot.style.boxShadow  = res.ok ? "0 0 6px #22c55e" : "0 0 6px #ef4444";
  } catch {
    dot.style.background = "#ef4444";
    dot.style.boxShadow  = "0 0 6px #ef4444";
  }
}

// ══ TABS ═══════════════════════════════════════

function setupTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tab-" + tab.dataset.tab).classList.add("active");

      if (tab.dataset.tab === "feed") loadFeed();
      if (tab.dataset.tab === "portfolio") loadPortfolioUI();
    });
  });
}

// ══ ANALYSE PANEL ══════════════════════════════

function setupAnalysePanel() {
  document.getElementById("scrapeBtn").addEventListener("click", scrapeHeadlines);
  document.getElementById("analyseBtn").addEventListener("click", () => analyseHeadline(false));
  document.getElementById("analysePortfolioBtn").addEventListener("click", () => analyseHeadline(true));
}

// ── Scrape headlines from active tab ──────────
async function scrapeHeadlines() {
  const btn = document.getElementById("scrapeBtn");
  btn.textContent = "Scraping…";
  btn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractHeadlines,
    });

    const headlines = results[0]?.result || [];

    if (headlines.length === 0) {
      showMsg(document.getElementById("infoMsg"), "info", "No headlines found on this page. Try pasting manually.");
      return;
    }

    // Show picker if multiple found
    if (headlines.length === 1) {
      document.getElementById("headlineInput").value = headlines[0];
    } else {
      showHeadlinePicker(headlines);
    }
  } catch (err) {
    showMsg(document.getElementById("errorMsg"), "error", "Cannot scrape this page. Try pasting manually.");
  } finally {
    btn.textContent = "⟳ SCRAPE HEADLINES FROM THIS PAGE";
    btn.disabled = false;
  }
}

// Injected into page — extracts headline candidates
function extractHeadlines() {
  const selectors = [
    "h1", "h2",
    "[class*='headline']", "[class*='title']",
    "[class*='story-title']", "[class*='article-title']",
    "article h1", "article h2",
    ".post-title", ".entry-title",
  ];

  const seen = new Set();
  const results = [];

  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach(el => {
      const text = el.innerText?.trim();
      if (text && text.length > 20 && text.length < 300 && !seen.has(text)) {
        seen.add(text);
        results.push(text);
      }
    });
    if (results.length >= 10) break;
  }

  return results.slice(0, 8);
}

function showHeadlinePicker(headlines) {
  const input = document.getElementById("headlineInput");
  // Put first headline in and show info about others
  input.value = headlines[0];
  const info = `Found ${headlines.length} headlines. Top one loaded. Scroll to pick another.\n\nOthers:\n` +
    headlines.slice(1).map((h, i) => `${i + 2}. ${h}`).join("\n");
  showMsg(document.getElementById("infoMsg"), "info",
    `Found ${headlines.length} headlines — top one loaded. Edit as needed.`);
}

// ── Analyse headline ───────────────────────────
async function analyseHeadline(withPortfolio) {
  const headline = document.getElementById("headlineInput").value.trim();
  if (!headline) {
    showMsg(document.getElementById("errorMsg"), "error", "Please enter a headline first.");
    return;
  }

  const btn      = withPortfolio
    ? document.getElementById("analysePortfolioBtn")
    : document.getElementById("analyseBtn");
  const spinner  = document.getElementById("spinner");
  const errorMsg = document.getElementById("errorMsg");
  const resultCard = document.getElementById("resultCard");

  hideMsg(errorMsg);
  hideMsg(document.getElementById("infoMsg"));
  resultCard.classList.remove("show");
  spinner.style.display = "block";
  btn.disabled = true;

  // Get source info from active tab
  let sourceUrl = null, sourceName = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    sourceUrl  = tab.url;
    sourceName = new URL(tab.url).hostname.replace("www.", "");
  } catch {}

  try {
    const res = await fetch(`${apiUrl}/api/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline,
        source_url:  sourceUrl,
        source_name: sourceName,
      }),
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    lastResult = data;

    renderResult(data);
    resultCard.classList.add("show");

    if (withPortfolio) {
      renderPortfolioImpact(data);
      showMsg(document.getElementById("infoMsg"), "info",
        "Portfolio impact computed — check the Portfolio tab.");
    }

  } catch (err) {
    showMsg(errorMsg, "error", `Error: ${err.message}`);
  } finally {
    spinner.style.display = "none";
    btn.disabled = false;
  }
}

// ── Render result card ─────────────────────────
function renderResult(data) {
  const s = data.sentiment;
  const c = data.classification;
  const imp = data.impact;

  // Sentiment pill
  const sentClass = `pill pill-${s.label}`;
  document.getElementById("r-sentiment").innerHTML =
    `<span class="${sentClass}">${s.label.toUpperCase()}</span>
     <span style="font-size:10px;color:var(--muted);margin-left:6px">${(s.score * 100).toFixed(0)}%</span>`;

  // Confidence bar
  const conf = Math.round(c.confidence_score * 100);
  document.getElementById("r-confidence").textContent = `${conf}%`;
  document.getElementById("r-conf-bar").style.width = `${conf}%`;

  // Category
  document.getElementById("r-category").textContent =
    c.primary_category.replace(/_/g, " ").toUpperCase();

  // Impact
  document.getElementById("r-impact").innerHTML =
    `<span class="pill pill-${imp.impact_level}">${imp.impact_level.toUpperCase()}</span>`;
  document.getElementById("r-score").textContent =
    `${imp.impact_score} / 10`;

  // Sectors
  document.getElementById("r-sectors").textContent =
    (imp.affected_sectors || []).join(", ") || "—";

  // Keywords
  document.getElementById("r-keywords").textContent =
    (c.keywords || []).join(", ") || "—";

  // Rationale
  document.getElementById("r-rationale").textContent = imp.rationale || "—";
}

// ══ PORTFOLIO PANEL ════════════════════════════

function setupPortfolioPanel() {
  document.getElementById("addStockBtn").addEventListener("click", addStockRow);
  document.getElementById("savePortfolioBtn").addEventListener("click", savePortfolio);
}

function loadPortfolioUI() {
  chrome.storage.local.get(["portfolio"], data => {
    const portfolio = data.portfolio || [];
    const list = document.getElementById("stockList");
    list.innerHTML = "";

    if (portfolio.length === 0) {
      addStockRow();
    } else {
      portfolio.forEach(p => addStockRow(p.ticker, p.qty));
    }

    if (lastResult) renderPortfolioImpact(lastResult);
  });
}

function addStockRow(ticker = "", qty = "") {
  const list = document.getElementById("stockList");
  const row  = document.createElement("div");
  row.className = "stock-entry";
  row.innerHTML = `
    <input type="text" placeholder="TICKER" value="${ticker}" style="text-transform:uppercase" maxlength="8" />
    <input type="text" placeholder="Qty / Value" value="${qty}" />
    <button class="btn-remove">×</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => row.remove());
  list.appendChild(row);
}

function savePortfolio() {
  const rows = document.querySelectorAll(".stock-entry");
  const portfolio = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const ticker = inputs[0].value.trim().toUpperCase();
    const qty    = inputs[1].value.trim();
    if (ticker) portfolio.push({ ticker, qty });
  });
  chrome.storage.local.set({ portfolio });
  showMsg(document.getElementById("infoMsg"), "info", `Saved ${portfolio.length} positions ✓`);
}

// ── Portfolio impact from last analysis ────────
function renderPortfolioImpact(data) {
  chrome.storage.local.get(["portfolio"], storage => {
    const portfolio = storage.portfolio || [];
    const resultsDiv = document.getElementById("portfolioResults");

    if (portfolio.length === 0) {
      resultsDiv.innerHTML = `<div style="font-size:11px;color:var(--muted);font-family:var(--mono)">Add positions in the Portfolio tab first.</div>`;
      return;
    }

    const affectedCompanies = (data.impact.affected_companies || [])
      .map(c => c.split("(")[1]?.replace(")", "").trim())
      .filter(Boolean);
    const affectedSectors   = data.impact.affected_sectors || [];
    const impactLevel       = data.impact.impact_level;
    const sentiment         = data.sentiment.label;

    const html = portfolio.map(({ ticker, qty }) => {
      const directHit = affectedCompanies.some(c =>
        c.toLowerCase() === ticker.toLowerCase()
      );

      // Rough sector matching
      const sectorKeywords = {
        "Technology":    ["AAPL","MSFT","NVDA","GOOGL","META","AMZN","AMD","INTC","CRM","ORCL","TSLA"],
        "Financials":    ["JPM","GS","BAC","C","WFC","MS","BLK","AXP"],
        "Energy":        ["XOM","CVX","COP","SLB","OXY","BP","SHEL"],
        "Healthcare":    ["JNJ","PFE","UNH","MRK","ABBV","LLY","TMO"],
        "Defense":       ["LMT","RTX","NOC","GD","BA"],
        "Crypto":        ["COIN","MSTR","RIOT","MARA"],
      };

      let matchedSector = null;
      for (const [sector, tickers] of Object.entries(sectorKeywords)) {
        if (tickers.includes(ticker) && affectedSectors.includes(sector)) {
          matchedSector = sector;
          break;
        }
      }

      let impactText, impactColor;
      if (directHit) {
        impactText  = `⚡ Direct exposure — ${ticker} is explicitly mentioned in this news. Impact: ${impactLevel.toUpperCase()}`;
        impactColor = impactLevel === "high" ? "var(--red)" : impactLevel === "medium" ? "var(--gold)" : "var(--green)";
      } else if (matchedSector) {
        impactText  = `~ Sector exposure via ${matchedSector}. Sentiment: ${sentiment}. Monitor for spillover.`;
        impactColor = "var(--gold)";
      } else {
        impactText  = `✓ Low direct exposure. Headline unlikely to significantly affect ${ticker}.`;
        impactColor = "var(--green)";
      }

      return `
        <div class="impact-item">
          <div style="display:flex;justify-content:space-between">
            <span class="ticker">${ticker}</span>
            <span style="font-size:10px;color:var(--muted);font-family:var(--mono)">${qty ? `× ${qty}` : ""}</span>
          </div>
          <div class="impact-text" style="color:${impactColor}">${impactText}</div>
        </div>
      `;
    }).join("");

    resultsDiv.innerHTML = html;
  });
}

// ══ FEED PANEL ═════════════════════════════════

function setupFeedPanel() {
  document.getElementById("refreshFeedBtn").addEventListener("click", loadFeed);
}

async function loadFeed() {
  const list = document.getElementById("feedList");
  list.innerHTML = `<div style="font-size:11px;color:var(--muted);font-family:var(--mono)">Loading…</div>`;

  try {
    const res  = await fetch(`${apiUrl}/api/feed?limit=20`);
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();

    if (data.length === 0) {
      list.innerHTML = `<div style="font-size:11px;color:var(--muted);font-family:var(--mono)">No headlines analysed yet.</div>`;
      return;
    }

    list.innerHTML = data.map(item => {
      const s   = item.sentiment;
      const imp = item.impact;
      const dt  = new Date(item.processed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `
        <div class="feed-item">
          <div class="feed-headline">${item.headline}</div>
          <div class="feed-meta">
            <span class="pill pill-${s.label}">${s.label.toUpperCase()}</span>
            <span class="pill pill-${imp.impact_level}">${imp.impact_level.toUpperCase()}</span>
            <span style="font-size:10px;color:var(--muted);font-family:var(--mono);margin-left:auto">${dt}</span>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    list.innerHTML = `<div style="font-size:11px;color:var(--red);font-family:var(--mono)">Failed to load feed: ${err.message}</div>`;
  }
}

// ══ HELPERS ════════════════════════════════════

function showMsg(el, type, text) {
  el.textContent = text;
  el.className = `msg ${type} show`;
}
function hideMsg(el) {
  el.className = "msg";
}
