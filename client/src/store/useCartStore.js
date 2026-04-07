import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Cart lines for shop checkout. Prices are snapshotted at add time; server recomputes on order create.
 */
const CART_STORAGE_NAME = "yesitryme-product-cart";

const safeParseJson = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const resolveOwnerKeyFromStorage = () => {
  try {
    const u = safeParseJson(localStorage.getItem("authUser"));
    const id = u?.userId || u?._id || u?.id;
    return id ? `user:${id}` : "guest";
  } catch {
    return "guest";
  }
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      ownerKey: resolveOwnerKeyFromStorage(),
      cartsByOwner: {},
      lines: [],

      setCartOwner: (ownerKey) => {
        const key = ownerKey || "guest";
        const carts = get().cartsByOwner || {};
        set({
          ownerKey: key,
          lines: Array.isArray(carts[key]) ? carts[key] : [],
        });
      },

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
        const ownerKey = get().ownerKey || "guest";
        const cartsByOwner = get().cartsByOwner || {};
        const lines = Array.isArray(cartsByOwner[ownerKey])
          ? cartsByOwner[ownerKey]
          : [];
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
          set({
            cartsByOwner: { ...cartsByOwner, [ownerKey]: next },
            lines: next,
          });
          return;
        }
        const next = [
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
        ];
        set({
          cartsByOwner: { ...cartsByOwner, [ownerKey]: next },
          lines: next,
        });
      },

      setLineQuantity: (productId, packageName, quantity) => {
        const q = parseInt(quantity, 10);
        if (!q || q < 1) {
          get().removeLine(productId, packageName);
          return;
        }
        const ownerKey = get().ownerKey || "guest";
        const cartsByOwner = get().cartsByOwner || {};
        const lines = Array.isArray(cartsByOwner[ownerKey])
          ? cartsByOwner[ownerKey]
          : [];
        const next = lines.map((l) =>
            l.productId === productId && l.packageName === packageName
            ? { ...l, quantity: q }
            : l
        );
        set({
          cartsByOwner: { ...cartsByOwner, [ownerKey]: next },
          lines: next,
        });
      },

      removeLine: (productId, packageName) => {
        const ownerKey = get().ownerKey || "guest";
        const cartsByOwner = get().cartsByOwner || {};
        const lines = Array.isArray(cartsByOwner[ownerKey])
          ? cartsByOwner[ownerKey]
          : [];
        const next = lines.filter(
          (l) =>
            !(l.productId === productId && l.packageName === packageName)
        );
        set({
          cartsByOwner: { ...cartsByOwner, [ownerKey]: next },
          lines: next,
        });
      },

      clearCart: () => {
        const ownerKey = get().ownerKey || "guest";
        const cartsByOwner = get().cartsByOwner || {};
        set({
          cartsByOwner: { ...cartsByOwner, [ownerKey]: [] },
          lines: [],
        });
      },

      totalQuantity: () =>
        (get().lines || []).reduce((sum, l) => sum + l.quantity, 0),
    }),
    {
      name: CART_STORAGE_NAME,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cartsByOwner: state.cartsByOwner,
      }),
      onRehydrateStorage: () => (state) => {
        try {
          const ownerKey = resolveOwnerKeyFromStorage();
          const carts = state?.cartsByOwner || {};
          state?.setCartOwner?.(ownerKey);
          // Ensure in-memory lines match persisted carts even if setCartOwner isn't available yet.
          if (state && !Array.isArray(state.lines)) {
            state.lines = Array.isArray(carts[ownerKey]) ? carts[ownerKey] : [];
          }
        } catch {
          // ignore hydration issues
        }
      },
    }
  )
);
