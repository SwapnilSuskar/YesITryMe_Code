const DashboardCard = ({
  title,
  icon: Icon,
  iconColor = 'text-blue-500',
  borderColor = 'border-blue-100',
  bgColor = 'bg-white/80',
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
}) => {
  return (
    <div className={`max-w-6xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border ${borderColor} p-8 ${className}`}>
      {title && (
        <div className={`flex items-center gap-3 mb-4 ${headerClassName}`}>
          {Icon && <Icon size={24} className={iconColor} />}
          <h4 className="font-semibold text-lg text-gray-700 tracking-wide">{title}</h4>
        </div>
      )}
      <div className={bodyClassName}>
        {children}
      </div>
    </div>
  );
};

export default DashboardCard; 