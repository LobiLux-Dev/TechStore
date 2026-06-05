import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateProviderInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  name: string;
}
