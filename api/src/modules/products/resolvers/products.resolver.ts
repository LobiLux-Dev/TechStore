import { ParseIntPipe } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { CategoryModel } from 'src/modules/categories/models';
import { CategoriesService } from 'src/modules/categories/services';
import { ProviderModel } from 'src/modules/providers/models';
import { ProvidersService } from 'src/modules/providers/services';

import { ProductArgs, TotalProductsArgs } from '../dto/args';
import { CreateProductInput, UpdateProductInput } from '../dto/inputs';
import { ProductModel } from '../models';
import { ProductsService } from '../services';

@Resolver(() => ProductModel)
export class ProductsResolver {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly providersService: ProvidersService,
  ) {}

  @Query(() => [ProductModel], { name: 'products' })
  findAll(@Args() productArgs: ProductArgs): Promise<ProductModel[]> {
    return this.productsService.findAll(productArgs);
  }

  @Query(() => ProductModel, { name: 'product', nullable: true })
  findOne(@Args('id', { type: () => Int }, ParseIntPipe) productId: number): Promise<ProductModel | null> {
    return this.productsService.findOne(productId);
  }

  @Query(() => Int, { name: 'totalProducts' })
  total(@Args() totalProductsArgs: TotalProductsArgs): Promise<number> {
    return this.productsService.total(totalProductsArgs);
  }

  @Mutation(() => ProductModel, { name: 'createProduct' })
  createProduct(@Args('createProductInput') createProductInput: CreateProductInput): Promise<ProductModel> {
    return this.productsService.create(createProductInput);
  }

  @Mutation(() => ProductModel, { name: 'updateProduct' })
  updateProduct(@Args('updateProductInput') updateProductInput: UpdateProductInput): Promise<ProductModel> {
    return this.productsService.update(updateProductInput.id, updateProductInput);
  }

  @Mutation(() => ProductModel, { name: 'activateProduct' })
  activateProduct(@Args('id', { type: () => Int }, ParseIntPipe) id: number): Promise<ProductModel> {
    return this.productsService.activate(id);
  }

  @Mutation(() => ProductModel, { name: 'deactivateProduct' })
  deactivateProduct(@Args('id', { type: () => Int }, ParseIntPipe) id: number): Promise<ProductModel> {
    return this.productsService.deactivate(id);
  }

  @Mutation(() => ProductModel, { name: 'deleteProduct' })
  deleteProduct(@Args('id', { type: () => Int }, ParseIntPipe) id: number): Promise<ProductModel> {
    return this.productsService.remove(id);
  }

  @ResolveField(() => ProviderModel, { nullable: true })
  provider(@Parent() productModel: ProductModel): Promise<ProviderModel | null> {
    return this.providersService.findOne(productModel.providerId);
  }

  @ResolveField(() => CategoryModel, { nullable: true })
  category(@Parent() productModel: ProductModel): Promise<CategoryModel | null> {
    return this.categoriesService.findOne(productModel.categoryId);
  }
}
