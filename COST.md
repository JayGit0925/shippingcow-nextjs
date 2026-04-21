# Chat Widget v2 — API Cost Projection

## Model Routing

| Call | Model | When | Tokens In | Tokens Out |
|------|-------|------|-----------|------------|
| Reply | claude-sonnet-4-6 | Every user message | ~1,500 avg | 500 max |
| Scoring | claude-haiku-4-5-20251001 | Every user message | ~150 | 100 |
| Summary (history) | claude-haiku-4-5-20251001 | Returning email users only | ~500 | 150 |

## Anthropic Pricing (as of April 2025)

| Model | Input $/M tokens | Output $/M tokens |
|-------|-----------------|-------------------|
| claude-sonnet-4-6 | $3.00 | $15.00 |
| claude-haiku-4-5-20251001 | $0.80 | $4.00 |

## Per-Message Cost

| Call | Input cost | Output cost | Total |
|------|-----------|------------|-------|
| Sonnet reply | 1,500 × $3/M = $0.0045 | 300 × $15/M = $0.0045 | $0.009 |
| Haiku score | 150 × $0.80/M = $0.00012 | 100 × $4/M = $0.0004 | ~$0.0005 |
| **Per message total** | | | **~$0.0095** |

## Monthly Projections

| Sessions/mo | Avg msgs/session | Total messages | Est. cost |
|-------------|-----------------|----------------|-----------|
| 100 | 5 | 500 | ~$4.75 |
| 500 | 5 | 2,500 | ~$23.75 |
| 1,000 | 5 | 5,000 | ~$47.50 |
| 2,000 | 5 | 10,000 | ~$95.00 |
| 5,000 | 5 | 25,000 | ~$237.50 |

**At 1,000 sessions/month: ~$47.50/mo** — well under $150 budget.

## Cost Levers

- Rate limit at 20 msg/session caps worst case per session at $0.19
- Haiku for scoring is 20× cheaper than Sonnet — keep scoring on Haiku
- KB injection adds ~400 tokens to Sonnet input per message (~$0.0012 extra) — worth it for grounding

## Build Test Cost

Estimate 100 test messages:
- 100 × $0.0095 = **$0.95 total**
- Well within $30 build budget

## TODO

- [ ] Log actual API cost from Anthropic dashboard after 100-message test run
- [ ] Update projections with real avg token counts from first 7 days of production data
