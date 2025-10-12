/**
 * Generate a unique purchase ID
 * Format: PUR-YYYYMMDD-HHMMSS-RANDOM
 * @returns {string} Unique purchase ID
 */
export const generatePurchaseId = () => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  
  const timeStr = now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `PUR-${dateStr}-${timeStr}-${randomStr}`;
}; 