import { Injectable } from '@nestjs/common';

import type { Category, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/services';
import { SortOrder } from 'src/shared/enums';
import { sanitizeUpdateData } from 'src/shared/utils';

import { CategoryArgs, TotalCategoriesArgs } from '../dto/args';
import { CreateCategoryInput, UpdateCategoryInput } from '../dto/inputs';
import { CategoryOrderBy } from '../enums';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(categoryArgs: CategoryArgs): Promise<Category[]> {
    const { limit, offset, orderBy, sortOrder, ...totalCategoriesArgs } = categoryArgs;

    return this.prisma.category.findMany({
      skip: limit === -1 ? undefined : (offset ?? 0),
      take: limit === -1 ? undefined : (limit ?? 12),
      where: this.buildWhereClause(totalCategoriesArgs),
      orderBy: {
        [orderBy ?? CategoryOrderBy.id]: sortOrder ?? SortOrder.asc,
      },
    });
  }

  findOne(categoryId: number): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });
  }

  total(totalCategoriesArgs: TotalCategoriesArgs): Promise<number> {
    return this.prisma.category.count({
      where: this.buildWhereClause(totalCategoriesArgs),
    });
  }

  create(createCategoryInput: CreateCategoryInput): Promise<Category> {
    return this.prisma.category.create({
      data: createCategoryInput,
    });
  }

  update(id: number, updateCategoryInput: UpdateCategoryInput): Promise<Category> {
    const { id: _, ...data } = updateCategoryInput;
    return this.prisma.category.update({
      where: { id },
      data: sanitizeUpdateData(data),
    });
  }

  remove(id: number): Promise<Category> {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  private buildWhereClause(categoryArgs: TotalCategoriesArgs): Prisma.CategoryWhereInput {
    const { search } = categoryArgs;

    return {
      name: {
        contains: search ?? undefined,
      },
    };
  }
}
