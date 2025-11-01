import api, { API_ENDPOINTS } from '../config/api.js';

/**
 * Fetch recharge plans from aiTopUp API
 */
export const fetchRechargePlans = async (mobileNumber, operator, circle, rechargeType = 'prepaid') => {
  try {
    const response = await api.get(API_ENDPOINTS.recharge.plans, {
      params: {
        mobileNumber,
        operator,
        circle,
        rechargeType,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch recharge plans' };
  }
};

/**
 * Initiate recharge and payment
 */
export const initiateRecharge = async (rechargeData) => {
  try {
    const response = await api.post(API_ENDPOINTS.recharge.initiate, rechargeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to initiate recharge' };
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

