import api from '../lib/api';
import { 
  LoginRequest, 
  RegisterRequest, 
  VerifyOtpRequest, 
  AuthResponse,
  InviteUserRequest,
  AcceptInvitationRequest,
  ApiResponse 
} from '../types/auth.types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  async resendOtp(email: string): Promise<AuthResponse> {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  async getCurrentUser(): Promise<ApiResponse> {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async getAllUsers(): Promise<ApiResponse> {
    const response = await api.get('/users');
    return response.data;
  },

  async getUserById(id: string): Promise<ApiResponse> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async updateUser(id: string, data: any): Promise<ApiResponse> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async inviteUser(data: InviteUserRequest): Promise<ApiResponse> {
    const response = await api.post('/users/invite', data);
    return response.data;
  },

  async acceptInvitation(data: AcceptInvitationRequest): Promise<ApiResponse> {
    const response = await api.post('/users/accept-invitation', data);
    return response.data;
  },

  async getInvitations(): Promise<ApiResponse> {
    const response = await api.get('/users/invitations/sent');
    return response.data;
  }
};