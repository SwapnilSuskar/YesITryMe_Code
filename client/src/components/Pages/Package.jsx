import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { API_ENDPOINTS } from "../../config/api";
import { useAuthStore } from "../../store/useAuthStore";
import LoginPrompt from "../UI/LoginPrompt";
import PaymentVerificationForm from "../User/PaymentVerificationForm";

// Card widths shared by real cards and shimmers so the grid doesn't jump on load
const CARD_WIDTH = "w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]";

// Indian digit grouping (1,499 / 1,00,000); falls back to the raw value if it isn't numeric
const formatINR = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : value;
};

// Daimond and Super Daimond live on the Pro Package page, not on Packages.
// The database stores both "Daimond" and "Diamond" spellings.
const PRO_PACKAGE_NAMES = ["diamond", "super diamond"];
const isProPackage = (name = "") =>
  PRO_PACKAGE_NAMES.includes(
    name
      .toLowerCase()
      .trim()
      .replace(/daimond/g, "diamond")
      .replace(/\s+package$/, ""),
  );

// Shimmer component for package cards
const PackageShimmer = () => (
  <div
    className={`${CARD_WIDTH} flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-7 animate-pulse`}
  >
    {/* Name + badge */}
    <div className="flex items-center justify-between gap-3">
      <div className="w-36 h-5 bg-gray-200 rounded"></div>
      <div className="w-16 h-5 bg-gray-100 rounded-full"></div>
    </div>
    {/* Price */}
    <div className="w-28 h-10 bg-gray-200 rounded mt-5"></div>
    {/* Description */}
    <div className="w-full h-4 bg-gray-100 rounded mt-4"></div>
    <div className="w-2/3 h-4 bg-gray-100 rounded mt-2"></div>

    {/* Commission levels */}
    <div className="mt-6 rounded-xl bg-gray-50 p-4 space-y-3">
      <div className="w-32 h-3 bg-gray-200 rounded"></div>
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="flex justify-between items-center">
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
          <div className="w-14 h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>

    {/* Button */}
    <div className="w-full h-12 bg-gray-200 rounded-xl mt-6"></div>
  </div>
);

// Shimmer for commission system info
const CommissionSystemShimmer = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 animate-pulse">
    <div className="w-64 h-6 bg-gray-200 rounded mb-6"></div>
    <div className="grid md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="flex gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0"></div>
          <div className="flex-1">
            <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-full h-4 bg-gray-100 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// variant "pro" shows only Daimond/Super Daimond; the default shows every other package
const Package = ({ variant = "standard" }) => {
  const isPro = variant === "pro";
  const { user, token, updateUserStatus, syncUserStatus } = useAuthStore();
  const location = useLocation();
  const productInfo = location.state?.productInfo;
  const [packages, setPackages] = useState([]);
  const [userPurchases, setUserPurchases] = useState([]);
  const [paymentVerifications, setPaymentVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    fetchPackages();
    if (user && token) {
      fetchUserPurchases();
      fetchPaymentVerifications();
    }
  }, [user, token]);

  const fetchPackages = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.packages.available}`);
      if (response.data.success) {
        setPackages(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPurchases = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.packages.purchases}`);
      if (response.data.success) {
        setUserPurchases(response.data.data.purchases);
      }
    } catch (error) {
      console.error("Error fetching user purchases:", error);
    }
  };

  const fetchPaymentVerifications = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.payment.status);
      if (response.data.success) {
        setPaymentVerifications(response.data.data.verifications || []);
      }
    } catch (error) {
      console.error("Error fetching payment verifications:", error);
    }
  };

  // Map package-specific benefits (client-side rendering only)
  const getPackageBenefits = (pkgName) => {
    const name = (pkgName || "").toLowerCase();
    if (name === "super daimond") {
      return ["Digital growth mastery with AI course"];
    }
    if (name === "daimond") {
      return [
        "Content mastery",
        "Social media master",
        "Graphic design",
        "Lead generation",
        "Relation building",
      ];
    }
    return [];
  };

  const getPackagePurchaseCount = (packageId) => {
    // Count verified payment verifications for this package
    const verifiedPayments = paymentVerifications.filter(
      (verification) =>
        verification.packageId === packageId &&
        verification.status === "verified",
    );

    // Also count active purchase records (fallback)
    const activePurchases = userPurchases.filter(
      (purchase) =>
        purchase.packageId === packageId && purchase.status === "active",
    );

    // Return the higher count between verified payments and active purchases
    return Math.max(verifiedPayments.length, activePurchases.length);
  };

  const getPackagePurchaseDetails = (packageId) => {
    // Get all verified payment verifications for this package
    const verifiedPayments = paymentVerifications.filter(
      (verification) =>
        verification.packageId === packageId &&
        verification.status === "verified",
    );

    // Get all active purchase records (fallback)
    const activePurchases = userPurchases.filter(
      (purchase) =>
        purchase.packageId === packageId && purchase.status === "active",
    );

    return {
      verifiedPayments,
      activePurchases,
      totalPurchases: Math.max(verifiedPayments.length, activePurchases.length),
      lastPurchaseDate:
        verifiedPayments.length > 0
          ? new Date(
              Math.max(...verifiedPayments.map((p) => new Date(p.verifiedAt))),
            )
          : activePurchases.length > 0
            ? new Date(
                Math.max(
                  ...activePurchases.map((p) => new Date(p.purchaseDate)),
                ),
              )
            : null,
    };
  };

  const hasPendingPayment = (packageId) => {
    return paymentVerifications.some(
      (verification) =>
        verification.packageId === packageId &&
        verification.status === "pending",
    );
  };

  const handlePurchase = async (packageId, packageName) => {
    if (!user || !token) {
      setShowLoginPrompt(true);
      return;
    }

    // Show payment verification form instead of direct purchase
    const packageData = packages.find((pkg) => pkg._id === packageId);
    setSelectedPackage(packageData);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = async (verificationData) => {
    // Refresh purchase list and payment verifications to update UI
    await fetchUserPurchases();
    await fetchPaymentVerifications();
    // Refresh user data to get updated activation date
    await syncUserStatus();
    setShowPaymentForm(false);
    setSelectedPackage(null);
  };

  const getCommissionStructure = (packageData) => {
    if (
      !packageData.commissionStructure ||
      packageData.commissionStructure.length === 0
    ) {
      return [];
    }

    // Group commission levels for display
    const structure = [];

    // Add first 5 levels individually
    for (
      let i = 0;
      i < Math.min(5, packageData.commissionStructure.length);
      i++
    ) {
      const level = packageData.commissionStructure[i];
      structure.push({
        level: level.level,
        percentage: level.percentage,
        amount: level.amount,
      });
    }

    // Group levels 6-20
    if (packageData.commissionStructure.length > 5) {
      const level6to20 = packageData.commissionStructure.slice(5, 20);
      if (level6to20.length > 0) {
        structure.push({
          level: "6-20",
          percentage: level6to20[0].percentage,
          amount: level6to20[0].amount,
        });
      }
    }

    // Group levels 21-120
    if (packageData.commissionStructure.length > 20) {
      const level21to120 = packageData.commissionStructure.slice(20);
      if (level21to120.length > 0) {
        structure.push({
          level: "21-120",
          percentage: level21to120[0].percentage,
          amount: level21to120[0].amount,
        });
      }
    }

    return structure;
  };

  const visiblePackages = packages.filter(
    (pkg) => isProPackage(pkg.name) === isPro,
  );
  const titleWord = isPro ? "Pro Package" : "Package";

  if (!user) {
    return <LoginPrompt type="package" />;
  }

  if (loading) {
    return (
      <section
        id="package"
        className="min-h-screen bg-gradient-to-b from-orange-50/60 to-white py-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              Choose Your <span className="text-brand-primary">{titleWord}</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
              Select the perfect package for your digital skills journey. Each
              purchase supports our multi-level referral system.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-14">
            {[...Array(isPro ? 2 : 3)].map((_, index) => (
              <PackageShimmer key={index} />
            ))}
          </div>
          <CommissionSystemShimmer />
        </div>
      </section>
    );
  }

  return (
    <section
      id="package"
      className="min-h-screen bg-gradient-to-b from-orange-50/60 to-white py-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Product Info Banner - Show only when coming from product detail */}
        {productInfo && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 min-w-0">
                <Link
                  to={`/products/${productInfo._id}`}
                  className="flex items-center gap-2 text-sm font-medium text-brand-deep hover:text-brand-deeper transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Product
                </Link>
                <div className="hidden sm:block h-8 w-px bg-gray-200"></div>
                <div className="flex items-center gap-3 min-w-0">
                  {productInfo.images && productInfo.images.length > 0 && (
                    <img
                      src={
                        productInfo.images.find((img) => img.isPrimary)?.url ||
                        productInfo.images[0].url
                      }
                      alt={productInfo.title}
                      className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {productInfo.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {productInfo.category}
                    </p>
                  </div>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Selected Package
                </div>
                <div className="font-semibold text-brand-deep">
                  {productInfo.selectedPricing?.packageName ||
                    "Choose a package"}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
            {productInfo ? "Choose Package to Access" : "Choose Your"}{" "}
            <span className="text-brand-primary">{titleWord}</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            {productInfo
              ? `Select a package to access "${productInfo.title}" and start earning commissions through our multi-level referral system.`
              : "Select the perfect package for your digital skills journey. Each purchase supports our multi-level referral system."}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-14">
          {visiblePackages.length === 0 && (
            <p className="text-gray-500">No packages available right now.</p>
          )}
          {visiblePackages.map((pkg, index) => {
            const commissionStructure = getCommissionStructure(pkg);
            const isPopular =
              pkg.name === "Super Prime Package" ||
              pkg.name === "Super Daimond" ||
              pkg.name === "Daimond";
            const purchaseCount = getPackagePurchaseCount(pkg._id);
            const purchaseDetails = getPackagePurchaseDetails(pkg._id);
            const hasPending = hasPendingPayment(pkg._id);
            const benefits = getPackageBenefits(pkg.name);
            const isOwned = purchaseCount > 0;

            return (
              <div
                key={pkg._id}
                className={`${CARD_WIDTH} relative flex flex-col bg-white rounded-2xl border p-6 sm:p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl ${
                  isOwned
                    ? "border-green-300 shadow-sm"
                    : hasPending
                      ? "border-amber-300 shadow-sm"
                      : isPopular
                        ? "border-brand-primary/40 shadow-md"
                        : "border-gray-200 shadow-sm"
                }`}
              >
                {/* Name + status badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {pkg.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isPopular && (
                      <span className="bg-orange-50 text-brand-deep px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        Most Popular
                      </span>
                    )}
                    {isOwned && (
                      <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle size={12} />
                        Purchased{" "}
                        {purchaseCount > 1 ? `(${purchaseCount}x)` : ""}
                      </span>
                    )}
                    {hasPending && !isOwned && (
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                        <Clock size={12} />
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
                  ₹{formatINR(pkg.price)}
                </div>
                {pkg.description && (
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">
                    {pkg.description}
                  </p>
                )}

                {/* Package-specific benefits */}
                {benefits.length > 0 && (
                  <div className="mt-5">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                      Benefits included
                    </h5>
                    <ul className="space-y-2">
                      {benefits.map((b, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <Check className="w-4 h-4 mt-0.5 text-brand-primary flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {commissionStructure.length > 0 && (
                  <div className="mt-6 rounded-xl bg-gray-50 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1.5 text-brand-primary" />
                      Commission Structure
                    </h4>
                    <div className="divide-y divide-gray-200/70">
                      {commissionStructure.map((commission, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-2 text-sm"
                        >
                          <span className="text-gray-600">
                            Level {commission.level}
                          </span>
                          <span className="font-semibold text-gray-900 tabular-nums">
                            ₹{formatINR(commission.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pinned to the bottom so buttons line up across cards */}
                <div className="mt-auto pt-6">
                  {isOwned && (
                    <div className="mb-3 px-3 py-2 bg-green-50 rounded-lg">
                      <p className="text-green-700 text-sm font-medium">
                        You own this package{" "}
                        {purchaseCount > 1 ? `(${purchaseCount} times)` : ""}
                      </p>
                      {purchaseDetails.lastPurchaseDate && (
                        <p className="text-green-600 text-xs mt-0.5">
                          Last purchased on{" "}
                          {purchaseDetails.lastPurchaseDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  {hasPending && !isOwned && (
                    <div className="mb-3 px-3 py-2 bg-amber-50 rounded-lg">
                      <p className="text-amber-700 text-sm font-medium">
                        Payment verification pending
                      </p>
                      <p className="text-amber-600 text-xs mt-0.5">
                        Your payment is being reviewed by admin
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => handlePurchase(pkg._id, pkg.name)}
                    disabled={purchasing === pkg.name || hasPending}
                    className={`w-full py-3 px-5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                      purchasing === pkg.name
                        ? "bg-gray-300 text-white cursor-not-allowed"
                        : hasPending
                          ? "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed"
                          : isOwned
                            ? "bg-white text-brand-deep border border-brand-primary/40 hover:bg-orange-50 active:scale-[0.98]"
                            : "bg-brand-deep hover:bg-brand-deeper text-white shadow-sm hover:shadow-md active:scale-[0.98]"
                    }`}
                  >
                    {purchasing === pkg.name ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : hasPending ? (
                      <>
                        <Clock className="w-5 h-5 mr-2" />
                        Payment Pending
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {isOwned
                          ? `Buy Again (${purchaseCount} owned)`
                          : "Purchase Now"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Commission System Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Multi-Level Referral Commission System
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  120 Levels Deep
                </h4>
                <p className="text-sm text-gray-500">
                  Our genealogy tree supports up to 120 levels of referrals
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Automatic Distribution
                </h4>
                <p className="text-sm text-gray-500">
                  Commissions are automatically distributed to all sponsors
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Real-time Tracking
                </h4>
                <p className="text-sm text-gray-500">
                  Track all your earnings and transactions in real-time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} className="text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Login Required
              </h3>
              <p className="text-gray-600">
                You need to be logged in to purchase packages and earn
                commissions through our referral system.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <p className="text-orange-800 font-medium text-sm mb-1">
                    Benefits of logging in:
                  </p>
                  <ul className="text-orange-700 text-sm space-y-1">
                    <li>• Purchase packages and earn commissions</li>
                    <li>• Build your referral network</li>
                    <li>• Track your earnings in real-time</li>
                    <li>• Access exclusive member features</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  window.location.href = "/login";
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-colors font-medium"
              >
                Login Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Verification Form Modal */}
      {showPaymentForm && selectedPackage && (
        <PaymentVerificationForm
          packageData={selectedPackage}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedPackage(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* User Status Indicator */}
      {!user && (
        <div className="fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg z-40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Guest User</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default Package;
