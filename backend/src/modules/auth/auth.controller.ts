import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { validateEmail, validatePassword } from '../../utils/validation.utils';
import { LoginRequest, RegisterRequest, VerifyOtpRequest } from '../../types/auth.types';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      console.log('Registration request received:', req.body);
      const { email, password, firstName, lastName, role }: RegisterRequest = req.body;
      
      // Debug logging
      console.log('Parsed registration data:', {
        email, firstName, lastName, role,
        passwordLength: password?.length
      });

      // Validation
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message
        });
      }

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password }: LoginRequest = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  static async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp }: VerifyOtpRequest = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required'
        });
      }

      const result = await AuthService.verifyOtp(email, otp);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'OTP verification failed'
      });
    }
  }

  static async resendOtp(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const result = await AuthService.resendOtp(email);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to resend OTP'
      });
    }
  }
}