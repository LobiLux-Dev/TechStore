import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { ProductsModule } from 'src/modules/products/products.module';

import { CategoriesResolver } from './resolvers';
import { CategoriesService } from './services';

@Module({
  imports: [PrismaModule, forwardRef(() => ProductsModule)],
  providers: [CategoriesResolver, CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
