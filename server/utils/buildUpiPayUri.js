/**
 * Builds a UPI deep link for Smart Wallet / UPI apps (no extra fees in URI).
 * Configure SMART_WALLET_UPI_VPA (payee UPI ID) and optional SMART_WALLET_MERCHANT_NAME.
 */
export function buildUpiPayUri({
  amountRupees,
  transactionNote = "",
  transactionRef = "",
}) {
  const pa =
    process.env.SMART_WALLET_UPI_VPA ||
    process.env.UPI_MERCHANT_VPA ||
    "";
  if (!pa || String(pa).trim() === "") {
    return null;
  }

  const pn = encodeURIComponent(
    process.env.SMART_WALLET_MERCHANT_NAME ||
      process.env.UPI_MERCHANT_NAME ||
      "YesITryMe"
  );
  const am = Math.max(0, Number(amountRupees) || 0).toFixed(2);
  const tn = encodeURIComponent(String(transactionNote).slice(0, 80));
  const tr = encodeURIComponent(String(transactionRef).slice(0, 35));

  return `upi://pay?pa=${encodeURIComponent(String(pa).trim())}&pn=${pn}&am=${am}&cu=INR&tn=${tn}&tr=${tr}`;
}
