export type ServiceStatus =
  | "Received"
  | "Delivering to Workshop"
  | "Crafting"
  | "Polishing"
  | "Heading to Shop"
  | "Ready";

export const SERVICE_STATUSES: ServiceStatus[] = [
  "Received",
  "Delivering to Workshop",
  "Crafting",
  "Polishing",
  "Heading to Shop",
  "Ready",
];

export type RawAsset = {
  sku: string;
  name: string;
  metal: "Gold" | "Silver";
  weightG: number;
  karat: number;
};

export type FinishedItem = {
  sku: string;
  name: string;
  category: string;
  weightG: number;
  karat: number;
  laborCost: number;
  profit: number;
  kind: "Sellable" | "Service";
  status?: ServiceStatus;
  artisan?: string;
  customer?: string;
};

export const rawAssets: RawAsset[] = [
  { sku: "RAW-AU-001", name: "24K Gold Bar", metal: "Gold", weightG: 500, karat: 24 },
  { sku: "RAW-AU-002", name: "22K Gold Grain", metal: "Gold", weightG: 320, karat: 22 },
  { sku: "RAW-AU-003", name: "18K Gold Scrap", metal: "Gold", weightG: 210, karat: 18 },
  { sku: "RAW-AG-001", name: "Silver Ingot", metal: "Silver", weightG: 1200, karat: 24 },
  { sku: "RAW-AU-004", name: "21K Gold Coin Stock", metal: "Gold", weightG: 145, karat: 21 },
];

export const finishedItems: FinishedItem[] = [
  { sku: "FIN-RNG-101", name: "Classic Band Ring", category: "Ring", weightG: 6.4, karat: 22, laborCost: 45, profit: 30, kind: "Sellable" },
  { sku: "FIN-NCK-204", name: "Rope Chain 45cm", category: "Necklace", weightG: 14.2, karat: 21, laborCost: 90, profit: 60, kind: "Sellable" },
  { sku: "FIN-BRC-330", name: "Bangle Set (Pair)", category: "Bracelet", weightG: 22.0, karat: 22, laborCost: 140, profit: 100, kind: "Sellable" },
  { sku: "FIN-ERG-412", name: "Drop Earrings", category: "Earring", weightG: 4.8, karat: 18, laborCost: 60, profit: 40, kind: "Sellable" },
  { sku: "SRV-CST-501", name: "Custom Engagement Ring", category: "Ring", weightG: 8.1, karat: 18, laborCost: 220, profit: 150, kind: "Service", status: "Crafting", artisan: "Karim", customer: "A. Al-Farsi" },
  { sku: "SRV-RPR-502", name: "Necklace Clasp Repair", category: "Repair", weightG: 12.6, karat: 21, laborCost: 40, profit: 20, kind: "Service", status: "Polishing", artisan: "Nadia", customer: "S. Hassan" },
  { sku: "SRV-CST-503", name: "Bespoke Bangle", category: "Bracelet", weightG: 18.4, karat: 22, laborCost: 180, profit: 120, kind: "Service", status: "Delivering to Workshop", artisan: "Karim", customer: "M. Rahimi" },
  { sku: "SRV-RPR-504", name: "Chain Re-link", category: "Repair", weightG: 9.2, karat: 21, laborCost: 35, profit: 15, kind: "Service", status: "Ready", artisan: "Youssef", customer: "L. Kader" },
  { sku: "SRV-CST-505", name: "Signet Ring Resize", category: "Ring", weightG: 5.5, karat: 18, laborCost: 30, profit: 20, kind: "Service", status: "Received", artisan: "—", customer: "R. Idris" },
  { sku: "SRV-CST-506", name: "Wedding Set Polish", category: "Set", weightG: 16.0, karat: 22, laborCost: 55, profit: 35, kind: "Service", status: "Heading to Shop", artisan: "Nadia", customer: "F. Noor" },
];

export type Order = {
  id: string;
  type: "Retail" | "Investment";
  customer: string;
  items: number;
  weightG: number;
  amount: number;
  status: "Pending" | "Confirmed" | "Fulfilled";
  createdAt: string;
};

export const orders: Order[] = [
  { id: "ORD-24011", type: "Retail", customer: "Walk-in #24011", items: 2, weightG: 12.4, amount: 1420, status: "Pending", createdAt: "Today · 10:24" },
  { id: "ORD-24012", type: "Retail", customer: "S. Hassan", items: 1, weightG: 6.4, amount: 690, status: "Pending", createdAt: "Today · 11:02" },
  { id: "INV-8801", type: "Investment", customer: "Al Noor Holdings", items: 1, weightG: 500, amount: 42800, status: "Pending", createdAt: "Today · 09:15" },
  { id: "INV-8802", type: "Investment", customer: "Zafar Bullion Co.", items: 1, weightG: 250, amount: 21500, status: "Confirmed", createdAt: "Yesterday" },
  { id: "ORD-24010", type: "Retail", customer: "L. Kader", items: 3, weightG: 22.0, amount: 2380, status: "Confirmed", createdAt: "Yesterday" },
];
