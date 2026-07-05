import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  ProductsController,
  AdminProductsController,
} from './products.controller';

@Module({
  providers: [ProductsService],
  controllers: [ProductsController, AdminProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
