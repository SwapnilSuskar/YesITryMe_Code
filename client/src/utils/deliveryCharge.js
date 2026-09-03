import { useEffect, useState } from "react";
import { api } from "../config/api";

/** Matches FLAT_DELIVERY_CHARGE_DEFAULT in productOrderController.js. */
export const FLAT_DELIVERY_CHARGE_FALLBACK = 75;

/**
 * Delivery pricing, mirrored from the server so cart and checkout show the
 * amount the order will actually be charged. The server recomputes on order
 * create and stays authoritative — this is display only.
 *
 * Rule: one flat charge per order, regardless of how many products or units
 * the order contains. A product's own deliveryCharge does not affect it.
 */
export const computeDeliveryTotal = (lines, flatDeliveryCharge) => {
  if (!Array.isArray(lines) || lines.length === 0) return 0;
  const flat = Number(flatDeliveryCharge);
  if (!Number.isFinite(flat) || flat < 0) return 0;
  return flat;
};

/**
 * Reads the flat delivery charge from the server. Uses the same default the
 * server falls back to, so the estimate stays right if the request is still in
 * flight or fails.
 */
export const useFlatDeliveryCharge = () => {
  const [flatDeliveryCharge, setFlatDeliveryCharge] = useState(
    FLAT_DELIVERY_CHARGE_FALLBACK
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get("/api/product-orders/config");
        if (cancelled) return;
        const value = Number(res?.data?.config?.flatDeliveryCharge);
        if (Number.isFinite(value) && value >= 0) setFlatDeliveryCharge(value);
      } catch {
        // Keep the default — it matches the server's own fallback.
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return flatDeliveryCharge;
};
