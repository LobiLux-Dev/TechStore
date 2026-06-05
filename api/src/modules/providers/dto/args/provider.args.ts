import { ArgsType, Field, IntersectionType } from '@nestjs/graphql';

import { IsEnum, IsOptional } from 'class-validator';

import { PaginationArgs } from 'src/shared/dto/args';
import { SortOrder } from 'src/shared/enums';

import { ProviderOrderBy } from '../../enums';

import { TotalProvidersArgs } from './total-providers.args';

@ArgsType()
export class ProviderArgs extends IntersectionType(TotalProvidersArgs, PaginationArgs) {
  @Field(() => ProviderOrderBy, { nullable: true })
  @IsOptional()
  @IsEnum(ProviderOrderBy)
  orderBy?: ProviderOrderBy | null;

  @Field(() => SortOrder, { nullable: true })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder | null;
}
