import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

import { ProductModel } from 'src/modules/products/models';

@ObjectType('Category')
export class CategoryModel {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => [ProductModel])
  products?: ProductModel[];

  @Field(() => Int)
  totalProducts?: number;

  @Field(() => Float)
  inventoryValue?: number;
}
