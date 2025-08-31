import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt.utils';
import { generateOTP } from '../../utils/validation.utils';
import { AuthResponse, RegisterRequest } from '../../types/auth.types';
import { emailService } from '../../services/email.service';

const prisma = new PrismaClient();

export class AuthService {
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    console.log('Starting registration process for:', data.email);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    }).catch((error: Error) => {
      console.error('Database error while checking existing user:', error);
      throw new Error('Database error while checking user');
    });

    console.log('Existing user check result:', existingUser);

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    console.log('Creating new user with data:', {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role
    });

    let createdUser;
    try {
      createdUser = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        },
      });
      console.log('User created successfully:', createdUser.id);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user account');
    }

    try {
      // Generate OTP for email verification
      await this.generateOtp(createdUser.id);

      return {
        success: true,
        message: 'Registration successful. Please verify your email with the OTP sent.',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          role: createdUser.role,
          isActive: createdUser.isActive
        }
      };
    } catch (error) {
      console.error('Error generating OTP:', error);
      // Even if OTP generation fails, return success but with a different message
      return {
        success: true,
        message: 'Registration successful but could not send verification email.',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          role: createdUser.role,
          isActive: createdUser.isActive
        }
      };
    }
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is inactive. Please contact administrator.');
    }

    const token = generateToken(user.id);

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    };
  }

  static async generateOtp(userId: string) {
    // Invalidate existing OTPs
    await prisma.otpToken.updateMany({
      where: { 
        userId,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      data: { isUsed: true }
    });

    const token = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Get user details for email
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create OTP token
    const otpToken = await prisma.otpToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    // Send email with OTP
    const emailSent = await emailService.sendOtpEmail(user.email, token, user.firstName);
    if (!emailSent) {
      console.error('Failed to send OTP email to:', user.email);
    }

    return otpToken;
  }

  static async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        otpTokens: {
          where: {
            isUsed: false,
            expiresAt: { gt: new Date() }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const otpToken = user.otpTokens[0];
    if (!otpToken || otpToken.token !== otp) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark OTP as used
    await prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { isUsed: true }
    });

    // Activate user if not already active
    if (!user.isActive) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true }
      });
    }

    const token = generateToken(user.id);

    return {
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: true
      }
    };
  }

  static async resendOtp(email: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('User not found');
    }

    await this.generateOtp(user.id);

    return {
      success: true,
      message: 'OTP sent successfully'
    };
  }

}