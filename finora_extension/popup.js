// ══════════════════════════════════════════════
//  Finora Extension JS - Full ML Integration
// ══════════════════════════════════════════════

let apiUrl = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  setupTabs();
  setupAnalysePanel();
  setupPortfolioPanel();
  setupNewsPanel();
  checkBackendStatus();
});

async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(["apiUrl", "portfolio"], data => {
      if (data.apiUrl && data.apiUrl !== "http://localhost:8001") {
        apiUrl = data.apiUrl;
      } else {
        apiUrl = "http://localhost:8000"; // Auto-migrate legacy port 8001 to 8000
        chrome.storage.local.set({ apiUrl: "http://localhost:8000" });
      }
      resolve();
    });
  });
}

function setupNewsPanel() {
  document.getElementById("refreshNewsBtn").addEventListener("click", loadNewsFeed);
}

async function loadNewsFeed() {
  const list = document.getElementById("newsList");
  list.innerHTML = `<div class="spinner" style="display:block"></div>`;
  try {
    const res = await fetch(`${apiUrl}/api/news?count=10`);
    if (!res.ok) throw new Error("API failure");
    const data = await res.json();

    list.innerHTML = data.map(n => `
      <div style="background:var(--surface2); padding:12px; border-radius:8px; border:1px solid var(--border);">
        <div style="font-family:var(--display); font-size:12px; font-weight:700; color:var(--gold); margin-bottom:6px;">${n.source} &bull; <span style="font-family:var(--mono); font-size:9px; color:var(--text-faint)">${n.timestamp}</span></div>
        <div style="font-size:12px; line-height:1.4; color:var(--text); margin-bottom:6px;">${n.title}</div>
        <div style="font-size:11px; line-height:1.4; color:var(--text-dim);">${n.summary}</div>
      </div>
    `).join("");
  } catch (e) {
    list.innerHTML = "<span style='color:var(--red)'>Failed to load news.</span>";
  }
}

async function checkBackendStatus() {
  const dot = document.getElementById("statusDot");
  try {
    const res = await fetch(`${apiUrl}/api/health`);
    dot.style.background = res.ok ? "#10b981" : "#ef4444";
    dot.style.boxShadow = res.ok ? "0 0 8px #10b981" : "0 0 8px #ef4444";
  } catch {
    dot.style.background = "#ef4444";
    dot.style.boxShadow = "0 0 8px #ef4444";
  }
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
      if (tab.dataset.tab === "portfolio") loadPortfolioUI();
      if (tab.dataset.tab === "news") loadNewsFeed();
    });
  });
}

function setupAnalysePanel() {
  document.getElementById("scrapeBtn").addEventListener("click", scrapeHeadlines);
  document.getElementById("analyseBtn").addEventListener("click", analyseEvent);
}

async function scrapeHeadlines() {
  const btn = document.getElementById("scrapeBtn");
  btn.textContent = "Scraping...";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText.substring(0, 1000)
    });
    document.getElementById("headlineInput").value = results[0]?.result || "No text found";
  } catch (e) {
    document.getElementById("headlineInput").value = "Scraping failed.";
  }
  btn.textContent = "Scrape Event";
}

async function analyseEvent() {
  const text = document.getElementById("headlineInput").value.trim();
  if (!text) return;

  const btn = document.getElementById("analyseBtn");
  const spinner = document.getElementById("spinner");
  const resultCard = document.getElementById("resultCard");

  // Hide previous UI
  resultCard.classList.remove("show");
  spinner.style.display = "block";
  btn.disabled = true;

  // Build persona payload if portfolio present
  const portfolio = await getPortfolio();
  let personaPayload = null;
  if (portfolio.length > 0) {
    personaPayload = {
      sectors: ["defence"], // Placeholder for dynamic config
      risk_appetite: "moderate",
      holdings: portfolio.map(p => ({
        ticker: p.ticker, quantity: Number(p.qty) || 1, avg_buy_price: 100
      })),
      portfolio_value: 100000
    };
  }

  try {
    const res = await fetch(`${apiUrl}/api/analyze_event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: { text, deep_analysis: true }, persona: personaPayload })
    });

    if (!res.ok) {
      let errorDetail = "API failure";
      try {
        const errJson = await res.json();
        errorDetail = errJson.detail || errorDetail;
      } catch (e) { }
      throw new Error(errorDetail);
    }

    const data = await res.json();

    // Render ML Data
    renderResults(data);
    resultCard.classList.add("show");

  } catch (err) {
    showMsg(document.getElementById("errorMsg"), "error", `API Error: ${err.message}`);
  } finally {
    spinner.style.display = "none";
    btn.disabled = false;
  }
}

function renderResults(data) {
  // Basic NLP stats
  document.getElementById("r-sentiment").innerHTML = `<span class="pill pill-${data.sentiment.label}">${data.sentiment.label}</span>`;
  document.getElementById("r-category").textContent = data.classification.primary_sector.toUpperCase();
  document.getElementById("r-type").textContent = data.classification.event_type;
  document.getElementById("r-confidence").textContent = `${(data.classification.confidence * 100).toFixed(1)}%`;

  // Domino Chain UI
  const chainBox = document.getElementById("r-domino-chain");
  if (data.domino_chain && data.domino_chain.chain.length > 0) {
    chainBox.innerHTML = data.domino_chain.chain.map(node =>
      `<div class="domino-node">
                <span style="font-weight:bold; color:var(--text);">${node.sector.toUpperCase()}</span>
                <span class="pill pill-${node.direction === 'up' ? 'positive' : node.direction === 'down' ? 'negative' : 'neutral'}">${node.direction.toUpperCase()}</span>
                <span style="color:var(--text-dim)">${node.reason}</span>
            </div>`
    ).join("");
  } else {
    chainBox.innerHTML = "<span style='color:var(--text-dim)'>No domino chain generated.</span>";
  }

  // History Echo UI
  const echoBox = document.getElementById("r-history-echo");
  if (data.history_echo && data.history_echo.parallels.length > 0) {
    echoBox.innerHTML = data.history_echo.parallels.slice(0, 2).map(p =>
      `<div class="echo-card">
                <div style="color:var(--gold); font-family:var(--mono); margin-bottom:4px;">${p.event_date}</div>
                <div style="color:var(--text); line-height:1.4;">${p.event_summary}</div>
            </div>`
    ).join("");
  } else {
    echoBox.innerHTML = "<span style='color:var(--text-dim)'>No historical vector parallels found.</span>";
  }
}

/* ── Portfolio Section ── */

async function getPortfolio() {
  return new Promise(resolve => {
    chrome.storage.local.get(["portfolio"], data => {
      resolve(data.portfolio || []);
    });
  });
}

async function loadPortfolioUI() {
  const portfolio = await getPortfolio();
  const list = document.getElementById("stockList");
  list.innerHTML = "";
  if (portfolio.length === 0) addStockRow();
  else portfolio.forEach(p => addStockRow(p.ticker, p.qty));
}

document.getElementById("addStockBtn").addEventListener("click", () => addStockRow());
document.getElementById("savePortfolioBtn").addEventListener("click", async () => {
  const rows = document.querySelectorAll(".stock-entry");
  const portfolio = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const ticker = inputs[0].value.trim().toUpperCase();
    const qty = inputs[1].value.trim();
    if (ticker) portfolio.push({ ticker, qty });
  });
  chrome.storage.local.set({ portfolio });

  // Auto-Simulate Impact!
  const text = document.getElementById("headlineInput").value.trim();
  if (text && portfolio.length > 0) {
    simulatePortfolioImpact(text, portfolio);
  }
});

function addStockRow(ticker = "", qty = "") {
  const list = document.getElementById("stockList");
  const row = document.createElement("div");
  row.className = "stock-entry";
  row.innerHTML = `<input type="text" placeholder="TICKER" value="${ticker}"><input type="number" placeholder="Qty" value="${qty}"><button class="btn-remove">×</button>`;
  row.querySelector(".btn-remove").addEventListener("click", () => row.remove());
  list.appendChild(row);
}

async function simulatePortfolioImpact(text, portfolio) {
  const resultsDiv = document.getElementById("portfolioResults");
  resultsDiv.innerHTML = `<div class="spinner" style="display:block"></div>`;

  const persona = {
    sectors: ["defence"],
    risk_appetite: "moderate",
    holdings: portfolio.map(p => ({ ticker: p.ticker, quantity: Number(p.qty) || 1, avg_buy_price: 100 })),
    portfolio_value: 100000
  };

  try {
    const res = await fetch(`${apiUrl}/api/portfolio_impact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ news_text: text, persona: persona })
    });

    if (!res.ok) throw new Error("Backend API Failed");
    const data = await res.json();

    resultsDiv.innerHTML = `
            <div style="background:var(--surface2); padding:16px; border-radius:8px; border:1px solid var(--border);">
                <div style="font-family:var(--display); font-size:16px; margin-bottom:12px; color:var(--gold);">Portfolio Simulation</div>
                <div class="pill pill-${data.overall_signal > 0.5 ? 'positive' : (data.overall_signal < 0.5 ? 'negative' : 'neutral')}">Signal Score: ${(data.overall_signal * 100).toFixed(0)}</div>
                <div style="margin-top:12px; font-size:12px; font-weight:bold; color:var(--gold);">${data.primary_sector_affected.toUpperCase()} IMPACT:</div>
                <div style="margin-top:4px; font-size:12px; line-height:1.6; color:var(--text);">${data.estimated_portfolio_impact}</div>
                <div style="margin-top:12px; font-size:11px; line-height:1.6; color:var(--text-dim); font-style:italic;">"${data.ai_advisory}"</div>
            </div>
        `;
  } catch (err) {
    resultsDiv.innerHTML = `<span style='color:var(--red)'>Simulation Failed: ${err.message}</span>`;
  }
}

function showMsg(el, type, text) { el.textContent = text; el.className = `msg ${type} show`; setTimeout(() => el.className = "msg", 4000); }
