import { registerEnumType } from '@nestjs/graphql';

export enum ProviderOrderBy {
  id = 'id',
  name = 'name',
}

registerEnumType(ProviderOrderBy, {
  name: 'ProviderOrderBy',
});
