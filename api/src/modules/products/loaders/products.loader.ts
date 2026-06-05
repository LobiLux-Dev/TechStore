import { Injectable, Scope } from '@nestjs/common';

import DataLoader from 'dataloader';

import { Product } from 'src/generated/prisma/client';

import { ProductsService } from '../services/products.service';

@Injectable({ scope: Scope.REQUEST })
export class ProductsLoader {
  constructor(private readonly productsService: ProductsService) {}

  public readonly byCategory = new DataLoader<number, Product[]>(
    async (categoryIds: readonly number[]) => {
      const products = await this.productsService.findByCategoryIds(categoryIds);
      return categoryIds.map((categoryId) => products.filter((product) => product.categoryId === categoryId));
    },
  );

  public readonly byProvider = new DataLoader<number, Product[]>(
    async (providerIds: readonly number[]) => {
      const products = await this.productsService.findByProviderIds(providerIds);
      return providerIds.map((providerId) => products.filter((product) => product.providerId === providerId));
    },
  );
}
