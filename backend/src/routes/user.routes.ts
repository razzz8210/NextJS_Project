import { Router } from 'express';
import { UserController } from '../modules/user/user.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Protected routes - require authentication
router.use(authenticateToken);

// Get current user profile
router.get('/profile', UserController.getCurrentUser);

// Admin and Manager only routes
router.get('/', requireRole(['admin', 'manager'] as const), UserController.getAllUsers);
router.get('/:id', requireRole(['admin', 'manager'] as const), UserController.getUserById);
router.put('/:id', requireRole(['admin', 'manager'] as const), UserController.updateUser);
router.delete('/:id', requireRole(['admin'] as const), UserController.deleteUser);

// Invitation routes
router.post('/invite', requireRole(['admin', 'manager'] as const), UserController.inviteUser);
router.post('/accept-invitation', UserController.acceptInvitation);
router.get('/invitations/sent', requireRole(['admin', 'manager'] as const), UserController.getInvitations);

export default router;