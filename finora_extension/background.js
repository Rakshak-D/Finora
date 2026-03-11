// background.js — Finora service worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    apiUrl: "http://localhost:8000",
    webappUrl: "http://localhost:3000",
    portfolio: [],
    selectedSectors: [],
  });
  console.log("Finora Intelligence v2 installed.");
});

// Update badge when a message is analysed
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "ANALYSIS_DONE") {
    const level = msg.impactLevel;
    const color = level === "high" ? "#ef4444" : level === "medium" ? "#f0b429" : "#22c55e";
    chrome.action.setBadgeText({ text: "●" });
    chrome.action.setBadgeBackgroundColor({ color });
    // Clear badge after 5 seconds
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 5000);
  }
});