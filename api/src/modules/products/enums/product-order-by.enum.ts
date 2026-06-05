import { registerEnumType } from '@nestjs/graphql';

export enum ProductOrderBy {
  id = 'id',
  name = 'name',
  price = 'price',
  stock = 'stock',
  status = 'status',
}

registerEnumType(ProductOrderBy, {
  name: 'ProductOrderBy',
});
