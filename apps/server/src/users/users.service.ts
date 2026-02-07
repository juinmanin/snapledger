import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, SwitchModeDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          profileImage: true,
          userType: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error(`Get profile failed: ${error.message}`);
      throw error;
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: dto,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          profileImage: true,
          userType: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Profile updated for user: ${userId}`);

      return user;
    } catch (error) {
      this.logger.error(`Update profile failed: ${error.message}`);
      throw error;
    }
  }

  async switchMode(userId: string, dto: SwitchModeDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { userType: dto.userType },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
        },
      });

      this.logger.log(`User ${userId} switched to ${dto.userType} mode`);

      return {
        message: `Switched to ${dto.userType} mode successfully`,
        user,
      };
    } catch (error) {
      this.logger.error(`Switch mode failed: ${error.message}`);
      throw error;
    }
  }
}
