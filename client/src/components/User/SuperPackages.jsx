import { CheckCircle, Clock, Crown, Gem, Package as PackageIcon, ShoppingCart, Star, TrendingUp, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';
import SuperPackagePaymentVerificationForm from '../User/SuperPackagePaymentVerificationForm';

// Card widths shared by real cards and shimmers so the grid doesn't jump on load
const CARD_WIDTH = 'w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]';

// Indian digit grouping (1,499 / 1,00,000); falls back to the raw value if it isn't numeric
const formatINR = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : value;
};

// Shimmer component for package cards
const PackageShimmer = () => (
  <div className={`${CARD_WIDTH} flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-7 animate-pulse`}>
    {/* Icon + name + badge */}
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
        <div className="w-28 h-5 bg-gray-200 rounded"></div>
      </div>
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

const getPackageIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('booster')) return <Zap className="h-5 w-5 text-orange-500" />;
  if (lowerName.includes('bronze')) return <PackageIcon className="h-5 w-5 text-amber-600" />;
  if (lowerName.includes('silver')) return <Star className="h-5 w-5 text-gray-500" />;
  if (lowerName.includes('gold')) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (lowerName.includes('diamond')) return <Gem className="h-5 w-5 text-sky-500" />;
  return <PackageIcon className="h-5 w-5 text-gray-600" />;
};

const getPackageColor = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('booster')) return 'from-orange-500 to-red-500';
  if (lowerName.includes('bronze')) return 'from-amber-600 to-orange-600';
  if (lowerName.includes('silver')) return 'from-gray-400 to-gray-600';
  if (lowerName.includes('gold')) return 'from-yellow-400 to-yellow-600';
  if (lowerName.includes('diamond')) return 'from-blue-400 to-purple-600';
  return 'from-blue-500 to-purple-600';
};

const groupCommissionStructure = (commissionStructure) => {
  if (!commissionStructure || commissionStructure.length === 0) return [];
  const structure = [];
  // Add first 5 levels individually
  for (let i = 0; i < Math.min(5, commissionStructure.length); i++) {
    const level = commissionStructure[i];
    structure.push({
      level: level.level,
      percentage: level.percentage,
      amount: level.amount
    });
  }
  // Group levels 6-20
  if (commissionStructure.length > 5) {
    const level6to20 = commissionStructure.slice(5, 20);
    if (level6to20.length > 0) {
      structure.push({
        level: '6-20',
        percentage: level6to20[0].percentage,
        amount: level6to20[0].amount
      });
    }
  }
  // Group levels 21-120
  if (commissionStructure.length > 20) {
    const level21to120 = commissionStructure.slice(20);
    if (level21to120.length > 0) {
      structure.push({
        level: '21-120',
        percentage: level21to120[0].percentage,
        amount: level21to120[0].amount
      });
    }
  }
  return structure;
};

const SuperPackages = () => {
  const { user, token } = useAuthStore();
  const [superPackages, setSuperPackages] = useState([]);
  const [userPurchases, setUserPurchases] = useState([]);
  const [paymentVerifications, setPaymentVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    fetchSuperPackages();
    if (user && token) {
      fetchUserPurchases();
      fetchPaymentVerifications();
    }
  }, [user, token]);

  const fetchSuperPackages = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.superPackages.available);
      setSuperPackages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching super packages:', error);
      toast.error('Failed to fetch super packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPurchases = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.superPackages.purchases);
      if (response.data.success) {
        setUserPurchases(response.data.data.purchases || []);
      }
    } catch (error) {
      console.error('Error fetching user super package purchases:', error);
    }
  };

  const fetchPaymentVerifications = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.superPackages.paymentVerifications);
      if (response.data.success) {
        setPaymentVerifications(response.data.data.verifications || []);
      }
    } catch (error) {
      console.error('Error fetching super package payment verifications:', error);
    }
  };

  const handlePurchase = (pkg) => {
    setSelectedPackage(pkg);
    setShowPaymentForm(true);
    setShowDetails(false); // Close details modal if open
  };

  const getSuperPackagePurchaseCount = (superPackageId) => {
    // Convert to string for comparison (handles ObjectId)
    const packageIdStr = String(superPackageId);

    // Count verified payment verifications for this super package
    const verifiedPayments = paymentVerifications.filter(verification => {
      const verificationId = String(verification.superPackageId || verification.superPackageId?._id || '');
      return verificationId === packageIdStr && verification.status === 'verified';
    });

    // Also count active purchase records (fallback)
    const activePurchases = userPurchases.filter(purchase => {
      const purchaseId = String(purchase.superPackageId || purchase.superPackageId?._id || '');
      return purchaseId === packageIdStr && purchase.status === 'active';
    });

    // Return the higher count between verified payments and active purchases
    return Math.max(verifiedPayments.length, activePurchases.length);
  };

  const getSuperPackagePurchaseDetails = (superPackageId) => {
    // Convert to string for comparison (handles ObjectId)
    const packageIdStr = String(superPackageId);

    // Get all verified payment verifications for this super package
    const verifiedPayments = paymentVerifications.filter(verification => {
      const verificationId = String(verification.superPackageId || verification.superPackageId?._id || '');
      return verificationId === packageIdStr && verification.status === 'verified';
    });

    // Get all active purchase records (fallback)
    const activePurchases = userPurchases.filter(purchase => {
      const purchaseId = String(purchase.superPackageId || purchase.superPackageId?._id || '');
      return purchaseId === packageIdStr && purchase.status === 'active';
    });

    return {
      verifiedPayments,
      activePurchases,
      totalPurchases: Math.max(verifiedPayments.length, activePurchases.length),
      lastPurchaseDate: verifiedPayments.length > 0
        ? new Date(Math.max(...verifiedPayments.map(p => new Date(p.verifiedAt || p.createdAt))))
        : activePurchases.length > 0
          ? new Date(Math.max(...activePurchases.map(p => new Date(p.purchaseDate || p.createdAt))))
          : null
    };
  };

  const hasPendingPayment = (superPackageId) => {
    // Convert to string for comparison (handles ObjectId)
    const packageIdStr = String(superPackageId);

    return paymentVerifications.some(verification => {
      const verificationId = String(verification.superPackageId || verification.superPackageId?._id || '');
      return verificationId === packageIdStr && verification.status === 'pending';
    });
  };

  const handlePaymentSuccess = async (verificationData) => {
    // Refresh purchase list and payment verifications to update UI
    await fetchUserPurchases();
    await fetchPaymentVerifications();
    setShowPaymentForm(false);
    setSelectedPackage(null);
    toast.success('Payment verification submitted successfully!');
  };


  if (!user) return <LoginPrompt type="superPackages" />;

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-orange-50/60 to-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              Choose Your <span className="text-brand-primary">Super Package</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
              Select the perfect super package for your digital journey. Each purchase supports our multi-level referral system.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mb-14">
            {[...Array(3)].map((_, index) => (
              <PackageShimmer key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-orange-50/60 to-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
            Choose Your <span className="text-brand-primary">Super Package</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Select the perfect super package for your digital journey. Each purchase supports our multi-level referral system.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 mb-14">
          {superPackages.map((pkg, index) => {
            const commissionStructure = groupCommissionStructure(pkg.commissionStructure);
            const isBooster = pkg.name.toLowerCase().includes('booster');
            const purchaseCount = getSuperPackagePurchaseCount(pkg._id);
            const purchaseDetails = getSuperPackagePurchaseDetails(pkg._id);
            const hasPending = hasPendingPayment(pkg._id);
            const isOwned = purchaseCount > 0;
            return (
              <div
                key={pkg._id}
                className={`${CARD_WIDTH} relative flex flex-col bg-white rounded-2xl border p-6 sm:p-7 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl ${isOwned
                  ? 'border-green-300'
                  : hasPending
                    ? 'border-amber-300'
                    : 'border-gray-200'
                  }`}
              >
                {/* Icon + name + status badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {getPackageIcon(pkg.name)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isBooster && (
                      <span className="bg-orange-50 text-brand-deep px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        No Distribution
                      </span>
                    )}
                    {isOwned && (
                      <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle size={12} />
                        Purchased {purchaseCount > 1 ? `(${purchaseCount}x)` : ''}
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
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{pkg.description}</p>
                )}

                <div className="mt-6 rounded-xl bg-gray-50 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1.5 text-brand-primary" />
                    Commission Structure
                  </h4>
                  {isBooster ? (
                    <div className="text-gray-500 text-sm">No commission distribution for this package.</div>
                  ) : (
                    <div className="divide-y divide-gray-200/70">
                      {commissionStructure.map((commission, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 text-sm">
                          <span className="text-gray-600">Level {commission.level}</span>
                          <span className="font-semibold text-gray-900 tabular-nums">₹{formatINR(commission.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pinned to the bottom so buttons line up across cards */}
                <div className="mt-auto pt-6">
                  {isOwned && (
                    <div className="mb-3 px-3 py-2 bg-green-50 rounded-lg">
                      <p className="text-green-700 text-sm font-medium">
                        You own this package {purchaseCount > 1 ? `(${purchaseCount} times)` : ''}
                      </p>
                      {purchaseDetails.lastPurchaseDate && (
                        <p className="text-green-600 text-xs mt-0.5">
                          Last purchased on {purchaseDetails.lastPurchaseDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  {hasPending && !isOwned && (
                    <div className="mb-3 px-3 py-2 bg-amber-50 rounded-lg">
                      <p className="text-amber-700 text-sm font-medium">Payment verification pending</p>
                      <p className="text-amber-600 text-xs mt-0.5">
                        Your payment is being reviewed by admin
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={hasPending}
                    className={`w-full py-3 px-5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${hasPending
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                      : isOwned
                        ? 'bg-white text-brand-deep border border-brand-primary/40 hover:bg-orange-50 active:scale-[0.98]'
                        : 'bg-brand-deep hover:bg-brand-deeper text-white shadow-sm hover:shadow-md active:scale-[0.98]'
                      }`}
                  >
                    {hasPending ? (
                      <>
                        <Clock className="w-5 h-5 mr-2" />
                        Payment Pending
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {isOwned ? `Buy Again (${purchaseCount} owned)` : 'Purchase Now'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {/* Modal for package details */}
        {showDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {showDetails.name} - Details
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className={`bg-gradient-to-r ${getPackageColor(showDetails.name)} rounded-xl p-6 text-white mb-6`}>
                  <div className="flex items-center space-x-4 mb-4">
                    {getPackageIcon(showDetails.name)}
                    <div>
                      <h3 className="text-2xl font-bold">{showDetails.name}</h3>
                      <p className="text-lg opacity-90">₹{showDetails.price}</p>
                    </div>
                  </div>
                  <p className="text-white/90">{showDetails.description}</p>
                </div>
                {!showDetails.name.toLowerCase().includes('booster') && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Commission Structure</h3>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupCommissionStructure(showDetails.commissionStructure).map((commission, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="font-medium">{typeof commission.level === 'string' ? `Levels ${commission.level}` : `Level ${commission.level}`}</span>
                            <span className="font-bold text-green-600">₹{commission.amount}{commission.percentage ? ` (${commission.percentage}%)` : ''}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                          <span className="font-bold text-green-800">Total Distribution</span>
                          <span className="font-bold text-green-800">₹500</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Package Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span>120-level deep network</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span>Lifetime earning potential</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Instant activation</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <PackageIcon className="h-5 w-5 text-purple-600" />
                      <span>Premium benefits</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => handlePurchase(showDetails)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                  >
                    Buy Now - ₹{showDetails.price}
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Empty State */}
        {superPackages.length === 0 && (
          <div className="text-center py-12">
            <PackageIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No super packages available</h3>
            <p className="mt-2 text-gray-500">
              Check back later for new super packages.
            </p>
          </div>
        )}
      </div>
      {/* Payment Verification Form Modal */}
      {showPaymentForm && selectedPackage && (
        <SuperPackagePaymentVerificationForm
          packageData={selectedPackage}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedPackage(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </section>
  );
};

export default SuperPackages;
