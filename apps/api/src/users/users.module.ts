import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController, AdminUsersController } from './users.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  providers: [UsersService],
  controllers: [UsersController, AdminUsersController],
  exports: [UsersService],
})
export class UsersModule {}
