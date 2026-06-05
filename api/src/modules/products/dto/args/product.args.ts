import { ArgsType, Field, IntersectionType } from '@nestjs/graphql';

import { IsEnum, IsOptional } from 'class-validator';

import { PaginationArgs } from 'src/shared/dto/args';
import { SortOrder } from 'src/shared/enums';

import { ProductOrderBy } from '../../enums';

import { TotalProductsArgs } from './total-products.args';

@ArgsType()
export class ProductArgs extends IntersectionType(TotalProductsArgs, PaginationArgs) {
  @Field(() => ProductOrderBy, { nullable: true })
  @IsOptional()
  @IsEnum(ProductOrderBy)
  orderBy?: ProductOrderBy | null;

  @Field(() => SortOrder, { nullable: true })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder | null;
}
