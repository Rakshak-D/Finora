// background.js — Finora service worker
// Handles extension lifecycle and badge updates

chrome.runtime.onInstalled.addListener(() => {
  console.log("Finora Intelligence installed.");
  chrome.storage.local.set({
    apiUrl:    "http://localhost:8001",
    userId:    "user1",
    portfolio: [],
  });
});

// Update badge when a message is analysed
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "ANALYSIS_DONE") {
    const level = msg.impactLevel;
    const color = level === "high"   ? "#ef4444"
                : level === "medium" ? "#f0b429"
                :                     "#22c55e";
    chrome.action.setBadgeText({ text: "●" });
    chrome.action.setBadgeBackgroundColor({ color });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 5000);
  }
});
