import { Response } from 'express';
import { UserService } from './user.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { InviteUserRequest, AcceptInvitationRequest } from '../../types/auth.types';
import prisma from '../../lib/prisma';

export class UserController {
  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const result = await UserService.getAllUsers(req.user!.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to retrieve users'
      });
    }
  }

  static async getUserById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.getUserById(id, req.user!.id);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'User not found'
      });
    }
  }

  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.updateUser(id, req.body, req.user!.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user'
      });
    }
  }

  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.deleteUser(id, req.user!.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  }

  static async inviteUser(req: AuthRequest, res: Response) {
    try {
      const data: InviteUserRequest = req.body;
      const result = await UserService.inviteUser(data, req.user!.id);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send invitation'
      });
    }
  }

  static async acceptInvitation(req: AuthRequest, res: Response) {
    try {
      const data: AcceptInvitationRequest = req.body;
      const result = await UserService.acceptInvitation(data);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to accept invitation'
      });
    }
  }

  static async getInvitations(req: AuthRequest, res: Response) {
    try {
      const result = await UserService.getInvitations(req.user!.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to retrieve invitations'
      });
    }
  }

  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        message: 'User profile retrieved successfully',
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to retrieve user profile'
      });
    }
  }
}