// Tunable rules for the "Gợi ý dễ thắng" (suggestions) mode. Part scores are 0..1; the total is shown as 0..100.
export const RULES = {
  // Only items in this condition are suggested ("Có hư hỏng", "Thanh lý linh kiện", "Chưa đánh giá" are left out).
  requiredStatus: 'binh_thuong',
  // Laptops/phones/tablets need a battery above this; between it and 100% the battery adds 0..1 to its part.
  minBatteryPct: 50,
  // Battery recorded as "OK" without a percentage counts as this much.
  batteryOkScore: 0.5,
  // A battery at or above this is called out as good.
  goodBatteryPct: 75,

  weights: { condition: 0.35, win: 0.35, value: 0.3 },
  // Parts of "condition"; battery and charger only apply to portable devices.
  conditionWeights: { battery: 0.6, charger: 0.2, spec: 0.2 },
  // Parts of "chance to win".
  winWeights: { bids: 0.4, bidders: 0.3, duels: 0.2, recency: 0.1 },
  // Parts of "value": price vs suggested price, price vs same-model units, CPU generation (launch date,
  // scaled from the oldest to the newest CPU in the same category; see cpuRelease.js).
  valueWeights: { suggested: 0.25, peers: 0.25, cpu: 0.5 },
  // Different bidders outbidding each other within this many minutes counts as a duel.
  duelMinutes: 10,
  // Same-model units needed before comparing specs and prices between them.
  minPeers: 3,
  // Price differences smaller than this (vs the suggested price or same-model units) aren't called out.
  priceNoticeRatio: 0.05,
  // RAM/storage within this ratio of the model's usual value counts as the same (256GB + 240GB ≈ 512GB).
  specNoticeRatio: 0.1,
};
