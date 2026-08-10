import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.usersService.findById(user.id);
  }

  @Put('me')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Post('me/push-token')
  savePushToken(
    @CurrentUser() user: { id: string },
    @Body('pushToken') pushToken: string,
    @Body('platform') platform: string,
  ) {
    return this.usersService.savePushToken(user.id, pushToken, platform);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAllUsers(@Query('role') role?: string) {
    return this.usersService.getAllUsers(role);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  adminUpdateUser(
    @Param('id') id: string,
    @Body()
    dto: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
      emailVerified?: boolean;
    },
  ) {
    return this.usersService.adminUpdateUser(id, dto);
  }

  @Patch('admin/:id/suspend')
  @UseGuards(RolesGuard)
  @Roles('admin')
  suspendUser(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { reason: string },
  ) {
    return this.usersService.suspendUser(id, body.reason, user.id);
  }

  @Patch('admin/:id/unsuspend')
  @UseGuards(RolesGuard)
  @Roles('admin')
  unsuspendUser(@Param('id') id: string) {
    return this.usersService.unsuspendUser(id);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  adminDeleteUser(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.usersService.adminDeleteUser(id, user.id);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.usersService.findAll(search);
  }
}
