import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

import { IsInt, IsPositive } from 'class-validator';

import { CreateProductInput } from './create-product.input';

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  id: number;
}
