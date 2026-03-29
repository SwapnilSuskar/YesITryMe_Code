import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  MapPin,
  Package,
  Smartphone,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api, { API_ENDPOINTS } from "../../config/api";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";
import WalletTopUpVerificationForm from "../User/WalletTopUpVerificationForm";

const COINS_PER_RUPEE = 100;

const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

const money = (n) =>
  roundMoney(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const ProductCheckout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const userEmail = user?.email || "";
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clearCart);

  const [shipping, setShipping] = useState({
    fullName: [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim(),
    mobile: user?.mobile || "",
    pincode: "",
    address: "",
  });
  const [coinRupeesInput, setCoinRupeesInput] = useState("");
  const [walletCoins, setWalletCoins] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [paymentStep, setPaymentStep] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Please log in to checkout.");
      navigate("/login", { state: { from: "/checkout/products" } });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) return;
      setLoadingBalance(true);
      try {
        const res = await api.get(API_ENDPOINTS.coins.balance);
        setWalletCoins(res.data?.data?.balance ?? 0);
      } catch {
        setWalletCoins(0);
      } finally {
        setLoadingBalance(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const productSubtotal = useMemo(
    () =>
      roundMoney(
        lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
      ),
    [lines]
  );

  const deliveryTotal = useMemo(
    () =>
      roundMoney(
        lines.reduce(
          (s, l) => s + (l.deliveryChargePerUnit || 0) * l.quantity,
          0
        )
      ),
    [lines]
  );

  const maxCoinDiscountRupees = roundMoney(productSubtotal * 0.2);
  const maxFromWallet =
    walletCoins == null
      ? 0
      : roundMoney(walletCoins / COINS_PER_RUPEE);

  const requestedCoinRupees = roundMoney(
    Math.min(
      Math.max(0, parseFloat(coinRupeesInput) || 0),
      maxCoinDiscountRupees,
      maxFromWallet
    )
  );

  const coinDiscountRupees = requestedCoinRupees;
  const estimatedPayable = roundMoney(
    productSubtotal + deliveryTotal - coinDiscountRupees
  );

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!lines.length) {
      toast.error("Your cart is empty.");
      navigate("/cart");
      return;
    }

    if (
      !shipping.fullName?.trim() ||
      !shipping.mobile?.trim() ||
      !shipping.pincode?.trim() ||
      !shipping.address?.trim()
    ) {
      toast.error("Please fill name, mobile, pincode, and address.");
      return;
    }

    setSubmitting(true);
    try {
      const items = lines.map((l) => ({
        productId: l.productId,
        packageName: l.packageName,
        quantity: l.quantity,
      }));

      const res = await api.post(API_ENDPOINTS.productOrders.create, {
        items,
        shipping: {
          fullName: shipping.fullName.trim(),
          mobile: shipping.mobile.trim(),
          pincode: shipping.pincode.trim(),
          address: shipping.address.trim(),
        },
        coinDiscountRupees: requestedCoinRupees,
      });

      const created = res.data?.data;
      setOrder(created);
      clearCart();
      if (created?.status === "confirmed") {
        toast.success(res.data?.message || "Order confirmed.");
        setPaymentStep(false);
      } else {
        setPaymentStep(true);
        toast.success(
          res.data?.message ||
            "Order created. Complete payment using the Smart Wallet steps below."
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Could not place order"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!lines.length && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-24 px-4 text-center">
        <Package className="mx-auto h-14 w-14 text-orange-300" />
        <p className="mt-4 font-semibold text-gray-800">Nothing to checkout</p>
        <Link
          to="/cart"
          className="mt-6 inline-block text-orange-600 font-semibold hover:underline"
        >
          Go to cart
        </Link>
      </div>
    );
  }

  const showPayment =
    paymentStep &&
    order &&
    order.status === "awaiting_payment" &&
    Number(order.amountPayable) >= 0.01;

  const showFreeConfirmed = order?.status === "confirmed";

  const showSubmitted =
    order && order.status === "payment_submitted";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-16 pb-28 text-gray-900">
      <ToastContainer position="top-center" theme="colored" autoClose={3200} />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-orange-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight mb-2">
          Checkout
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Charges are only product price and delivery (per product). Wallet
          coins may reduce the total up to 20% of the product subtotal. If you
          owe a balance, payment uses the same Smart Wallet flow as{" "}
          <Link to="/recharge" className="font-semibold text-orange-600 hover:underline">
            Add Money
          </Link>
          : scan the QR, pay the exact amount, then submit details and proof for
          admin verification.
        </p>

        {showFreeConfirmed && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-8 text-center shadow-lg">
            <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
            <p className="mt-4 text-lg font-bold text-emerald-900">
              Order confirmed
            </p>
            <p className="mt-2 text-sm text-emerald-800">
              Order #{order.orderNumber}
            </p>
            <Link
              to="/my-product-orders"
              className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white"
            >
              View my orders
            </Link>
          </div>
        )}

        {showSubmitted && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/90 p-8 text-center shadow-lg">
            <p className="text-lg font-bold text-amber-900">
              Payment proof received
            </p>
            <p className="mt-2 text-sm text-amber-800">
              Order #{order.orderNumber} — waiting for admin verification. You
              will see &quot;confirmed&quot; after payment is verified.
            </p>
            <Link
              to="/my-product-orders"
              className="mt-6 inline-flex rounded-2xl bg-amber-600 px-6 py-3 text-sm font-bold text-white"
            >
              View order status
            </Link>
          </div>
        )}

        {!order && (
          <form
            onSubmit={placeOrder}
            className="space-y-8 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl sm:p-8"
          >
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600/90 mb-4">
                Delivery details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1">
                    <User className="h-3.5 w-3.5" />
                    Full name
                  </span>
                  <input
                    required
                    className="w-full rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm"
                    value={shipping.fullName}
                    onChange={(e) =>
                      setShipping((s) => ({
                        ...s,
                        fullName: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1">
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile number
                  </span>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={15}
                    className="w-full rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm"
                    value={shipping.mobile}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, mobile: e.target.value }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600 mb-1 block">
                    Pincode
                  </span>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={6}
                    pattern="\d{6}"
                    className="w-full rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm"
                    value={shipping.pincode}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, pincode: e.target.value }))
                    }
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Address
                  </span>
                  <textarea
                    required
                    rows={3}
                    className="w-full rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm"
                    value={shipping.address}
                    onChange={(e) =>
                      setShipping((s) => ({ ...s, address: e.target.value }))
                    }
                  />
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600/90 mb-2">
                Wallet coins (optional)
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                Max discount: ₹{money(maxCoinDiscountRupees)} (20% of product
                subtotal). 100 coins = ₹1. Your balance:{" "}
                {loadingBalance ? (
                  "…"
                ) : (
                  `${walletCoins ?? 0} coins (≈ ₹${money(maxFromWallet)})`
                )}
                .
              </p>
              <input
                type="number"
                min={0}
                step={0.01}
                max={maxCoinDiscountRupees}
                className="w-full max-w-xs rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm"
                placeholder="0"
                value={coinRupeesInput}
                onChange={(e) => setCoinRupeesInput(e.target.value)}
              />
              <p className="mt-2 text-xs text-gray-600">
                Applied as ₹{money(coinDiscountRupees)} off (server will
                recalculate exactly).
              </p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm">
              <div className="flex justify-between">
                <span>Product subtotal</span>
                <span className="font-semibold tabular-nums">
                  ₹{money(productSubtotal)}
                </span>
              </div>
              <div className="mt-2 flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold tabular-nums">
                  ₹{money(deliveryTotal)}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-orange-800">
                <span>Coin discount (est.)</span>
                <span className="font-semibold tabular-nums">
                  − ₹{money(coinDiscountRupees)}
                </span>
              </div>
              <div className="mt-3 flex justify-between border-t border-orange-200 pt-3 text-base font-extrabold">
                <span>Payable (est.)</span>
                <span className="tabular-nums">
                  ₹{money(Math.max(0, estimatedPayable))}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 py-4 text-base font-bold text-white shadow-lg disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
              Confirm order
            </button>
          </form>
        )}

        {showPayment && order && (
          <div className="mt-8">
            <WalletTopUpVerificationForm
              variant="productOrder"
              productOrderId={order._id}
              fixedAmount={Number(order.amountPayable)}
              orderNumber={order.orderNumber}
              initialPayer={{
                name: shipping.fullName,
                mobile: shipping.mobile,
                email: userEmail,
              }}
              embed
              onSuccess={(updated) => {
                setOrder(updated);
                setPaymentStep(false);
                toast.success(
                  "Payment proof submitted. Your order will be confirmed after admin verification."
                );
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCheckout;
