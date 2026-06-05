import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ProductStatus } from 'src/generated/prisma/enums';
import type { Prisma, Product } from 'src/generated/prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/services';
import { ErrorCode } from 'src/shared/enums';
import { SortOrder } from 'src/shared/enums';
import { sanitizeUpdateData } from 'src/shared/utils';

import type { ProductArgs, TotalProductsArgs } from '../dto/args';
import { CreateProductInput, UpdateProductInput } from '../dto/inputs';
import { ProductOrderBy } from '../enums';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(productArgs: ProductArgs): Promise<Product[]> {
    const { limit, offset, orderBy, sortOrder, ...totalProductsArgs } = productArgs;

    return this.prisma.product.findMany({
      skip: limit === -1 ? undefined : (offset ?? 0),
      take: limit === -1 ? undefined : (limit ?? 12),
      where: this.buildWhereClause(totalProductsArgs),
      orderBy: {
        [orderBy ?? ProductOrderBy.id]: sortOrder ?? SortOrder.asc,
      },
    });
  }

  findOne(productId: number): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: {
        id: productId,
      },
    });
  }

  total(totalProductsArgs: TotalProductsArgs): Promise<number> {
    return this.prisma.product.count({
      where: this.buildWhereClause(totalProductsArgs),
    });
  }

  create(createProductInput: CreateProductInput): Promise<Product> {
    return this.prisma.product.create({
      data: {
        ...createProductInput,
        status: createProductInput.status ?? ProductStatus.ACTIVE,
      },
    });
  }

  async update(id: number, updateProductInput: UpdateProductInput): Promise<Product> {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(ErrorCode.DATABASE_RECORD_NOT_FOUND);
    }
    if (product.status === ProductStatus.INACTIVE) {
      throw new BadRequestException(ErrorCode.PRODUCT_DEACTIVATED_CANNOT_EDIT);
    }

    const { id: _, ...data } = updateProductInput;
    return this.prisma.product.update({
      where: { id },
      data: sanitizeUpdateData(data),
    });
  }

  async activate(id: number): Promise<Product> {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(ErrorCode.DATABASE_RECORD_NOT_FOUND);
    }
    if (product.status === ProductStatus.ACTIVE) {
      throw new BadRequestException(ErrorCode.PRODUCT_ALREADY_ACTIVE);
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ACTIVE },
    });
  }

  async deactivate(id: number): Promise<Product> {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(ErrorCode.DATABASE_RECORD_NOT_FOUND);
    }
    if (product.status === ProductStatus.INACTIVE) {
      throw new BadRequestException(ErrorCode.PRODUCT_ALREADY_INACTIVE);
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.INACTIVE },
    });
  }

  async remove(id: number): Promise<Product> {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(ErrorCode.DATABASE_RECORD_NOT_FOUND);
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  findByCategoryIds(categoryIds: readonly number[]): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        categoryId: {
          in: [...categoryIds],
        },
      },
    });
  }

  findByProviderIds(providerIds: readonly number[]): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        providerId: {
          in: [...providerIds],
        },
      },
    });
  }

  private buildWhereClause(productArgs: TotalProductsArgs): Prisma.ProductWhereInput {
    const { search, status, minPrice, maxPrice } = productArgs;

    return {
      name: {
        contains: search ?? undefined,
      },
      price: {
        gte: minPrice ?? 0,
        lte: maxPrice ?? undefined,
      },
      status: status ?? undefined,
    };
  }
}
