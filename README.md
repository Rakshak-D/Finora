# 🇮🇳 Finora — Event-Driven Market Intelligence for India

[![Status](https://img.shields.io/badge/Status-In_Development-orange)](https://github.com)
[![Hackathon](https://img.shields.io/badge/Hackathon-2025-blue)](https://github.com)
[![Market](https://img.shields.io/badge/Market-India_(NSE%2FBSE)-green)](https://github.com)

> **"Know before the market moves."**

Finora is an AI-powered market intelligence platform built specifically for the Indian market. The core idea is simple — a user inputs any financial news headline, and Finora instantly predicts which Indian assets (Nifty 50, Gold, USD/INR, sector ETFs, etc.) are likely to move, in which direction, and explains exactly why — all backed by real historical Indian market data.

---

## 🚩 The Problem We're Solving

When major news breaks — an RBI rate hike, a geopolitical conflict, a Union Budget announcement — retail investors in India are left guessing how it affects their portfolio. Institutional players have teams of analysts for this. Retail investors have nothing.

Finora bridges that gap by giving anyone access to institutional-grade event analysis in seconds.

---

## 💡 What We Plan to Build

### Core Features

**1. Event-to-Market Intelligence**
The heart of the platform. User inputs any headline → AI classifies the event type (monetary policy, geopolitical, corporate, environmental) → system finds similar historical Indian market events → predicts directional impact on Nifty 50, Bank Nifty, Gold, Oil, USD/INR, and key sector ETFs → explains the reasoning in plain English.

**2. Pre-Event Intelligence Dashboard**
Analyzes historical market data to detect unusual activity (volume spikes, price anomalies) that occurred *before* major events went public. Helps users understand if the market had already started reacting before the news broke.

**3. Live News-to-Impact Feed**
Continuously pulls headlines from Indian financial RSS feeds (Economic Times, MoneyControl, Business Standard) and automatically tags each with predicted market impact — so every piece of news comes with the analysis already done.

**4. Portfolio Stress Tester**
Users input their portfolio holdings and select a macro scenario (recession, rate hike, oil shock, war). The platform simulates estimated portfolio impact based on how similar events played out historically in Indian markets.

**5. Macro Market Pulse Panel**
A live dashboard showing key Indian market indicators — Nifty 50, Bank Nifty, Sensex, Gold (INR), USD/INR, Crude Oil — all in one place with real-time color-coded movement cards.

**6. Chrome Extension** *(stretch goal)*
A browser extension that lets users analyze any financial article they're reading online and see a compact impact summary without leaving the page.

---

## 🛠 Planned Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React + Vite + Tailwind CSS + Recharts |
| **Backend** | Python + FastAPI |
| **Event Classification** | HuggingFace `facebook/bart-large-mnli` (Zero-Shot NLP) |
| **Semantic Search** | `sentence-transformers/all-MiniLM-L6-v2` + ChromaDB |AC
| **Sentiment Analysis** | `ProsusAI/finbert` (financial domain NLP) |
| **AI Explanations** | Claude API / GPT-3.5 (RAG pattern) |
| **Market Data** | yfinance (NSE/BSE) |
| **News Data** | RSS Feeds from ET, MoneyControl, Business Standard |
| **Chrome Extension** | Manifest V3 + Vanilla JS |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## 🎯 Indian Market Focus

The platform is built around Indian market data from the ground up:

- Tracks **Nifty 50, Bank Nifty, Nifty IT, Sensex** as primary indices
- Uses **GOLDBEES.NS** for Gold in INR, **USDINR=X** for forex
- Historical dataset built around key Indian events — Demonetization, GST rollout, COVID lockdown, RBI rate cycles, Union Budgets, Adani crisis, IL&FS collapse, and more
- News sourced exclusively from Indian financial publications

---
