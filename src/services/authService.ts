import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { config } from '../config/environment';
import { ApiError } from '../utils/ApiError';
import { Logger } from '../utils/logger';

export class AuthService {
  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    name: string,
    phoneNumber?: string
  ): Promise<{ user: IUser; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(409, 'User with this email already exists');
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        name,
        phoneNumber,
      });

      Logger.info('User registered successfully', { userId: user._id, email });

      // Generate token
      const token = this.generateToken(user);

      return { user, token };
    } catch (error: any) {
      Logger.error('User registration failed', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    try {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
      }

      Logger.info('User logged in successfully', { userId: user._id, email });

      // Generate token
      const token = this.generateToken(user);

      return { user, token };
    } catch (error: any) {
      Logger.error('User login failed', error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: IUser): string {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId).select('-password');
      return user;
    } catch (error: any) {
      Logger.error('Failed to get user by ID', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
