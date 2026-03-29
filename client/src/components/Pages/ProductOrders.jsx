import { ArrowLeft, Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { API_ENDPOINTS } from "../../config/api";
import { useAuthStore } from "../../store/useAuthStore";
import LoginPrompt from "../UI/LoginPrompt";

const statusLabel = {
  awaiting_payment: "Awaiting payment",
  payment_submitted: "Payment submitted",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const money = (n) =>
  (Math.round(Number(n) * 100) / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const ProductOrders = () => {
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !token) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(API_ENDPOINTS.productOrders.mine);
        setOrders(res.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, token]);

  if (!user || !token) {
    return <LoginPrompt type="default" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-16 pb-24 px-4">
      <div className="mx-auto max-w-3xl py-8">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-orange-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Shop
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">My product orders</h1>
        <p className="text-sm text-gray-600 mt-1">
          Orders are confirmed only after payment is verified by admin.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <p className="mt-8 text-red-600">{error}</p>
        ) : orders.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-orange-100 bg-white/80 p-10 text-center">
            <Package className="mx-auto h-14 w-14 text-orange-200" />
            <p className="mt-4 font-semibold text-gray-800">No orders yet</p>
            <Link
              to="/products"
              className="mt-6 inline-block text-orange-600 font-bold hover:underline"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((o) => (
              <li
                key={o._id}
                className="rounded-2xl border border-orange-100/80 bg-white/90 p-5 shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">#{o.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      o.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-800"
                        : o.status === "payment_submitted"
                          ? "bg-amber-100 text-amber-800"
                          : o.status === "awaiting_payment"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {statusLabel[o.status] || o.status}
                  </span>
                </div>
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                  {(o.items || []).map((it, i) => (
                    <li key={i}>
                      {it.title} — {it.packageName} × {it.quantity}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm border-t border-orange-50 pt-3">
                  <span>
                    Payable:{" "}
                    <strong className="tabular-nums">
                      ₹{money(o.amountPayable)}
                    </strong>
                  </span>
                  {o.coinDiscountRupees > 0 && (
                    <span className="text-orange-700">
                      Coins applied: ₹{money(o.coinDiscountRupees)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProductOrders;
