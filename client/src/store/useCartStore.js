import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Cart lines for shop checkout. Prices are snapshotted at add time; server recomputes on order create.
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      lines: [],

      addLine: ({
        productId,
        title,
        imageUrl,
        packageName,
        unitPrice,
        deliveryChargePerUnit = 0,
        quantity = 1,
      }) => {
        const qty = Math.max(1, parseInt(quantity, 10) || 1);
        const lines = get().lines;
        const idx = lines.findIndex(
          (l) =>
            l.productId === productId && l.packageName === packageName
        );
        if (idx >= 0) {
          const next = [...lines];
          next[idx] = {
            ...next[idx],
            quantity: next[idx].quantity + qty,
          };
          set({ lines: next });
          return;
        }
        set({
          lines: [
            ...lines,
            {
              productId,
              title: title || "Product",
              imageUrl: imageUrl || "",
              packageName,
              unitPrice: Number(unitPrice) || 0,
              deliveryChargePerUnit: Number(deliveryChargePerUnit) || 0,
              quantity: qty,
            },
          ],
        });
      },

      setLineQuantity: (productId, packageName, quantity) => {
        const q = parseInt(quantity, 10);
        if (!q || q < 1) {
          get().removeLine(productId, packageName);
          return;
        }
        set({
          lines: get().lines.map((l) =>
            l.productId === productId && l.packageName === packageName
              ? { ...l, quantity: q }
              : l
          ),
        });
      },

      removeLine: (productId, packageName) => {
        set({
          lines: get().lines.filter(
            (l) =>
              !(
                l.productId === productId &&
                l.packageName === packageName
              )
          ),
        });
      },

      clearCart: () => set({ lines: [] }),

      totalQuantity: () =>
        get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    {
      name: "yesitryme-product-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
