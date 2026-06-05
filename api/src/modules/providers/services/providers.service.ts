import { Injectable } from '@nestjs/common';

import type { Prisma, Provider } from 'src/generated/prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/services';
import { SortOrder } from 'src/shared/enums';

import { ProviderArgs, TotalProvidersArgs } from '../dto/args';
import { CreateProviderInput, UpdateProviderInput } from '../dto/inputs';
import { ProviderOrderBy } from '../enums';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(providerArgs: ProviderArgs): Promise<Provider[]> {
    const { limit, offset, orderBy, sortOrder, ...totalProvidersArgs } = providerArgs;

    return this.prisma.provider.findMany({
      skip: limit === -1 ? undefined : (offset ?? 0),
      take: limit === -1 ? undefined : (limit ?? 12),
      where: this.buildWhereClause(totalProvidersArgs),
      orderBy: {
        [orderBy ?? ProviderOrderBy.id]: sortOrder ?? SortOrder.asc,
      },
    });
  }

  findOne(providerId: number): Promise<Provider | null> {
    return this.prisma.provider.findUnique({
      where: {
        id: providerId,
      },
    });
  }

  total(totalProvidersArgs: TotalProvidersArgs): Promise<number> {
    return this.prisma.provider.count({
      where: this.buildWhereClause(totalProvidersArgs),
    });
  }

  create(createProviderInput: CreateProviderInput): Promise<Provider> {
    return this.prisma.provider.create({
      data: createProviderInput,
    });
  }

  update(id: number, updateProviderInput: UpdateProviderInput): Promise<Provider> {
    const { id: _, ...data } = updateProviderInput;
    return this.prisma.provider.update({
      where: { id },
      data,
    });
  }

  remove(id: number): Promise<Provider> {
    return this.prisma.provider.delete({
      where: { id },
    });
  }

  private buildWhereClause(providerArgs: TotalProvidersArgs): Prisma.ProviderWhereInput {
    const { search } = providerArgs;

    return {
      name: {
        contains: search ?? undefined,
      },
    };
  }
}
