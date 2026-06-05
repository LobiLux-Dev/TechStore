import { ArgsType, Field, IntersectionType } from '@nestjs/graphql';

import { IsEnum, IsOptional } from 'class-validator';

import { PaginationArgs } from 'src/shared/dto/args';
import { SortOrder } from 'src/shared/enums';

import { CategoryOrderBy } from '../../enums';

import { TotalCategoriesArgs } from './total-categories.args';

@ArgsType()
export class CategoryArgs extends IntersectionType(TotalCategoriesArgs, PaginationArgs) {
  @Field(() => CategoryOrderBy, { nullable: true })
  @IsOptional()
  @IsEnum(CategoryOrderBy)
  orderBy?: CategoryOrderBy | null;

  @Field(() => SortOrder, { nullable: true })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder | null;
}
