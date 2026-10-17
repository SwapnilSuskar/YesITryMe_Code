const InfoItem = ({ icon, label, value, className = "" }) => (
  <div className={`flex items-center gap-3 py-3 ${className}`}>
    <div className="w-9 h-9 shrink-0 rounded-lg bg-orange-50 text-brand-primary flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <span className="block text-xs font-medium text-gray-500">{label}</span>
      <span className="block text-sm font-semibold text-gray-900 break-words">{value}</span>
    </div>
  </div>
);

export default InfoItem; 