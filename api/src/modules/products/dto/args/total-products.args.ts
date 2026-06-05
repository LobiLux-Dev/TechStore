import { ArgsType, Field, Float, registerEnumType } from '@nestjs/graphql';

import { IsEnum, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { ProductStatus } from 'src/generated/prisma/enums';

@ArgsType()
export class TotalProductsArgs {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string | null;

  @Field(() => ProductStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  minPrice?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsPositive()
  maxPrice?: number | null;
}

registerEnumType(ProductStatus, {
  name: 'ProductStatus',
});
