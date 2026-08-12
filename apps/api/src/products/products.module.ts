import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { ProductsService } from './products.service';
import {
  ProductsController,
  AdminProductsController,
} from './products.controller';

@Module({
  imports: [SearchModule],
  providers: [ProductsService],
  controllers: [ProductsController, AdminProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
