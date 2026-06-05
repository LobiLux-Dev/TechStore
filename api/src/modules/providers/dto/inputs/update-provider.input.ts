import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

import { IsInt, IsPositive } from 'class-validator';

import { CreateProviderInput } from './create-provider.input';

@InputType()
export class UpdateProviderInput extends PartialType(CreateProviderInput) {
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  id: number;
}
