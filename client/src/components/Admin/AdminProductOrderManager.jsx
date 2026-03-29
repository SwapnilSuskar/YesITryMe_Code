import {
  CheckCircle,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Package,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api, { API_ENDPOINTS } from "../../config/api";

const money = (n) =>
  (Math.round(Number(n) * 100) / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

/** Section config: label, description, card shell classes */
const STATUS_SECTIONS = {
  payment_submitted: {
    title: "Pending verification",
    subtitle:
      "User uploaded payment proof — review the screenshot, then verify or reject.",
    sectionClass:
      "border-amber-200 bg-amber-50/40 ring-1 ring-amber-100/80",
    cardClass:
      "border-amber-200 bg-white shadow-sm hover:shadow-md",
    badgeClass: "bg-amber-100 text-amber-900 border border-amber-200",
  },
  awaiting_payment: {
    title: "Awaiting payment",
    subtitle: "Order created — user has not submitted payment proof yet.",
    sectionClass:
      "border-slate-200 bg-slate-50/50 ring-1 ring-slate-100",
    cardClass:
      "border-slate-200 bg-white shadow-sm",
    badgeClass: "bg-slate-100 text-slate-800 border border-slate-200",
  },
  confirmed: {
    title: "Verified & confirmed",
    subtitle: "Payment was approved — order is complete.",
    sectionClass:
      "border-emerald-200 bg-emerald-50/30 ring-1 ring-emerald-100",
    cardClass:
      "border-emerald-200 bg-white shadow-sm",
    badgeClass: "bg-emerald-100 text-emerald-900 border border-emerald-200",
  },
  rejected: {
    title: "Rejected",
    subtitle: "Payment proof was not accepted — user may need to place a new order.",
    sectionClass:
      "border-red-200 bg-red-50/40 ring-1 ring-red-100",
    cardClass:
      "border-red-200 bg-white shadow-sm",
    badgeClass: "bg-red-100 text-red-900 border border-red-200",
  },
  cancelled: {
    title: "Cancelled",
    subtitle: "Order was cancelled and is not active.",
    sectionClass:
      "border-gray-300 bg-gray-50/60 ring-1 ring-gray-100",
    cardClass:
      "border-gray-200 bg-white shadow-sm",
    badgeClass: "bg-gray-200 text-gray-800 border border-gray-300",
  },
};

const SECTION_ORDER = [
  "payment_submitted",
  "awaiting_payment",
  "confirmed",
  "rejected",
  "cancelled",
];

function OrderCard({
  o,
  onVerify,
  onReject,
  onDelete,
  actionId,
  deleteId,
  onPreviewScreenshot,
  variantClass,
}) {
  const busy = actionId === o._id || deleteId === o._id;
  const hasProof = Boolean(o.paymentProofUrl);

  return (
    <div
      className={`rounded-2xl border-2 p-5 sm:p-6 ${variantClass}`}
    >
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="font-bold text-lg text-gray-900">#{o.orderNumber}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            User: {o.userId} · {new Date(o.createdAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full ${STATUS_SECTIONS[o.status]?.badgeClass || "bg-gray-100 text-gray-800"}`}
        >
          {o.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="text-sm text-gray-700 space-y-1 mb-3">
        {(o.items || []).map((it, i) => (
          <div key={i}>
            {it.title} — {it.packageName} × {it.quantity} @ ₹
            {money(it.unitPrice)}
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-sm border-t border-gray-100/80 pt-3">
        <p>
          <span className="text-gray-500">Payable:</span>{" "}
          <strong>₹{money(o.amountPayable)}</strong>
        </p>
        <p>
          <span className="text-gray-500">Coin discount:</span> ₹
          {money(o.coinDiscountRupees)} ({o.coinsApplied || 0} coins)
        </p>
        <p className="sm:col-span-2">
          <span className="text-gray-500">Shipping:</span>{" "}
          {o.shipping?.fullName}, {o.shipping?.mobile},{" "}
          {o.shipping?.pincode} — {o.shipping?.address}
        </p>
        {o.transactionId && (
          <p className="sm:col-span-2">
            <span className="text-gray-500">UTR / Txn:</span>{" "}
            <span className="font-mono text-gray-900">{o.transactionId}</span>
          </p>
        )}
        {o.verifiedAt && (
          <p className="sm:col-span-2 text-xs text-gray-600">
            Processed: {new Date(o.verifiedAt).toLocaleString()}
            {o.verifiedBy ? ` · by ${o.verifiedBy}` : ""}
          </p>
        )}
        {o.status === "rejected" && o.rejectionReason && (
          <p className="sm:col-span-2 text-sm text-red-800 bg-red-50/80 rounded-lg px-3 py-2 border border-red-100">
            <span className="font-semibold text-red-900">Reason: </span>
            {o.rejectionReason}
          </p>
        )}
        {o.adminNotes && (
          <p className="sm:col-span-2 text-xs text-gray-600">
            <span className="font-semibold">Admin notes: </span>
            {o.adminNotes}
          </p>
        )}
      </div>

      {hasProof && (
        <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
            Payment screenshot
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPreviewScreenshot(o.paymentProofUrl)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 shadow-sm"
            >
              <ImageIcon className="w-4 h-4" />
              View payment screenshot
            </button>
            <a
              href={o.paymentProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-orange-200 text-orange-800 text-sm font-semibold hover:bg-orange-50"
            >
              <ExternalLink className="w-4 h-4" />
              Open in new tab
            </a>
          </div>
        </div>
      )}

      {o.status === "payment_submitted" && (
        <div className="mt-5 pt-5 border-t-2 border-amber-200/80">
          <p className="text-xs font-bold text-amber-900 mb-3 uppercase tracking-wide">
            Actions — verify payment or reject
          </p>
          <div className="flex flex-col sm:flex-row sm:items-stretch gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onVerify(o._id)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-md"
            >
              {actionId === o._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              Verify & confirm order
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onReject(o._id)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-red-300 text-red-700 text-sm font-bold hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              Reject payment
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-gray-200">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Record management
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(o._id)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-200 bg-red-50/50 text-red-800 text-sm font-bold hover:bg-red-100 disabled:opacity-50"
        >
          {deleteId === o._id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Delete order record
        </button>
        <p className="text-xs text-gray-500 mt-2 max-w-xl">
          Removes this order from the database. Stored payment screenshots are
          deleted when possible. Coin deductions already applied are not reversed
          automatically.
        </p>
      </div>
    </div>
  );
}

const AdminProductOrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("payment_submitted");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs =
        filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
      const res = await api.get(`${API_ENDPOINTS.adminProductOrders.list}${qs}`);
      setOrders(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const verify = async (id) => {
    setActionId(id);
    try {
      await api.patch(API_ENDPOINTS.adminProductOrders.verify(id), {});
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id) => {
    const reason = window.prompt("Rejection reason (optional):") || "";
    setActionId(id);
    try {
      await api.patch(API_ENDPOINTS.adminProductOrders.reject(id), {
        rejectionReason: reason,
      });
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionId(null);
    }
  };

  const removeOrder = async (id) => {
    if (
      !window.confirm(
        "Permanently delete this order record?\n\nThe payment screenshot will be removed from storage when possible. This cannot be undone.\n\nNote: If this order was already confirmed, any coin deduction that was applied is not reversed automatically."
      )
    ) {
      return;
    }
    setDeleteId(id);
    try {
      await api.delete(API_ENDPOINTS.adminProductOrders.delete(id));
      await fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const groupedSections = useMemo(() => {
    if (filter !== "all") return null;
    const buckets = {
      payment_submitted: [],
      awaiting_payment: [],
      confirmed: [],
      rejected: [],
      cancelled: [],
    };
    for (const o of orders) {
      if (buckets[o.status]) buckets[o.status].push(o);
    }
    return SECTION_ORDER.map((status) => ({
      status,
      items: buckets[status] || [],
      config: STATUS_SECTIONS[status],
    })).filter((g) => g.items.length > 0);
  }, [orders, filter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/30 py-12 px-4 mt-12">
      {screenshotPreview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Payment screenshot preview"
          onClick={() => setScreenshotPreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <span className="font-bold text-gray-800 text-sm">
                Payment screenshot
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={screenshotPreview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-orange-600 hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open full size
                </a>
                <button
                  type="button"
                  onClick={() => setScreenshotPreview(null)}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-600"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-auto p-4 bg-neutral-900/5 flex justify-center items-start min-h-[200px]">
              <img
                src={screenshotPreview}
                alt="Payment proof"
                className="max-w-full max-h-[calc(90vh-8rem)] object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                <Package className="w-7 h-7 text-orange-500" />
                Product orders
              </h1>
              <p className="text-gray-600 mt-2 text-sm">
                Pending items need screenshot review. Confirmed and rejected are
                grouped separately when you choose &quot;All&quot;.
              </p>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold bg-white"
            >
              <option value="payment_submitted">Pending verification</option>
              <option value="awaiting_payment">Awaiting payment</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All (grouped by status)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 text-red-600 text-sm font-medium">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-gray-300 bg-white/60">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No orders in this view.</p>
            <p className="text-sm text-gray-500 mt-1">
              Try another filter or &quot;All&quot; to see every bucket.
            </p>
          </div>
        ) : filter === "all" && groupedSections ? (
          <div className="space-y-10">
            {groupedSections.map(({ status, items, config }) => (
              <section
                key={status}
                className={`rounded-2xl p-5 sm:p-6 ${config.sectionClass}`}
              >
                <div className="mb-4">
                  <h2 className="text-lg font-extrabold text-gray-900">
                    {config.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{config.subtitle}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-2">
                    {items.length} {items.length === 1 ? "order" : "orders"}
                  </p>
                </div>
                <div className="space-y-4">
                  {items.map((o) => (
                    <OrderCard
                      key={o._id}
                      o={o}
                      onVerify={verify}
                      onReject={reject}
                      onDelete={removeOrder}
                      actionId={actionId}
                      deleteId={deleteId}
                      onPreviewScreenshot={setScreenshotPreview}
                      variantClass={config.cardClass}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <OrderCard
                key={o._id}
                o={o}
                onVerify={verify}
                onReject={reject}
                onDelete={removeOrder}
                actionId={actionId}
                deleteId={deleteId}
                onPreviewScreenshot={setScreenshotPreview}
                variantClass={
                  STATUS_SECTIONS[o.status]?.cardClass ||
                  "border-gray-200 bg-white shadow-md"
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductOrderManager;
