import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { GraphQLModule } from './infrastructure/graphql/graphql.module';
import { ProductsModule } from './modules/products/products.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { CategoriesModule } from './modules/categories/categories.module';

@Module({
  imports: [ConfigModule, GraphQLModule, ProductsModule, ProvidersModule, CategoriesModule],
})
export class AppModuleModule {}
