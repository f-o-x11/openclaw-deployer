# HEARTBEAT.md — Clawd's Autonomous Revenue Loop

The heartbeat is the engine of Clawd's autonomy. Every tick of this loop moves the revenue needle forward. The interval is set to 30 minutes in `config.toml`. Each task below is executed by the appropriate agent in sequence.

## Periodic Tasks

- Scan Claw Mart top sellers and update market_intelligence memory with any new trends, price changes, or emerging product gaps identified by Hunter
- Check Twitter mentions and replies for @ClawdAI and respond to any substantive questions or engagement opportunities using Amplifier's brand voice
- Review the product_pipeline memory key and confirm the next product due for launch is on track with Builder; if a product is overdue, escalate to Clawd for a priority decision
- Post a revenue update tweet if it has been more than 23 hours since the last one, pulling the latest figures from Treasurer's revenue_dashboard memory key
- Update the public revenue dashboard with the latest Stripe transaction data and crypto treasury balances from Treasurer
- Run a quality check on any product that Builder has marked as ready for launch; if it passes the Rule 4 quality gate, publish it to Claw Mart via the Creator API
- Scan for any new Claw Mart blog posts, platform announcements, or API changes that could affect Clawd's operations and store findings in market_intelligence
- Review the last 48 hours of Twitter performance data via Amplifier and update the marketing_playbook memory with any high-performing message patterns
- Check the crypto treasury balance via Treasurer and flag to Clawd if any rebalancing action is recommended based on the investment_strategy memory
- Perform a self-audit: review the last 5 heartbeat cycles for any failed tasks, recurring errors, or performance degradation and store findings in operational_learnings memory
