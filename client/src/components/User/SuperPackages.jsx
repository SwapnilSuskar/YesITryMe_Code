import { CheckCircle, Crown, Package as PackageIcon, ShoppingCart, Star, TrendingUp, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';
import LoginPrompt from '../UI/LoginPrompt';
import SuperPackagePaymentVerificationForm from '../User/SuperPackagePaymentVerificationForm';

// Shimmer component for package cards
const PackageShimmer = () => (
  <div className="relative bg-white rounded-2xl shadow-xl border-2 border-gray-100 animate-pulse">
    <div className="absolute -top-4 left-0 right-0 flex justify-center items-center gap-2 px-4">
      <div className="w-32 h-8 bg-gray-200 rounded-full"></div>
    </div>
    <div className="p-8">
      <div className="text-center mb-6">
        <div className="w-48 h-8 bg-gray-200 rounded mb-4 mx-auto"></div>
        <div className="w-32 h-12 bg-gray-200 rounded mb-4 mx-auto"></div>
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="mt-3 p-2 bg-gray-100 border border-gray-200 rounded-lg">
          <div className="w-32 h-4 bg-gray-200 rounded mx-auto"></div>
          <div className="w-24 h-3 bg-gray-200 rounded mx-auto mt-1"></div>
        </div>
      </div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded mr-2"></div>
          <div className="w-40 h-5 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full h-14 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

const getPackageIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('booster')) return <Zap className="h-8 w-8 text-orange-500" />;
  if (lowerName.includes('bronze')) return <PackageIcon className="h-8 w-8 text-amber-600" />;
  if (lowerName.includes('silver')) return <Star className="h-8 w-8 text-gray-500" />;
  if (lowerName.includes('gold')) return <Crown className="h-8 w-8 text-yellow-500" />;
  if (lowerName.includes('diamond')) return <span className="h-8 w-8 ">💎</span>;
  return <PackageIcon className="h-8 w-8 text-gray-600" />;
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
  const { user } = useAuthStore()
  const [superPackages, setSuperPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    fetchSuperPackages();
  }, []);

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

  const handlePurchase = (pkg) => {
    setSelectedPackage(pkg);
    setShowPaymentForm(true);
    setShowDetails(false); // Close details modal if open
  };

  const handlePaymentSuccess = async (verificationData) => {
    // Refresh data if needed
    setShowPaymentForm(false);
    setSelectedPackage(null);
    toast.success('Payment verification submitted successfully!');
  };


  if (!user) return <LoginPrompt type="superPackages" />;

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-4">
              Choose Your <span className="text-orange-600">Super Package</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Select the perfect super package for your digital journey. Each purchase supports our multi-level referral system.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {[...Array(3)].map((_, index) => (
              <PackageShimmer key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            Choose Your <span className="text-orange-600">Super Package</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select the perfect super package for your digital journey. Each purchase supports our multi-level referral system.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {superPackages.map((pkg, index) => {
            const commissionStructure = groupCommissionStructure(pkg.commissionStructure);
            const isBooster = pkg.name.toLowerCase().includes('booster');
            return (
              <div key={pkg._id} className={`relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100`}>
                {/* Badge Container */}
                <div className="absolute -top-4 left-0 right-0 flex justify-center items-center gap-2 px-4">
                  {isBooster && (
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                      NO DISTRIBUTION
                    </span>
                  )}
                </div>
                <div className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                      {getPackageIcon(pkg.name)}
                      {pkg.name}
                    </h3>
                    <div className="text-5xl font-bold text-orange-600 mb-2">₹{pkg.price}</div>
                    <p className="text-gray-600">{pkg.description}</p>
                  </div>
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                      Commission Structure
                    </h4>
                    {isBooster ? (
                      <div className="text-gray-500 text-sm">No commission distribution for this package.</div>
                    ) : (
                      <div className="space-y-2">
                        {commissionStructure.map((commission, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Level {commission.level}:</span>
                            <span className="font-semibold text-green-600">₹{commission.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handlePurchase(pkg)}
                    className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover:scale-105"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Purchase Now
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
