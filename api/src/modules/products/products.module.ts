import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { ProvidersModule } from 'src/modules/providers/providers.module';

import { ProductsLoader } from './loaders';
import { ProductsResolver } from './resolvers';
import { ProductsService } from './services';

@Module({
  imports: [PrismaModule, forwardRef(() => CategoriesModule), forwardRef(() => ProvidersModule)],
  providers: [ProductsResolver, ProductsService, ProductsLoader],
  exports: [ProductsService, ProductsLoader],
})
export class ProductsModule {}
