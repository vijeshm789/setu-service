import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../types';
import { AuthRequest } from '../types';

/**
 * Register a new user with SETU credentials
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, phoneNumber, setuCredentials } = req.body;

  const { user, token } = await authService.register(
    email,
    password,
    name,
    setuCredentials,
    phoneNumber
  );

  const response: ApiResponse = {
    success: true,
    message: 'User registered successfully. Use the token for authentication.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
      token,
    },
  };

  res.status(201).json(response);
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const user = await authService.getUserById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const response: ApiResponse = {
    success: true,
    message: 'Profile fetched successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
    },
  };

  res.status(200).json(response);
});
