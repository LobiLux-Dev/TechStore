import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { ProductsModule } from 'src/modules/products/products.module';

import { ProvidersResolver } from './resolvers';
import { ProvidersService } from './services';

@Module({
  imports: [PrismaModule, forwardRef(() => ProductsModule)],
  providers: [ProvidersService, ProvidersResolver],
  exports: [ProvidersService, ProvidersResolver],
})
export class ProvidersModule {}
