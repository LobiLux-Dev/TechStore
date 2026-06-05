import { registerEnumType } from '@nestjs/graphql';

export enum CategoryOrderBy {
  id = 'id',
  name = 'name',
}

registerEnumType(CategoryOrderBy, {
  name: 'CategoryOrderBy',
});
