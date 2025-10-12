import { Wallet } from 'lucide-react';
import CountUp from 'react-countup';

const UserFunds = ({
  funds,
  title = "Your Funds",
  className = '',
  cardClassName = '',
  showTitle = true,
  showTotal = true,
  gridCols = "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  loading = false,
  loadingText = "Loading funds...",
}) => {
  const fundCategories = [
    {
      key: 'mobileFund',
      label: 'Mobile Fund',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      icon: '📱'
    },
    {
      key: 'laptopFund',
      label: 'Laptop Fund',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      icon: '💻'
    },
    {
      key: 'bikeFund',
      label: 'Bike Fund',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      icon: '🏍️'
    },
    {
      key: 'carFund',
      label: 'Car Fund',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-600',
      icon: '🚗'
    },
    {
      key: 'houseFund',
      label: 'House Fund',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-600',
      icon: '🏠'
    },
    {
      key: 'travelFund',
      label: 'Travel Fund',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-600',
      icon: '✈️'
    }
  ];

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-md border border-blue-200 shadow-2xl p-8 rounded-2xl ${className}`}>
        {showTitle && (
          <h4 className="font-semibold mb-4 text-lg text-blue-600 tracking-wide flex items-center gap-3">
            <Wallet size={24} className="text-blue-500" />
            {title}
          </h4>
        )}
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">{loadingText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-md border border-blue-200 shadow-2xl p-8 rounded-2xl ${className} ${cardClassName}`}>
      {showTitle && (
        <h4 className="font-semibold mb-4 text-lg text-blue-600 tracking-wide flex items-center gap-3">
          <Wallet size={24} className="text-blue-500" />
          {title}
        </h4>
      )}
      <div className={`grid ${gridCols} gap-4`}>
        {fundCategories.map((category) => (
          <div
            key={category.key}
            className={`${category.bgColor} border ${category.borderColor} rounded-xl p-4 text-center transition-transform hover:scale-105 hover:shadow-lg`}
          >
            <div className="text-2xl mb-1">{category.icon}</div>
            <div className={`text-2xl font-bold ${category.textColor}`}>
              ₹<CountUp
                end={funds[category.key] || 0}
                duration={1.5}
                separator=","
                decimals={0}
              />
            </div>
            <div className={`text-xs ${category.textColor} font-medium`}>
              {category.label}
            </div>
          </div>
        ))}
      </div>
      {showTotal && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-700">
              ₹<CountUp
                end={funds.totalFunds || 0}
                duration={2}
                separator=","
                decimals={0}
              />
            </div>
            <div className="text-sm text-blue-600 font-medium">Total Funds</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFunds; 