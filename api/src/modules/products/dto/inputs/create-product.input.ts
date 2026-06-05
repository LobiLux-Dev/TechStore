import { Field, Float, InputType, Int } from '@nestjs/graphql';

import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { ProductStatus } from 'src/generated/prisma/enums';

@InputType()
export class CreateProductInput {
  @Field(() => String)
  @IsNotEmpty()
  name: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  stock: number;

  @Field(() => ProductStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @Field(() => Int)
  @IsInt()
  @IsPositive()
  categoryId: number;

  @Field(() => Int)
  @IsInt()
  @IsPositive()
  providerId: number;
}
