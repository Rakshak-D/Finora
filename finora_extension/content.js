// content.js — injected into every page
// Listens for messages from popup to extract headlines

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_HEADLINES") {
    const headlines = extractHeadlinesFromPage();
    sendResponse({ headlines });
  }
  return true;
});

function extractHeadlinesFromPage() {
  const selectors = [
    "h1", "h2",
    "[class*='headline']",
    "[class*='story-title']",
    "[class*='article-title']",
    "[class*='post-title']",
    "[class*='entry-title']",
    "article h1",
    "article h2",
    ".title a",
    "[data-testid*='headline']",
  ];

  const seen    = new Set();
  const results = [];

  for (const sel of selectors) {
    try {
      document.querySelectorAll(sel).forEach(el => {
        const text = el.innerText?.trim().replace(/\s+/g, " ");
        if (
          text &&
          text.length > 20 &&
          text.length < 300 &&
          !seen.has(text)
        ) {
          seen.add(text);
          results.push(text);
        }
      });
    } catch {}
    if (results.length >= 10) break;
  }

  return results.slice(0, 8);
}
