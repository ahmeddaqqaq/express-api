import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

    return this.signToken(user.id, user.role);
  }

  async signin(dto: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: { mobileNumber: dto.mobileNumber },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.role);
  }

  async signOut() {
    return { message: 'User signed out' };
  }

  private async signToken(userId: string, role: UserRole) {
    const payload = { sub: userId, role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
    };
  }
}
