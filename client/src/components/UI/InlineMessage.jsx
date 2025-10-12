import React from 'react';

const palette = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-700',
    badge: 'bg-green-600'
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-700',
    badge: 'bg-red-600'
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-700',
    badge: 'bg-blue-600'
  }
};

const InlineMessage = ({ type = 'info', message = '', onClose }) => {
  if (!message) return null;
  const theme = palette[type] || palette.info;
  return (
    <div className={`flex items-start gap-3 border rounded-xl px-4 py-3 ${theme.container}`}>
      <span className={`mt-1 inline-block w-2 h-2 rounded-full ${theme.badge}`} />
      <div className="flex-1 text-sm font-medium">{message}</div>
      {onClose && (
        <button onClick={onClose} className="ml-2 text-xs font-semibold opacity-70 hover:opacity-100">Dismiss</button>
      )}
    </div>
  );
};

export default InlineMessage;



