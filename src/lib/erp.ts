import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables, TablesInsert } from "@/integrations/supabase/types";

export type RawAsset = Tables<"raw_assets">;
export type FinishedItem = Tables<"finished_items">;
export type Customer = Tables<"customers">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;

export type ServiceStatus = Database["public"]["Enums"]["service_status"];
export type MetalType = Database["public"]["Enums"]["metal_type"];
export type ItemKind = Database["public"]["Enums"]["item_kind"];
export type OrderChannel = Database["public"]["Enums"]["order_channel"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const SERVICE_STATUSES: ServiceStatus[] = [
  "Received",
  "Delivering to Workshop",
  "Crafting",
  "Polishing",
  "Heading to Shop",
  "Ready",
];

export const ORDER_STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Fulfilled", "Cancelled"];

export const qk = {
  rawAssets: ["raw_assets"] as const,
  finishedItems: ["finished_items"] as const,
  customers: ["customers"] as const,
  orders: ["orders"] as const,
};

function unwrap<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

/* ------------------------------- queries -------------------------------- */

export function useRawAssets() {
  return useQuery({
    queryKey: qk.rawAssets,
    queryFn: async () =>
      unwrap(await supabase.from("raw_assets").select("*").order("sku")),
  });
}

export function useFinishedItems() {
  return useQuery({
    queryKey: qk.finishedItems,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("finished_items")
          .select("*, customers(id, name)")
          .order("sku"),
      ) as (FinishedItem & { customers: { id: string; name: string } | null })[],
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: qk.customers,
    queryFn: async () => unwrap(await supabase.from("customers").select("*").order("name")),
  });
}

export function useOrders() {
  return useQuery({
    queryKey: qk.orders,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false }),
      ) as (Order & { order_items: OrderItem[] })[],
  });
}

/* ------------------------------ mutations ------------------------------- */

function useInvalidate(keys: readonly (readonly string[])[]) {
  const qc = useQueryClient();
  return () => keys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
}

export function useSaveRawAsset() {
  const invalidate = useInvalidate([qk.rawAssets]);
  return useMutation({
    mutationFn: async (input: TablesInsert<"raw_assets"> & { id?: string }) =>
      unwrap(await supabase.from("raw_assets").upsert(input).select().single()),
    onSuccess: invalidate,
  });
}

export function useDeleteRawAsset() {
  const invalidate = useInvalidate([qk.rawAssets]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("raw_assets").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useSaveFinishedItem() {
  const invalidate = useInvalidate([qk.finishedItems]);
  return useMutation({
    mutationFn: async (input: TablesInsert<"finished_items"> & { id?: string }) =>
      unwrap(await supabase.from("finished_items").upsert(input).select().single()),
    onSuccess: invalidate,
  });
}

export function useDeleteFinishedItem() {
  const invalidate = useInvalidate([qk.finishedItems]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finished_items").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateServiceStatus() {
  const invalidate = useInvalidate([qk.finishedItems]);
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ServiceStatus }) => {
      const { error } = await supabase.from("finished_items").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useSaveCustomer() {
  const invalidate = useInvalidate([qk.customers]);
  return useMutation({
    mutationFn: async (input: TablesInsert<"customers"> & { id?: string }) =>
      unwrap(await supabase.from("customers").upsert(input).select().single()),
    onSuccess: invalidate,
  });
}

export function useDeleteCustomer() {
  const invalidate = useInvalidate([qk.customers, qk.orders, qk.finishedItems]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export type NewOrderLine = {
  description: string;
  weight_g: number;
  karat: number;
  quantity: number;
  unit_price: number;
  finished_item_id?: string | null;
};

export type NewOrder = {
  channel: OrderChannel;
  customer_id: string | null;
  customer_name: string;
  gold_price: number;
  notes?: string | null;
  lines: NewOrderLine[];
};

export function useCreateOrder() {
  const invalidate = useInvalidate([qk.orders, qk.finishedItems]);
  return useMutation({
    mutationFn: async (input: NewOrder) => {
      const lines = input.lines.filter((l) => l.description.trim().length > 0);
      if (lines.length === 0) throw new Error("Add at least one line item.");

      const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
      const vat = subtotal * 0.15;
      const totalWeight = lines.reduce((s, l) => s + l.weight_g * l.quantity, 0);
      const { data: userData } = await supabase.auth.getUser();

      const order = unwrap(
        await supabase
          .from("orders")
          .insert({
            channel: input.channel,
            customer_id: input.customer_id,
            customer_name: input.customer_name || "Walk-in",
            gold_price: input.gold_price,
            total_weight_g: totalWeight,
            subtotal,
            vat,
            total: subtotal + vat,
            notes: input.notes ?? null,
            created_by: userData.user?.id ?? null,
          })
          .select()
          .single(),
      );

      const { error: linesError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          finished_item_id: l.finished_item_id ?? null,
          description: l.description,
          weight_g: l.weight_g,
          karat: l.karat,
          quantity: l.quantity,
          unit_price: l.unit_price,
          line_total: l.unit_price * l.quantity,
        })),
      );
      if (linesError) throw new Error(linesError.message);

      const soldIds = lines.map((l) => l.finished_item_id).filter(Boolean) as string[];
      if (soldIds.length > 0) {
        await supabase.from("finished_items").update({ sold: true }).in("id", soldIds);
      }

      return order;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateOrderStatus() {
  const invalidate = useInvalidate([qk.orders]);
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteOrder() {
  const invalidate = useInvalidate([qk.orders]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}
