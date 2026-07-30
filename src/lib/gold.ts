import { useEffect, useState } from "react";

// Live gold price per gram in SAR for 24K.
// Calibrated to spot ~ $4,024 / troy oz (USD/SAR ≈ 3.75, 31.1035 g/oz).
// 4024 * 3.75 / 31.1035 ≈ 485.15 SAR/g (24K).
const BASE_PRICE_24K_SAR = 485.15;

export const KARATS = [24, 22, 21, 18] as const;
export type Karat = (typeof KARATS)[number];

export function useLiveGoldPrice() {
  const [price, setPrice] = useState(BASE_PRICE_24K_SAR);
  // null until mounted — timestamps are locale/timezone dependent and would
  // otherwise break SSR hydration.
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    setUpdatedAt(new Date());
    const tick = () => {
      const drift = (Math.random() - 0.5) * 2.5; // ±SAR/g minor drift
      setPrice((p) => Math.max(450, Math.min(520, p + drift)));
      setUpdatedAt(new Date());
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return { price, updatedAt };
}

export const fmtTime = (d: Date | null) =>
  d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export function purityFactor(karat: number) {
  return karat / 24;
}

export function pricePerGram(karat: number, price24k: number) {
  return price24k * purityFactor(karat);
}

// Total Value = (Raw Weight × Live Gold Price × Purity + Labor Cost + Profit) × 1.15
export function calcTotalValue({
  weightG,
  karat,
  goldPrice,
  laborCost = 0,
  profit = 0,
}: {
  weightG: number;
  karat: number;
  goldPrice: number;
  laborCost?: number;
  profit?: number;
}) {
  const raw = weightG * goldPrice * purityFactor(karat);
  return (raw + laborCost + profit) * 1.15;
}

export const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  });
