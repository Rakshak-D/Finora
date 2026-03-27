from __future__ import annotations

from finora_ml.schemas import CoachBrief, EventClassificationResult, GraphEdge, GraphNode, InsightGraph


class CoachService:
    def _sentiment_word(self, label: str) -> str:
        if label == "positive":
            return "help"
        if label == "negative":
            return "hurt"
        return "shift"

    def compute_should_care(self, signal_score: float) -> str:
        if signal_score >= 0.72:
            return "act_cautiously"
        if signal_score >= 0.45:
            return "watch"
        return "ignore"

    def build_one_line_take(self, headline: str, analysis: EventClassificationResult) -> str:
        sector = (analysis.classification.primary_sector or "markets").replace("_", " ").title()
        action = self._sentiment_word(analysis.sentiment.label.value)
        return f"This story could {action} {sector} stocks first, with follow-on effects across connected assets."

    def build_beginner_summary(self, analysis: EventClassificationResult) -> str:
        sector = (analysis.classification.primary_sector or "the market").replace("_", " ")
        event_type = analysis.classification.event_type or "market-moving news"
        sentiment = analysis.sentiment.label.value
        return (
            f"Finora reads this as {event_type} news. In simple terms, it likely affects {sector} most "
            f"and the overall tone is {sentiment}, so beginners should focus on the likely ripple effect rather than jargon."
        )

    def build_brief(self, headline: str, analysis: EventClassificationResult) -> CoachBrief:
        sector = (analysis.classification.primary_sector or "markets").replace("_", " ")
        event_type = analysis.classification.event_type or "market signal"
        should_care = self.compute_should_care(analysis.signal_score)
        action_text = {
            "ignore": "Keep this on your radar only if you already hold related assets.",
            "watch": "Watch the next trading session and avoid making rushed decisions off one headline.",
            "act_cautiously": "If you hold related assets, review your exposure and wait for confirmation before reacting.",
        }[should_care]
        return CoachBrief(
            what_happened=headline,
            why_it_matters=f"Similar stories have historically moved {sector} and then spilled into linked indices or safe-haven assets.",
            what_to_do_next=action_text,
            glossary=[
                f"{event_type}: the kind of event Finora believes this headline represents.",
                f"{sector}: the part of the market most likely to react first.",
            ],
        )

    def build_graph(self, headline: str, analysis: EventClassificationResult) -> InsightGraph:
        primary_sector = analysis.classification.primary_sector or "market"
        sentiment = analysis.sentiment.label.value
        nodes = [
            GraphNode(
                id="story",
                label=headline[:64],
                kind="story",
                impact=max(0.2, analysis.signal_score),
                confidence=max(0.2, analysis.classification.confidence or 0.2),
                direction="flat",
            ),
            GraphNode(
                id=f"sector:{primary_sector}",
                label=primary_sector.replace("_", " ").title(),
                kind="sector",
                impact=max(0.2, analysis.classification.confidence or 0.2),
                confidence=max(0.2, analysis.classification.confidence or 0.2),
                direction="up" if sentiment == "positive" else "down" if sentiment == "negative" else "flat",
            ),
        ]
        edges = [
            GraphEdge(
                source="story",
                target=f"sector:{primary_sector}",
                weight=max(0.25, analysis.classification.confidence or 0.25),
                reason="Primary sector exposed to the story",
            )
        ]

        asset_impacts = (analysis.history_echo.avg_asset_impacts if analysis.history_echo else {}) or {}
        for asset_name, impact in list(asset_impacts.items())[:5]:
            asset_id = f"asset:{asset_name}"
            nodes.append(
                GraphNode(
                    id=asset_id,
                    label=asset_name.replace("_", " "),
                    kind="asset",
                    impact=min(1.0, max(0.15, abs(impact) / 5.0)),
                    confidence=max(0.15, analysis.signal_score),
                    direction="up" if impact > 0 else "down" if impact < 0 else "flat",
                )
            )
            edges.append(
                GraphEdge(
                    source=f"sector:{primary_sector}",
                    target=asset_id,
                    weight=min(1.0, max(0.2, abs(impact) / 5.0)),
                    reason=f"Historical parallels suggest {asset_name.replace('_', ' ')} reacts after {primary_sector}",
                )
            )

        return InsightGraph(nodes=nodes, edges=edges)


coach_service = CoachService()
