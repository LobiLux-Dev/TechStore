import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

import { IsInt, IsPositive } from 'class-validator';

import { CreateCategoryInput } from './create-category.input';

@InputType()
export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  id: number;
}
