import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

import { ProductStatus } from 'src/generated/prisma/enums';

import { CategoryModel } from 'src/modules/categories/models';
import { ProviderModel } from 'src/modules/providers/models';

@ObjectType('Product')
export class ProductModel {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stock: number;

  @Field(() => ProductStatus)
  status: ProductStatus;

  categoryId: number;
  providerId: number;

  @Field(() => ProviderModel, { nullable: true })
  provider?: ProviderModel;

  @Field(() => CategoryModel, { nullable: true })
  category?: CategoryModel;
}
