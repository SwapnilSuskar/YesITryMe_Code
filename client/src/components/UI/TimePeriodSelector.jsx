const TimePeriodSelector = ({
  periods = ['1day', '7days', '15days', 'month', 'alltime'],
  currentPeriod,
  onPeriodChange,
  className = '',
  buttonClassName = '',
  activeButtonClassName = 'bg-green-500 text-white',
  inactiveButtonClassName = 'bg-gray-100 text-gray-600 hover:bg-gray-200',
}) => {
  const getPeriodLabel = (period) => {
    switch (period) {
      case '1day': return '1 Day';
      case '7days': return '7 Days';
      case '15days': return '15 Days';
      case 'month': return 'Month';
      case 'alltime': return 'All Time';
      default: return period;
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => onPeriodChange(period)}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            currentPeriod === period ? activeButtonClassName : inactiveButtonClassName
          } ${buttonClassName}`}
        >
          {getPeriodLabel(period)}
        </button>
      ))}
    </div>
  );
};

export default TimePeriodSelector; 