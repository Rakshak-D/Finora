import logging
from ..schemas import InvestorPersona, PortfolioTestResult, EventInput

logger = logging.getLogger(__name__)


def _fmt_inr(amount: float) -> str:
    sign    = "+" if amount >= 0 else "-"
    abs_val = abs(amount)
    if abs_val >= 1_00_00_000:
        return f"{sign}₹{abs_val / 1_00_00_000:.2f} Cr"
    elif abs_val >= 1_00_000:
        return f"{sign}₹{abs_val / 1_00_000:.2f} L"
    return f"{sign}₹{abs_val:,.0f}"


def _build_impact_string(result, pv: float) -> str:
    """
    Build impact string with 4 fallback levels — never returns bare "Insufficient data".

    1. History avg_sector_move × pv  → ₹ estimate with parallel count
    2. Best non-zero asset from avg_asset_impacts × pv → ₹ estimate
    3. Signal-score qualitative description  (no ₹, but informative)
    4. Generic classification summary        (absolute last resort)
    """
    echo = result.history_echo

    # ── Level 1: avg Nifty move available and portfolio value known ───────────
    if echo and echo.avg_sector_move_pct != 0.0 and pv > 0:
        avg_pct = echo.avg_sector_move_pct
        est_inr = pv * (avg_pct / 100)
        n       = len(echo.parallels)
        return (
            f"{_fmt_inr(est_inr)} est. ({avg_pct:+.1f}%) "
            f"based on {n} historical parallel{'s' if n != 1 else ''}"
        )

    # ── Level 2: pick any non-zero asset impact ───────────────────────────────
    if echo and echo.avg_asset_impacts and pv > 0:
        preferred = ["Nifty_50", "Bank_Nifty", "Nifty_IT", "Crude_Oil", "Gold_INR"]
        chosen_key, chosen_pct = None, 0.0
        for k in preferred:
            v = echo.avg_asset_impacts.get(k, 0.0)
            if v != 0.0:
                chosen_key, chosen_pct = k, v
                break
        if not chosen_key:
            for k, v in echo.avg_asset_impacts.items():
                if v != 0.0:
                    chosen_key, chosen_pct = k, v
                    break
        if chosen_key:
            est_inr = pv * (chosen_pct / 100)
            label   = chosen_key.replace("_", " ")
            n       = len(echo.parallels)
            return (
                f"{_fmt_inr(est_inr)} est. ({chosen_pct:+.1f}% on {label}) "
                f"from {n} historical event{'s' if n != 1 else ''}"
            )

    # ── Level 3: qualitative from signal score ────────────────────────────────
    signal    = result.signal_score
    sentiment = result.sentiment.label.value
    sector    = result.classification.primary_sector.upper()
    conf      = int(result.classification.confidence * 100)

    if signal > 0.65:
        qual = f"Bullish signal {int(signal*100)}/100 — {sector} events historically trend positive ({conf}% conf.)"
    elif signal < 0.35:
        qual = f"Bearish signal {int(signal*100)}/100 — {sector} events historically trend negative ({conf}% conf.)"
    else:
        qual = f"Neutral signal {int(signal*100)}/100 — {sentiment} sentiment in {sector} ({conf}% conf.)"

    suffix = "" if pv > 0 else " Add holdings with qty to estimate ₹ impact."
    return qual + suffix


def analyze_portfolio_impact(
    news_text: str,
    persona:   InvestorPersona,
) -> PortfolioTestResult:
    """Run the full ML pipeline and return a PortfolioTestResult."""
    from ..pipeline import run_event_pipeline

    result = run_event_pipeline(
        event=EventInput(text=news_text, deep_analysis=True),
        persona=persona,
        run_history=True,
        run_gemini=True,
    )

    # Portfolio value — from explicit field or computed from holdings
    pv = persona.portfolio_value
    if not pv and persona.holdings:
        pv = sum(h.quantity * h.avg_buy_price for h in persona.holdings)
    pv = pv or 0.0

    impact_str = _build_impact_string(result, pv)

    # Advisory text
    parts = []
    if result.persona_summary:
        parts.append(result.persona_summary)
    if result.domino_chain and result.domino_chain.user_impact:
        parts.append(result.domino_chain.user_impact)
    if result.domino_chain and result.domino_chain.chain:
        chain_str = " → ".join(
            f"{n.sector.upper()} {'↑' if n.direction == 'up' else '↓' if n.direction == 'down' else '→'}"
            for n in result.domino_chain.chain[:3]
        )
        parts.append(f"Ripple: {chain_str}")
    if not parts:
        parts.append(
            f"{result.classification.event_type} in {result.classification.primary_sector} "
            f"sector — {result.sentiment.label.value} sentiment."
        )

    return PortfolioTestResult(
        overall_signal=result.signal_score,
        primary_sector_affected=result.classification.primary_sector,
        estimated_portfolio_impact=impact_str,
        ai_advisory=" | ".join(parts),
        asset_impacts=result.history_echo.avg_asset_impacts if result.history_echo else {},
    )