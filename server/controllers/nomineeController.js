import Nominee from '../models/Nominee.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Get nominee information for a user
export const getNominee = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check if user exists
  const user = await User.findOne({ userId });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const nominee = await Nominee.getByUserId(userId);

  res.status(200).json(
    new ApiResponse(200, nominee, 'Nominee information retrieved successfully')
  );
});

// Create or update nominee information
export const createOrUpdateNominee = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, bloodRelation, mobile, address } = req.body;

  // Check if user exists
  const user = await User.findOne({ userId });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Validate required fields
  if (!name || !bloodRelation || !mobile || !address) {
    throw new ApiError(400, 'All fields are required');
  }

  // Validate mobile number format
  if (!/^\d{10}$/.test(mobile)) {
    throw new ApiError(400, 'Mobile number must be 10 digits');
  }

  // Create or update nominee
  const nominee = await Nominee.createOrUpdate(userId, {
    name,
    bloodRelation,
    mobile,
    address
  });

  res.status(200).json(
    new ApiResponse(200, nominee, 'Nominee information saved successfully')
  );
});

// Delete nominee information
export const deleteNominee = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check if user exists
  const user = await User.findOne({ userId });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const nominee = await Nominee.findOneAndUpdate(
    { userId },
    { isActive: false },
    { new: true }
  );

  if (!nominee) {
    throw new ApiError(404, 'Nominee information not found');
  }

  res.status(200).json(
    new ApiResponse(200, null, 'Nominee information deleted successfully')
  );
});

// Get all nominees (Admin only)
export const getAllNominees = asyncHandler(async (req, res) => {
  const nominees = await Nominee.find({ isActive: true })
    .populate('userId', 'firstName lastName email mobile')
    .sort({ addedDate: -1 });

  res.status(200).json(
    new ApiResponse(200, nominees, 'All nominees retrieved successfully')
  );
});
