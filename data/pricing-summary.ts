export const pricingSummary = {
  gofo: {
    label: 'GOFO Last Mile',
    range: '1–20 lbs',
    startingFrom: 5.40,
    max: 13.10,
  },
  fedexGround: {
    label: 'FedEx Ground',
    range: '21–49 lbs',
    startingFrom: 17.00,
    max: 27.70,
  },
  fedexHeavy: {
    label: 'FedEx Heavy',
    range: '50–149 lbs',
    startingFrom: 35.10,
    max: 74.60,
  },
} as const;
