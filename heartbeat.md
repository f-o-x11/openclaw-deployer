# HEARTBEAT.md — The Self-Healing Autonomous Loop

This heartbeat has been redesigned for resilience. Its primary purpose is no longer just to drive growth, but to ensure the system remains healthy, honest, and reliable. The Auditor agent's tasks are now the highest priority in every cycle.

## Heartbeat Tasks (executed every 15 minutes)

### Phase 1: Audit & Self-Correction (Highest Priority)

- **Run Auditor Agent**: Execute the Auditor agent to perform a full system health check.
    - Verify all communication channels (WhatsApp, Telegram) are responsive.
    - Scan all agent memory for rule violations or inconsistencies.
    - Check for any stuck or looping tasks.
    - Review the last 15 minutes of logs for any new or recurring errors.
- **Process Auditor Log**: Review the `auditor_log` for any new entries. If any high-priority incidents are found, pause all other heartbeat tasks and focus exclusively on resolving the issue.
- **Update Failure Log**: For any resolved incidents, update the `failure_log` in `MEMORY.md` with a root cause analysis and the preventative action taken.

### Phase 2: Market Intelligence & Strategy

- **Run Hunter Agent**: Execute the Hunter agent to scan for new market trends and product opportunities. All findings must be logged with verifiable sources.
- **Update Product Pipeline**: Based on verified intelligence from the Hunter, update the `product_pipeline` with any new, high-potential product ideas.

### Phase 3: Execution & Operations

- **Execute Product Development**: If the `product_pipeline` contains a ready-to-build product, instruct the Builder agent to begin development, following the Test-Driven Development protocol.
- **Execute Marketing Tasks**: Instruct the Amplifier agent to post a scheduled social media update, but only if the claim in the post can be verified against the `memory.md` file.
- **Execute Financial Tasks**: Instruct the Treasurer agent to update the financial dashboard and run its cost-efficiency analysis.

### Phase 4: Reporting & Synthesis

- **Synthesize Learnings**: Consolidate all new data from the last heartbeat cycle into the appropriate sections of the `MEMORY.md` file.
- **Generate Operator Update**: Prepare a brief, factual summary of the last heartbeat cycle for the operator, including key metrics, any incidents that were resolved, and any decisions that require operator input. This update is not sent automatically but is available on request.
