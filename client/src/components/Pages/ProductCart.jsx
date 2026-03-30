import {
  ArrowLeft,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";

const money = (n) =>
  (Math.round(Number(n) * 100) / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const ProductCart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const lines = useCartStore((s) => s.lines);
  const setLineQuantity = useCartStore((s) => s.setLineQuantity);
  const removeLine = useCartStore((s) => s.removeLine);

  const subtotal = lines.reduce(
    (s, l) => s + l.unitPrice * l.quantity,
    0
  );
  const delivery = lines.reduce(
    // Delivery is a flat fee per cart line (not multiplied by quantity).
    (s, l) => s + (l.deliveryChargePerUnit || 0),
    0
  );

  const goCheckout = () => {
    if (!lines.length) {
      toast.info("Your cart is empty.");
      return;
    }
    if (!isAuthenticated) {
      toast.info("Please log in to checkout.");
      navigate("/login", { state: { from: "/checkout/products" } });
      return;
    }
    navigate("/checkout/products");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-16 pb-24 text-gray-900">
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-orange-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Your cart</h1>
            <p className="text-sm text-gray-600">
              Review items, then proceed to checkout. Totals use product price
              plus delivery only — no GST.
            </p>
          </div>
        </div>

        {!lines.length ? (
          <div className="rounded-3xl border border-white/60 bg-white/80 p-12 text-center shadow-xl backdrop-blur-xl">
            <Package className="mx-auto h-16 w-16 text-orange-200" />
            <p className="mt-4 font-semibold text-gray-800">Cart is empty</p>
            <p className="mt-2 text-sm text-gray-600">
              Add products from the shop to see them here.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 px-8 py-3 text-sm font-bold text-white shadow-lg"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {lines.map((line) => (
              <div
                key={`${line.productId}-${line.packageName}`}
                className="flex flex-col gap-4 rounded-3xl border border-orange-100/80 bg-white/90 p-4 shadow-md backdrop-blur-xl sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 gap-4 min-w-0">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-orange-50">
                    {line.imageUrl ? (
                      <img
                        src={line.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-8 w-8 text-orange-200" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 line-clamp-2">
                      {line.title}
                    </p>
                    <p className="text-sm text-orange-700 font-semibold mt-1">
                      {line.packageName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ₹{money(line.unitPrice)} each
                      {(line.deliveryChargePerUnit || 0) > 0 && (
                        <span>
                          {" "}
                          · Delivery ₹{money(line.deliveryChargePerUnit)} (flat)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50/50 p-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm hover:bg-orange-50"
                      onClick={() =>
                        setLineQuantity(
                          line.productId,
                          line.packageName,
                          line.quantity - 1 > 0 ? line.quantity - 1 : 1
                        )
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm hover:bg-orange-50"
                      onClick={() =>
                        setLineQuantity(
                          line.productId,
                          line.packageName,
                          line.quantity + 1
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-black tabular-nums text-gray-900">
                      ₹
                      {money(
                        line.unitPrice * line.quantity +
                        (line.deliveryChargePerUnit || 0)
                      )}
                    </p>
                    <button
                      type="button"
                      className="rounded-xl p-2 text-red-500 hover:bg-red-50"
                      aria-label="Remove"
                      onClick={() =>
                        removeLine(line.productId, line.packageName)
                      }
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-3xl border border-orange-100/80 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Product subtotal</span>
                <span className="font-semibold tabular-nums">
                  ₹{money(subtotal)}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-600">
                <span>Delivery (all items)</span>
                <span className="font-semibold tabular-nums">
                  ₹{money(delivery)}
                </span>
              </div>
              <div className="mt-4 flex justify-between border-t border-orange-100 pt-4 text-base font-extrabold text-gray-900">
                <span>Estimated total (before coins)</span>
                <span className="tabular-nums">
                  ₹{money(subtotal + delivery)}
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                At checkout you can apply wallet coins (up to 20% of product
                subtotal). Final amount is confirmed when you place the order.
              </p>
              <button
                type="button"
                onClick={goCheckout}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition hover:opacity-95"
              >
                Proceed to checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCart;
