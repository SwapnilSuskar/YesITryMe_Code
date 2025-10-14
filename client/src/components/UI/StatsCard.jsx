import CountUp from 'react-countup';

const StatsCard = ({
  icon: Icon,
  iconColor = 'text-blue-500',
  title,
  value,
  prefix = '',
  suffix = '',
  borderColor = 'border-blue-100',
  textColor = 'text-blue-700',
  duration = 1.5,
  separator = ',',
  loading = false,
  loadingText = 'Loading...',
  className = '',
  onClick,
  arrowIcon: ArrowIcon,
}) => {
  const clickable = typeof onClick === 'function';
  return (
    <div
      className={`bg-white/90 rounded-xl shadow border ${borderColor} p-4 flex flex-col items-center text-center relative ${clickable ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] transition' : ''} ${className}`}
      onClick={onClick}
    >
      {Icon && <Icon size={24} className={`${iconColor} mb-2`} />}
      <span className="text-xs font-medium text-gray-600 mb-2">{title}</span>
      <span className={`text-lg font-bold ${textColor}`}>
        {loading ? (
          <span className="text-sm text-gray-400">{loadingText}</span>
        ) : (
          <CountUp 
            end={parseFloat(value) || 0} 
            duration={duration} 
            separator={separator} 
            prefix={prefix}
            suffix={suffix}
          />
        )}
      </span>
      {ArrowIcon && (
        <div className="absolute top-3 right-3 opacity-60">
          <ArrowIcon size={16} className="text-gray-500" />
        </div>
      )}
    </div>
  );
};

export default StatsCard; 