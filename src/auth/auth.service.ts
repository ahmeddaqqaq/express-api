import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SigninDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';
import { DeleteUserDto } from './dto/delete-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const mobile = process.env.JWT_SUPERUSER_MOBILE;
    const name = process.env.JWT_SUPERUSER_NAME || 'Admin';
    const password = process.env.JWT_SUPERUSER_PASSWORD;

    if (!mobile || !password) {
      console.warn('Superuser credentials are not fully set in .env');
      return;
    }

    const existing = await this.prisma.user.findUnique({
      where: { mobileNumber: mobile },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await this.prisma.user.create({
        data: {
          name,
          mobileNumber: mobile,
          password: hashedPassword,
          role: UserRole.ADMIN,
        },
      });

      Logger.log(`Superuser created with mobile ${mobile}`);
    } else {
      Logger.log(`Superuser with mobile ${mobile} already exists`);
    }
  }

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { mobileNumber: dto.mobileNumber },
    });
    if (existing)
      throw new ConflictException(
        `Mobile number ${dto.mobileNumber} is already registered. Please use a different mobile number or sign in with your existing account.`,
      );

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        mobileNumber: dto.mobileNumber,
        password: hashedPassword,
        role: dto.role,
      },
    });

    return this.signTokens(user.id, user.role);
  }

  async signin(dto: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: { mobileNumber: dto.mobileNumber, isActive: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException(
        'Invalid mobile number or password. Please check your credentials and try again.',
      );
    }

    return this.signTokens(user.id, user.role);
  }

  async deleteUser(dto: DeleteUserDto, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only administrators can delete users.');
    }

    const user = await this.prisma.user.findUnique({
      where: { mobileNumber: dto.mobileNumber },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User not found. Please check the mobile number and try again.',
      );
    }

    await this.prisma.user
      .delete({
        where: { mobileNumber: dto.mobileNumber },
      })
      .catch((error) => {
        throw new ConflictException(
          `Failed to delete user with mobile number ${dto.mobileNumber}. Please try again later.`,
        );
      });

    return { message: 'User deleted successfully' };
  }

  async resetPassword(dto: ResetPasswordDto, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException(
        'Only administrators can reset user passwords.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { mobileNumber: dto.mobileNumber },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User not found. Please check the mobile number and try again.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { mobileNumber: dto.mobileNumber },
      data: { password: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }

  async updateUser(dto: UpdateUserDto, currentUserId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!targetUser) {
      throw new UnauthorizedException(
        'User not found. Please check the user ID and try again.',
      );
    }

    const updateData: any = {};

    if (dto.name) {
      updateData.name = dto.name;
    }

    if (dto.mobileNumber) {
      const existingUser = await this.prisma.user.findUnique({
        where: { mobileNumber: dto.mobileNumber },
      });

      if (existingUser && existingUser.id !== dto.userId) {
        throw new ConflictException(
          `Mobile number ${dto.mobileNumber} is already in use by another account.`,
        );
      }

      updateData.mobileNumber = dto.mobileNumber;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: dto.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      userId: updatedUser.id,
      name: updatedUser.name,
      mobileNumber: updatedUser.mobileNumber,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
    };
  }

  async signOut() {
    return { message: 'User signed out' };
  }

  private async signTokens(userId: string, role: UserRole) {
    const payload = { sub: userId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException(
          'Your account was not found or has been deactivated. Please contact an administrator for assistance.',
        );
      }

      return this.signTokens(user.id, user.role);
    } catch (error) {
      throw new UnauthorizedException(
        'Your session has expired. Please sign in again to continue.',
      );
    }
  }

  async getUserInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User account not found. Please verify your credentials.',
      );
    }

    return {
      userId: user.id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async getSupervisorUsers() {
    const supervisors = await this.prisma.user.findMany({
      where: {
        role: UserRole.SUPERVISOR,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return supervisors.map((user) => ({
      userId: user.id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
  }
}
