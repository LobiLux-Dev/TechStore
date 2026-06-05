import { ParseIntPipe } from '@nestjs/common';
import { Args, Float, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { ProductModel } from 'src/modules/products/models';
import { ProductsLoader } from 'src/modules/products/loaders';

import { ProviderArgs, TotalProvidersArgs } from '../dto/args';
import { CreateProviderInput, UpdateProviderInput } from '../dto/inputs';
import { ProviderModel } from '../models';
import { ProvidersService } from '../services';

@Resolver(() => ProviderModel)
export class ProvidersResolver {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly productsLoader: ProductsLoader,
  ) {}

  @Query(() => [ProviderModel], { name: 'providers' })
  findAll(@Args() providerArgs: ProviderArgs): Promise<ProviderModel[]> {
    return this.providersService.findAll(providerArgs);
  }

  @Query(() => ProviderModel, { name: 'provider', nullable: true })
  findOne(@Args('id', { type: () => Int }, ParseIntPipe) providerId: number): Promise<ProviderModel | null> {
    return this.providersService.findOne(providerId);
  }

  @Query(() => Int, { name: 'totalProviders' })
  total(@Args() totalProvidersArgs: TotalProvidersArgs): Promise<number> {
    return this.providersService.total(totalProvidersArgs);
  }

  @Mutation(() => ProviderModel, { name: 'createProvider' })
  createProvider(@Args('createProviderInput') createProviderInput: CreateProviderInput): Promise<ProviderModel> {
    return this.providersService.create(createProviderInput);
  }

  @Mutation(() => ProviderModel, { name: 'updateProvider' })
  updateProvider(@Args('updateProviderInput') updateProviderInput: UpdateProviderInput): Promise<ProviderModel> {
    return this.providersService.update(updateProviderInput.id, updateProviderInput);
  }

  @Mutation(() => ProviderModel, { name: 'deleteProvider' })
  deleteProvider(@Args('id', { type: () => Int }, ParseIntPipe) id: number): Promise<ProviderModel> {
    return this.providersService.remove(id);
  }

  @ResolveField(() => [ProductModel])
  products(@Parent() providerModel: ProviderModel): Promise<ProductModel[]> {
    return this.productsLoader.byProvider.load(providerModel.id);
  }

  @ResolveField(() => Int)
  async totalProducts(@Parent() providerModel: ProviderModel): Promise<number> {
    const products = await this.productsLoader.byProvider.load(providerModel.id);
    return products.length;
  }

  @ResolveField(() => Float)
  async inventoryValue(@Parent() providerModel: ProviderModel): Promise<number> {
    const products = await this.productsLoader.byProvider.load(providerModel.id);
    return products.reduce((sum, p) => sum + p.price * p.stock, 0);
  }
}
