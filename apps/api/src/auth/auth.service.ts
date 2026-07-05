import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  // --- Helpers ---

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private signToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign({ sub: userId, email, role });
  }

  private sanitizeUser(user: {
    passwordHash: string;
    [key: string]: unknown;
  }) {
    const { passwordHash, ...rest } = user;
    return rest;
  }

  // --- Register ---

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing)
      throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: 'customer',
        emailVerified: false,
      },
    });

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.emailVerification.create({
      data: { userId: user.id, otpCode: otp, expiresAt },
    });

    await this.emailService.sendOtpEmail(user.email, otp);
    return {
      message:
        'Registration successful. Please check your email for a verification code.',
    };
  }

  // --- Verify email ---

  async verifyEmail(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('No account found with this email');

    const verification = await this.prisma.emailVerification.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification)
      throw new BadRequestException(
        'No verification code found. Please register again.',
      );
    if (verification.otpCode !== dto.otp)
      throw new BadRequestException('Invalid verification code');
    if (verification.expiresAt < new Date())
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );

    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    const accessToken = this.signToken(
      updatedUser.id,
      updatedUser.email,
      updatedUser.role,
    );
    return { accessToken, user: this.sanitizeUser(updatedUser) };
  }

  // --- Login ---

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.emailVerified)
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );

    const accessToken = this.signToken(user.id, user.email, user.role);
    return { accessToken, user: this.sanitizeUser(user) };
  }

  // --- Forgot password ---

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      const otp = this.generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await this.prisma.passwordReset.create({
        data: { userId: user.id, token: otp, expiresAt },
      });
      await this.emailService.sendPasswordResetEmail(user.email, otp);
    }

    return {
      message:
        'If an account with that email exists, a reset code has been sent.',
    };
  }

  // --- Reset password ---

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('No account found with this email');

    const reset = await this.prisma.passwordReset.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!reset)
      throw new BadRequestException(
        'No reset code found. Please request a new one.',
      );
    if (reset.token !== dto.otp)
      throw new BadRequestException('Invalid reset code');
    if (reset.expiresAt < new Date())
      throw new BadRequestException(
        'Reset code has expired. Please request a new one.',
      );

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    await this.prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Password reset successful. You can now log in.' };
  }

  // --- Get current user ---

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }
}
