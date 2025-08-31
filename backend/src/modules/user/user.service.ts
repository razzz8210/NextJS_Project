import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt.utils';
import { generateOTP } from '../../utils/validation.utils';
import { InviteUserRequest, AcceptInvitationRequest, ApiResponse } from '../../types/auth.types';

const prisma = new PrismaClient();

export class UserService {
  static async getAllUsers(currentUserId: string) {
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users
    };
  }

  static async getUserById(userId: string, currentUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      message: 'User retrieved successfully',
      data: user
    };
  }

  static async updateUser(userId: string, data: {
    firstName?: string;
    lastName?: string;
    role?: string;
    isActive?: boolean;
  }, currentUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return {
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    };
  }

  static async deleteUser(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new Error('Cannot delete your own account');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return {
      success: true,
      message: 'User deleted successfully'
    };
  }

  static async inviteUser(data: InviteUserRequest, invitedById: string): Promise<ApiResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.userInvitation.findFirst({
      where: {
        email: data.email,
        isAccepted: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvitation) {
      throw new Error('Invitation already sent to this email');
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.userInvitation.create({
      data: {
        email: data.email,
        role: data.role,
        invitedById,
        expiresAt
      }
    });

    return {
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitationId: invitation.id,
        token: invitation.token
      }
    };
  }

  static async acceptInvitation(data: AcceptInvitationRequest): Promise<ApiResponse> {
    const invitation = await prisma.userInvitation.findFirst({
      where: {
        token: data.token,
        isAccepted: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user and mark invitation as accepted
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invitation.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: invitation.role,
          isActive: true,
          createdById: invitation.invitedById
        }
      }),
      prisma.userInvitation.update({
        where: { id: invitation.id },
        data: { isAccepted: true }
      })
    ]);

    const token = generateToken(user.id);

    return {
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        }
      }
    };
  }

  static async getInvitations(userId: string) {
    const invitations = await prisma.userInvitation.findMany({
      where: { invitedById: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isAccepted: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      message: 'Invitations retrieved successfully',
      data: invitations
    };
  }
}