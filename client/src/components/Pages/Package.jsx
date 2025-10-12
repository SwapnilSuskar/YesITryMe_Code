import { ArrowLeft, CheckCircle, Clock, ShoppingCart, Star, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';
import PaymentVerificationForm from '../User/PaymentVerificationForm';

// Shimmer component for package cards
const PackageShimmer = () => (
  <div className="relative bg-white rounded-2xl shadow-xl border-2 border-gray-100 animate-pulse">
    {/* Badge Shimmer - matches the badge container positioning */}
    <div className="absolute -top-4 left-0 right-0 flex justify-center items-center gap-2 px-4">
      <div className="w-32 h-8 bg-gray-200 rounded-full"></div>
    </div>

    <div className="p-8">
      {/* Header Shimmer - matches the text-center layout */}
      <div className="text-center mb-6">
        {/* Package name shimmer */}
        <div className="w-48 h-8 bg-gray-200 rounded mb-4 mx-auto"></div>
        {/* Price shimmer - larger for the big price display */}
        <div className="w-32 h-12 bg-gray-200 rounded mb-4 mx-auto"></div>
        {/* Description shimmer */}
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        {/* Purchase status shimmer (if purchased) */}
        <div className="mt-3 p-2 bg-gray-100 border border-gray-200 rounded-lg">
          <div className="w-32 h-4 bg-gray-200 rounded mx-auto"></div>
          <div className="w-24 h-3 bg-gray-200 rounded mx-auto mt-1"></div>
        </div>
      </div>

      {/* Commission Structure Shimmer - matches the exact layout */}
      <div className="mb-8">
        {/* Commission Structure title with icon */}
        <div className="flex items-center mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded mr-2"></div>
          <div className="w-40 h-5 bg-gray-200 rounded"></div>
        </div>
        {/* Commission levels */}
        <div className="space-y-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Button Shimmer - matches the gradient button */}
      <div className="w-full h-14 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

// Shimmer for commission system info - matches the exact styling
const CommissionSystemShimmer = () => (
  <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-100 animate-pulse">
    {/* Title with emoji */}
    <div className="w-64 h-8 bg-gray-200 rounded mb-6 mx-auto"></div>
    <div className="grid md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="text-center">
          {/* Icon placeholder */}
          <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
          {/* Feature title */}
          <div className="w-32 h-5 bg-gray-200 rounded mb-2 mx-auto"></div>
          {/* Feature description */}
          <div className="w-full h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const Package = () => {
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
      console.error('Error fetching packages:', error);
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
      console.error('Error fetching user purchases:', error);
    }
  };

  const fetchPaymentVerifications = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.payment.status);
      if (response.data.success) {
        setPaymentVerifications(response.data.data.verifications || []);
      }
    } catch (error) {
      console.error('Error fetching payment verifications:', error);
    }
  };

  // Map package-specific benefits (client-side rendering only)
  const getPackageBenefits = (pkgName) => {
    const name = (pkgName || '').toLowerCase();
    if (name === 'super daimond') {
      return [
        'Digital growth mastery with AI course'
      ];
    }
    if (name === 'daimond') {
      return [
        'Content mastery',
        'Social media master',
        'Graphic design',
        'Lead generation',
        'Relation building'
      ];
    }
    return [];
  };

  const getPackagePurchaseCount = (packageId) => {
    // Count verified payment verifications for this package
    const verifiedPayments = paymentVerifications.filter(verification =>
      verification.packageId === packageId && verification.status === 'verified'
    );

    // Also count active purchase records (fallback)
    const activePurchases = userPurchases.filter(purchase =>
      purchase.packageId === packageId && purchase.status === 'active'
    );

    // Return the higher count between verified payments and active purchases
    return Math.max(verifiedPayments.length, activePurchases.length);
  };

  const getPackagePurchaseDetails = (packageId) => {
    // Get all verified payment verifications for this package
    const verifiedPayments = paymentVerifications.filter(verification =>
      verification.packageId === packageId && verification.status === 'verified'
    );

    // Get all active purchase records (fallback)
    const activePurchases = userPurchases.filter(purchase =>
      purchase.packageId === packageId && purchase.status === 'active'
    );

    return {
      verifiedPayments,
      activePurchases,
      totalPurchases: Math.max(verifiedPayments.length, activePurchases.length),
      lastPurchaseDate: verifiedPayments.length > 0
        ? new Date(Math.max(...verifiedPayments.map(p => new Date(p.verifiedAt))))
        : activePurchases.length > 0
          ? new Date(Math.max(...activePurchases.map(p => new Date(p.purchaseDate))))
          : null
    };
  };

  const hasPendingPayment = (packageId) => {
    return paymentVerifications.some(verification =>
      verification.packageId === packageId && verification.status === 'pending'
    );
  };

  const handlePurchase = async (packageId, packageName) => {
    if (!user || !token) {
      setShowLoginPrompt(true);
      return;
    }

    // Show payment verification form instead of direct purchase
    const packageData = packages.find(pkg => pkg._id === packageId);
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
    if (!packageData.commissionStructure || packageData.commissionStructure.length === 0) {
      return [];
    }

    // Group commission levels for display
    const structure = [];

    // Add first 5 levels individually
    for (let i = 0; i < Math.min(5, packageData.commissionStructure.length); i++) {
      const level = packageData.commissionStructure[i];
      structure.push({
        level: level.level,
        percentage: level.percentage,
        amount: level.amount
      });
    }

    // Group levels 6-20
    if (packageData.commissionStructure.length > 5) {
      const level6to20 = packageData.commissionStructure.slice(5, 20);
      if (level6to20.length > 0) {
        structure.push({
          level: '6-20',
          percentage: level6to20[0].percentage,
          amount: level6to20[0].amount
        });
      }
    }

    // Group levels 21-120
    if (packageData.commissionStructure.length > 20) {
      const level21to120 = packageData.commissionStructure.slice(20);
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


  if (!user) {
    return <LoginPrompt type="package" />
  }

  if (loading) {
    return (
      <section id="package" className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-4">
              Choose Your <span className="text-orange-600">Package</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Select the perfect package for your digital skills journey. Each purchase supports our multi-level referral system.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {[...Array(3)].map((_, index) => (
              <PackageShimmer key={index} />
            ))}
          </div>
          <CommissionSystemShimmer />
        </div>
      </section>
    );
  }



  return (
    <section id="package" className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Product Info Banner - Show only when coming from product detail */}
        {productInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to={`/products/${productInfo._id}`}
                  className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Product
                </Link>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex items-center gap-3">
                  {productInfo.images && productInfo.images.length > 0 && (
                    <img
                      src={productInfo.images.find(img => img.isPrimary)?.url || productInfo.images[0].url}
                      alt={productInfo.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">{productInfo.title}</h3>
                    <p className="text-sm text-gray-600">{productInfo.category}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Selected Package:</div>
                <div className="font-semibold text-orange-600">
                  {productInfo.selectedPricing?.packageName || 'Choose a package'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            {productInfo ? 'Choose Package to Access' : 'Choose Your'} <span className="text-orange-600">Package</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {productInfo
              ? `Select a package to access "${productInfo.title}" and start earning commissions through our multi-level referral system.`
              : 'Select the perfect package for your digital skills journey. Each purchase supports our multi-level referral system.'
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg, index) => {
            const commissionStructure = getCommissionStructure(pkg);
            const isPopular = pkg.name === 'Super Prime Package' || pkg.name === 'Super Daimond' || pkg.name === 'Daimond';
            const purchaseCount = getPackagePurchaseCount(pkg._id);
            const purchaseDetails = getPackagePurchaseDetails(pkg._id);
            const hasPending = hasPendingPayment(pkg._id);

            return (
              <div key={pkg._id} className={`relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 ${isPopular ? 'border-orange-500 scale-105' : 'border-gray-100'} ${purchaseCount > 0 ? 'border-green-500' : hasPending ? 'border-yellow-500' : ''}`}>
                {/* Badge Container */}
                <div className="absolute -top-4 left-0 right-0 flex justify-center items-center gap-2 px-4">
                  {isPopular && (
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                      MOST POPULAR
                    </span>
                  )}
                  {purchaseCount > 0 && (
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                      PURCHASED {purchaseCount > 1 ? `(${purchaseCount}x)` : ''}
                    </span>
                  )}
                  {hasPending && purchaseCount === 0 && (
                    <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 whitespace-nowrap">
                      <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                      PENDING
                    </span>
                  )}
                </div>
                <div className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
                    <div className="text-5xl font-bold text-orange-600 mb-2">₹{pkg.price}</div>
                    <p className="text-gray-600">{pkg.description}</p>
                    {/* Package-specific benefits */}
                    {(() => {
                      const benefits = getPackageBenefits(pkg.name);
                      return benefits.length > 0 ? (
                        <div className="mt-4 text-left max-w-md mx-auto">
                          <h5 className="text-sm font-semibold text-gray-800 mb-2">Benefits included:</h5>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                            {benefits.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null;
                    })()}
                    {purchaseCount > 0 && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700 text-sm font-medium">
                          ✅ You own this package {purchaseCount > 1 ? `(${purchaseCount} times)` : ''}
                        </p>
                        {purchaseDetails.lastPurchaseDate && (
                          <p className="text-green-600 text-xs mt-1">
                            Last purchased on {purchaseDetails.lastPurchaseDate.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    {hasPending && purchaseCount === 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-700 text-sm font-medium">⏳ Payment verification pending</p>
                        <p className="text-yellow-600 text-xs mt-1">
                          Your payment is being reviewed by admin
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                      Commission Structure
                    </h4>
                    <div className="space-y-2">
                      {commissionStructure.map((commission, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Level {commission.level}:</span>
                          <span className="font-semibold text-green-600">₹{commission.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase(pkg._id, pkg.name)}
                    disabled={purchasing === pkg.name || hasPending}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center ${purchasing === pkg.name
                      ? 'bg-gray-400 cursor-not-allowed'
                      : hasPending
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover:scale-105'
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
                        {purchaseCount > 0 ? `Buy Again (${purchaseCount} owned)` : 'Purchase Now'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Commission System Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🎯 Multi-Level Referral Commission System
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Users className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-800 mb-2">120 Levels Deep</h4>
              <p className="text-gray-600">Our genealogy tree supports up to 120 levels of referrals</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Automatic Distribution</h4>
              <p className="text-gray-600">Commissions are automatically distributed to all sponsors</p>
            </div>
            <div className="text-center">
              <Star className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Real-time Tracking</h4>
              <p className="text-gray-600">Track all your earnings and transactions in real-time</p>
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
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h3>
              <p className="text-gray-600">
                You need to be logged in to purchase packages and earn commissions through our referral system.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <p className="text-orange-800 font-medium text-sm mb-1">Benefits of logging in:</p>
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
                  window.location.href = '/login';
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