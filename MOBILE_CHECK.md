# Mobile CTA Check — Chat Widget v2

Widget button: `position: fixed, bottom: 1.25rem, right: 1rem, width: 52px, height: 52px, zIndex: 40`

Check each page at 375px, 414px, 768px viewport widths before merging.

---

## Pages to Check

| Page | Primary CTA | Widget Covers? | Status |
|------|------------|----------------|--------|
| `/` (Home) | "Get Free Cost Audit" hero button | ⏳ Test | Pending |
| `/calculator` | "Calculate Savings" submit button | ⏳ Test | Pending |
| `/inquiry` | Widget suppressed — n/a | ✅ N/A | Done |
| `/big-and-bulky` | "Get a Quote" CTA | ⏳ Test | Pending |
| `/dashboard/*` | Widget suppressed — n/a | ✅ N/A | Done |

---

## Instructions

1. Open Chrome DevTools → Toggle device toolbar
2. Set viewport to 375px (iPhone SE)
3. Navigate to each page
4. Check: is the 🐄 button overlapping any primary CTA?
5. Repeat at 414px (iPhone Pro Max) and 768px (iPad)
6. If overlap found: reduce `bottom` or `right` offset, or add `bottom: 5rem` on mobile

---

## Current Positioning

Mobile (`< 768px`): `bottom: 1.25rem, right: 1rem`  
Desktop (`>= 768px`): `bottom: 1.5rem, right: 1.5rem`  
z-index: 40 (below most sticky headers which are typically z-50)

---

## Known Risk

If any page has a sticky bottom CTA bar on mobile (common on /inquiry, /calculator),
widget button may overlap. Fix: increase `bottom` offset to `5rem` on mobile.
