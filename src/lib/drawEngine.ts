import { env } from "@/lib/env";
import { normalizeToMonthlyValue } from "@/lib/utils";

type SubscriberEntry = {
  userId: string;
  planType: "monthly" | "yearly";
  numbers: number[];
};

type Winner = {
  userId: string;
  tier: 3 | 4 | 5;
  matchCount: 3 | 4 | 5;
  amount: number;
};

export type DrawExecutionResult = {
  drawNumbers: number[];
  winners: Winner[];
  prizePools: {
    tier5: number;
    tier4: number;
    tier3: number;
  };
  nextJackpotRollover: number;
};

function randomUniqueNumbers(count: number, min = 1, max = 45) {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  const out: number[] = [];

  while (out.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const pick = pool.splice(idx, 1)[0];
    out.push(pick);
  }

  return out.sort((a, b) => a - b);
}

function weightedNumbers(entries: SubscriberEntry[], count = 5) {
  const frequency = new Map<number, number>();

  for (const entry of entries) {
    for (const n of entry.numbers) {
      frequency.set(n, (frequency.get(n) ?? 0) + 1);
    }
  }

  const weightedPool = Array.from({ length: 45 }, (_, i) => i + 1).map((n) => {
    const f = frequency.get(n) ?? 1;
    return { n, weight: f + 1 };
  });

  const selected = new Set<number>();
  while (selected.size < count) {
    const total = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    let cursor = Math.random() * total;

    for (const item of weightedPool) {
      cursor -= item.weight;
      if (cursor <= 0) {
        selected.add(item.n);
        break;
      }
    }
  }

  return Array.from(selected).sort((a, b) => a - b);
}

export function executeDraw(
  entries: SubscriberEntry[],
  mode: "random" | "weighted",
  currentJackpotRollover: number,
): DrawExecutionResult {
  const drawNumbers = mode === "random" ? randomUniqueNumbers(5) : weightedNumbers(entries, 5);

  const activeMonthlyValue = entries.reduce((sum, e) => {
    return sum + normalizeToMonthlyValue(e.planType, env.monthlyPlanPrice, env.yearlyPlanPrice);
  }, 0);

  const totalPool = activeMonthlyValue;
  const tier5PoolBase = totalPool * 0.4 + currentJackpotRollover;
  const tier4Pool = totalPool * 0.35;
  const tier3Pool = totalPool * 0.25;

  const matched = entries
    .map((entry) => {
      const count = entry.numbers.filter((n) => drawNumbers.includes(n)).length;
      return { userId: entry.userId, matchCount: count };
    })
    .filter((entry) => entry.matchCount >= 3);

  const tier5Winners = matched.filter((x) => x.matchCount === 5);
  const tier4Winners = matched.filter((x) => x.matchCount === 4);
  const tier3Winners = matched.filter((x) => x.matchCount === 3);

  const winners: Winner[] = [];

  for (const winner of tier5Winners) {
    winners.push({
      userId: winner.userId,
      tier: 5,
      matchCount: 5,
      amount: tier5PoolBase / tier5Winners.length,
    });
  }

  for (const winner of tier4Winners) {
    winners.push({
      userId: winner.userId,
      tier: 4,
      matchCount: 4,
      amount: tier4Pool / tier4Winners.length,
    });
  }

  for (const winner of tier3Winners) {
    winners.push({
      userId: winner.userId,
      tier: 3,
      matchCount: 3,
      amount: tier3Pool / tier3Winners.length,
    });
  }

  const nextJackpotRollover = tier5Winners.length === 0 ? tier5PoolBase : 0;

  return {
    drawNumbers,
    winners,
    prizePools: {
      tier5: tier5PoolBase,
      tier4: tier4Pool,
      tier3: tier3Pool,
    },
    nextJackpotRollover,
  };
}
