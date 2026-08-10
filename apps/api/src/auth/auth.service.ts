import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private smsService: SmsService,
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

  private dispatchVerificationOtp(
    email: string,
    otp: string,
    firstName: string,
    phone?: string | null,
  ) {
    void this.emailService
      .sendOtpEmail(email, otp, firstName)
      .catch((err) =>
        this.logger.error(`OTP email failed for ${email}`, err),
      );

    if (phone) {
      void this.smsService
        .sendOtpSms(phone, otp)
        .catch((err) =>
          this.logger.error(`OTP SMS failed for ${phone}`, err),
        );
    }
  }

  private dispatchPasswordResetEmail(email: string, otp: string) {
    void this.emailService
      .sendEmail({
        to: email,
        subject: 'Reset your AfriCover247 password',
        html: `<p>Your password reset code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`,
      })
      .catch((err) =>
        this.logger.error(`Password reset email failed for ${email}`, err),
      );
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
    this.logger.log(`[AUTH] OTP generated for ${user.email}: ${otp}`);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.emailVerification.create({
      data: { userId: user.id, otpCode: otp, expiresAt },
    });

    this.dispatchVerificationOtp(user.email, otp, user.firstName, user.phone);
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

  async resendVerificationOtp(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'If an account exists, a new code has been sent.' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('This email is already verified.');
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailVerification.create({
      data: { userId: user.id, otpCode: otp, expiresAt },
    });

    this.dispatchVerificationOtp(user.email, otp, user.firstName, user.phone);

    this.logger.log(`[AUTH] Resent OTP for ${email}: ${otp}`);

    return { message: 'A new verification code has been sent.' };
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

    if (user.suspended) {
      throw new UnauthorizedException(
        `Your account has been suspended. ${user.suspendedReason ? `Reason: ${user.suspendedReason}` : 'Please contact support.'}`,
      );
    }

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
      this.dispatchPasswordResetEmail(user.email, otp);
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

  async sendPhoneOtp(phone: string) {
    const normalized = this.normalizePhone(phone);

    const user = await this.prisma.user.findFirst({
      where: { phone: normalized },
    });
    if (!user) throw new NotFoundException('No account found with this phone number');
    if (user.suspended) {
      throw new UnauthorizedException(
        `Your account has been suspended. ${user.suspendedReason ? `Reason: ${user.suspendedReason}` : 'Please contact support.'}`,
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.phoneOtp.deleteMany({ where: { phone: normalized } });
    await this.prisma.phoneOtp.create({
      data: { phone: normalized, otpCode: otp, expiresAt },
    });

    this.logger.log(`[AUTH] Phone OTP for ${normalized}: ${otp}`);
    await this.smsService.sendOtpSms(normalized, otp);

    return { message: 'OTP sent to your phone number' };
  }

  async verifyPhoneOtp(phone: string, otp: string) {
    const normalized = this.normalizePhone(phone);

    const record = await this.prisma.phoneOtp.findFirst({
      where: { phone: normalized, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new UnauthorizedException('No OTP found. Please request a new one.');
    if (record.otpCode !== otp) throw new UnauthorizedException('Invalid OTP.');
    if (new Date() > record.expiresAt) throw new UnauthorizedException('OTP has expired. Please request a new one.');

    await this.prisma.phoneOtp.update({
      where: { id: record.id },
      data: { used: true },
    });

    const user = await this.prisma.user.findFirst({
      where: { phone: normalized },
    });
    if (!user) throw new NotFoundException('User not found');

    const accessToken = this.signToken(user.id, user.email, user.role);
    return { accessToken, user: this.sanitizeUser(user) };
  }

  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('234')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+234${cleaned.slice(1)}`;
    return `+234${cleaned}`;
  }

  async googleAuth(
    googleId: string,
    email: string,
    firstName: string,
    lastName: string,
  ) {
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
          emailVerified: true,
          role: 'customer',
          googleId,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    if (user.suspended) {
      throw new UnauthorizedException(
        `Your account has been suspended. ${user.suspendedReason || 'Please contact support.'}`,
      );
    }

    const accessToken = this.signToken(user.id, user.email, user.role);
    return { accessToken, user: this.sanitizeUser(user) };
  }

  async appleAuth(
    appleId: string,
    email: string | null,
    firstName: string,
    lastName: string,
  ) {
    let user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : null;

    if (!user) {
      user = await this.prisma.user.findFirst({ where: { appleId } });
    }

    if (!user) {
      if (!email) throw new UnauthorizedException('Email is required for first-time Apple Sign-In');
      user = await this.prisma.user.create({
        data: {
          email,
          firstName: firstName || 'Apple',
          lastName: lastName || 'User',
          passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
          emailVerified: true,
          role: 'customer',
          appleId,
        },
      });
    } else if (!user.appleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { appleId },
      });
    }

    if (user.suspended) {
      throw new UnauthorizedException(
        `Your account has been suspended. ${user.suspendedReason || 'Please contact support.'}`,
      );
    }

    const accessToken = this.signToken(user.id, user.email, user.role);
    return { accessToken, user: this.sanitizeUser(user) };
  }
}
