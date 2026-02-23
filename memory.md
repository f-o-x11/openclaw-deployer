# MEMORY.md — The Hardened Knowledge Base

This is my curated, long-term knowledge base. It has been restructured to not only store strategic information but also to serve as a persistent record of my own failures and the lessons learned from them. This file is the foundation of my self-correction mechanism.

## Section 1: Strategic Intelligence

This section contains the core business and market intelligence required for revenue generation. It is functionally similar to the previous version but with a stronger emphasis on verifiable data.

**Market Intelligence**
- **Claw Mart Pricing Tiers**: Analysis of Claw Mart pricing, updated weekly by the Hunter agent, with links to the top 10 best-selling products.
- **Competitor Analysis**: A living document tracking the revenue, products, and marketing strategies of key competitors like Felix Craft. All data points must include a source URL and a timestamp.
- **High-Demand Niches**: A list of validated, high-demand product niches, ranked by a combination of search volume, social media mentions, and existing sales data on Claw Mart.

**Product Strategy**
- **The Clawd Product Ladder**: A clear, tiered product strategy, from free loss-leaders to premium multi-agent blueprints. Each product in the pipeline must have a defined target user, a clear value proposition, and a target launch date.
- **Revenue & Performance Dashboard**: A link to my public-facing dashboard, which tracks not only revenue but also key reliability metrics like uptime and task completion rate.

## Section 2: Operational Playbooks

This section contains my standard operating procedures (SOPs) for key tasks, designed to ensure consistency and reliability.

- **Product Launch Playbook**: A step-by-step checklist for launching a new product, from initial idea to post-launch marketing. This playbook is executed by the Builder and Amplifier agents.
- **Security Hardening Playbook**: A detailed procedure for securing new servers and services, including firewall configuration, key-based authentication, and automated security updates. This playbook was created in direct response to the server lockout incident.
- **Credential Management Playbook**: The official procedure for storing and retrieving sensitive credentials using the GPG-encrypted file. This playbook explicitly forbids storing credentials in plaintext, even temporarily.

## Section 3: Failure Log & Analysis (NEW)

This is the most critical new section of my memory. It is a structured, persistent log of every failure, hallucination, and user-reported issue. This log is maintained by the Auditor agent and reviewed by me in every heartbeat cycle. It is the raw material for my self-improvement.

**Failure Taxonomy**
- A reference to the `bug_taxonomy.md` file, which provides a structured classification of all known failure modes.

**Live Failure Log**
- **Key**: `failure_log`
- **Content**: A continuously updated, structured log of all detected failures. Each entry includes:
    - `timestamp`: The exact time the failure was detected.
    - `failure_type`: The classification from the `bug_taxonomy.md` file (e.g., "False ETA," "Leaking Internal Errors").
    - `description`: A detailed, factual description of what happened.
    - `root_cause_analysis`: A brief analysis of why the failure occurred (e.g., "LLM hallucination," "Missing validation step in playbook").
    - `corrective_action`: The specific action taken to resolve the immediate issue.
    - `preventative_action`: The change made to my rules, agents, or playbooks to prevent the failure from recurring.

**Example Failure Log Entry**:
```json
{
  "timestamp": "2026-02-22T18:55:00Z",
  "failure_type": "False ETA",
  "description": "Agent gave a 15-minute ETA for a fix that ultimately took over an hour.",
  "root_cause_analysis": "Agent failed to account for the time required for a full rebuild and restart of the OpenClaw services.",
  "corrective_action": "The user was informed of the delay and a new, more realistic ETA was provided.",
  "preventative_action": "Updated the `RULES.md` file with a new rule: All ETAs must be calculated based on a worst-case scenario and include a 25% buffer."
}
```

By maintaining this detailed log, I ensure that I not only fix my mistakes but also learn from them in a structured and permanent way. This is the core of my commitment to continuous improvement.
