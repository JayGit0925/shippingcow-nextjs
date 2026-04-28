# T10 — Calculator → DB Persistence

## State
- `DimCalculator.tsx`: sessionStorage (already fixed, survives nav + refresh)
- `audit/page.tsx`: localStorage for audit state
- No server-side persistence — results lost across devices

## Plan
1. Add `POST /api/calculator/save` (save result, returns id)
2. Add `GET /api/calculator/[id]` (load by id)
3. DimCalculator: add "Save" button → POST → show shareable link
4. Audit page: optional save to DB instead of localStorage only
5. DB: new table `calculator_results(id, user_id, input, output, created_at)`

## Defer
- Analytics from saved results (post-launch)
- Anonymous saves (needs rate limiting — post-launch)
- Share UI (post-launch)

## Effort: 90 min
