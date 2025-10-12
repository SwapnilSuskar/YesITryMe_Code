const InfoItem = ({ icon, label, value, className = "" }) => (
  <div className={`flex items-center gap-4 py-4 px-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 ${className}`}>
    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-sm">
      <span className="text-orange-600">{icon}</span>
    </div>
    <div className="flex-1">
      <span className="text-gray-400 font-medium text-xs block mb-1 opacity-80">{label}</span>
      <span className="text-gray-900 font-bold text-base">{value}</span>
    </div>
  </div>
);

export default InfoItem; 