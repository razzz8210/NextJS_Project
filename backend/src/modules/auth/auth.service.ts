import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class AuthService {
  static async createUser(data: { email: string; password: string; firstName: string; lastName: string; role: 'admin' | 'manager' | 'developer' | 'project_manager' }) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
     
      },
    });
  }

  static async generateOtp(userId: string) {
    const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    return prisma.otpToken.create({
      data: {
        userId,
        token: await bcrypt.hash(token, 12), // Hash for storage
        expiresAt,
      },
    });
  }


}