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
    if (existing) throw new ConflictException('Mobile number already in use');

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
      where: { mobileNumber: dto.mobileNumber },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signTokens(user.id, user.role);
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
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.signTokens(user.id, user.role);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
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
      throw new UnauthorizedException('User not found');
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
}
