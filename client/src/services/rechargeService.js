import api, { API_ENDPOINTS } from '../config/api.js';

/**
 * Fetch recharge plans from aiTopUp API (Prepaid only)
 */
export const fetchRechargePlans = async (
  mobileNumber,
  operator,
  circle,
  rechargeType = 'prepaid',
  extraParams = {}
) => {
  // Only allow prepaid plans
  if (rechargeType === 'postpaid') {
    throw new Error('Plans are only available for prepaid recharges. Use fetch bill for postpaid.');
  }
  
  try {
    const params = {
        mobileNumber,
        operator,
        rechargeType: 'prepaid', // Force prepaid
    };

    if (circle) {
      params.circle = circle;
    }
    if (extraParams.circleLabel) {
      params.circleLabel = extraParams.circleLabel;
    }
    if (extraParams.circleCode) {
      params.circleCode = extraParams.circleCode;
    }
    if (extraParams.circleNumeric) {
      params.circleNumeric = extraParams.circleNumeric;
    }

    const response = await api.get(API_ENDPOINTS.recharge.plans, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch recharge plans' };
  }
};

/**
 * Detect circle from mobile number and operator (Auto-detection)
 */
export const detectCircle = async (mobileNumber, operator, rechargeType = 'prepaid') => {
  try {
    const response = await api.get(API_ENDPOINTS.recharge.detectCircle, {
      params: {
        mobileNumber,
        operator,
        rechargeType,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to detect circle' };
  }
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.payout.balance);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch wallet balance' };
  }
};

/**
 * Initiate recharge and payment
 * @param {Object} rechargeData - Recharge data including mobileNumber, operator, amount, etc.
 * @param {Object} rechargeData.billDetails - For postpaid: must include bill_id or transaction_id
 */
export const initiateRecharge = async (rechargeData) => {
  try {
    // Ensure payment method is wallet
    const payload = {
      paymentMethod: 'wallet',
      ...rechargeData,
    };
    
    // For postpaid, ensure bill reference is included
    if (rechargeData.rechargeType === 'postpaid' && rechargeData.billDetails) {
      payload.billDetails = {
        ...rechargeData.billDetails,
        // Ensure bill_id or transaction_id is present
        bill_id: rechargeData.billDetails.bill_id || rechargeData.billDetails.transaction_id || rechargeData.billDetails.billId,
        transaction_id: rechargeData.billDetails.transaction_id || rechargeData.billDetails.bill_id || rechargeData.billDetails.billId,
      };
    }
    
    const response = await api.post(API_ENDPOINTS.recharge.initiate, payload);
    return response.data;
  } catch (error) {
    // Preserve the error response structure
    const errorData = error.response?.data || { 
      success: false,
      message: error.message || 'Failed to initiate recharge' 
    };
    throw errorData;
  }
};

/**
 * Check recharge status
 */
export const checkRechargeStatus = async (rechargeId) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.recharge.status}/${rechargeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to check recharge status' };
  }
};

/**
 * Get user recharge history
 */
export const getRechargeHistory = async (page = 1, limit = 10, status = 'all') => {
  try {
    const response = await api.get(API_ENDPOINTS.recharge.history, {
      params: {
        page,
        limit,
        status,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch recharge history' };
  }
};

