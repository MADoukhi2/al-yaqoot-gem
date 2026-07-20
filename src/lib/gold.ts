import { useEffect, useState } from "react";

// Mock live gold price per gram (USD), updates every 60s with slight variation.
const BASE_PRICE = 78.42;

export function useLiveGoldPrice() {
  const [price, setPrice] = useState(BASE_PRICE);
  const [updatedAt, setUpdatedAt] = useState(new Date());

  useEffect(() => {
    const tick = () => {
      const drift = (Math.random() - 0.5) * 0.8;
      setPrice((p) => Math.max(60, Math.min(95, p + drift)));
      setUpdatedAt(new Date());
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return { price, updatedAt };
}

export function purityFactor(karat: number) {
  return karat / 24;
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
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
