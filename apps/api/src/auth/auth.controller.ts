import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyEmail(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-otp')
  resendOtp(@Body('email') email: string) {
    return this.authService.resendVerificationOtp(email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('phone/send-otp')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  sendPhoneOtp(@Body() body: { phone: string }) {
    return this.authService.sendPhoneOtp(body.phone);
  }

  @Post('phone/verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  verifyPhoneOtp(@Body() body: { phone: string; otp: string }) {
    return this.authService.verifyPhoneOtp(body.phone, body.otp);
  }

  @Post('google')
  googleAuth(
    @Body()
    body: {
      googleId: string;
      email: string;
      firstName: string;
      lastName: string;
    },
  ) {
    return this.authService.googleAuth(
      body.googleId,
      body.email,
      body.firstName,
      body.lastName,
    );
  }

  @Post('apple')
  appleAuth(
    @Body()
    body: {
      appleId: string;
      email: string | null;
      firstName: string;
      lastName: string;
    },
  ) {
    return this.authService.appleAuth(
      body.appleId,
      body.email,
      body.firstName,
      body.lastName,
    );
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    return { message: 'Logged out successfully' };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('verify-password')
  verifyPassword(
    @CurrentUser() user: { id: string },
    @Body() body: { password: string },
  ) {
    return this.authService.verifyPassword(user.id, body.password);
  }
}
