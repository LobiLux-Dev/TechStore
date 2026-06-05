import { ParseIntPipe } from '@nestjs/common';
import { Args, Float, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { ProductModel } from 'src/modules/products/models';
import { ProductsLoader } from 'src/modules/products/loaders';

import { CategoryArgs, TotalCategoriesArgs } from '../dto/args';
import { CreateCategoryInput, UpdateCategoryInput } from '../dto/inputs';
import { CategoryModel } from '../models';
import { CategoriesService } from '../services';

@Resolver(() => CategoryModel)
export class CategoriesResolver {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsLoader: ProductsLoader,
  ) {}

  @Query(() => [CategoryModel], { name: 'categories' })
  findAll(@Args() categoryArgs: CategoryArgs): Promise<CategoryModel[]> {
    return this.categoriesService.findAll(categoryArgs);
  }

  @Query(() => CategoryModel, { name: 'category', nullable: true })
  findOne(@Args('id', { type: () => Int }, ParseIntPipe) categoryId: number): Promise<CategoryModel | null> {
    return this.categoriesService.findOne(categoryId);
  }

  @Query(() => Int, { name: 'totalCategories' })
  total(@Args() totalCategoriesArgs: TotalCategoriesArgs): Promise<number> {
    return this.categoriesService.total(totalCategoriesArgs);
  }

  @Mutation(() => CategoryModel, { name: 'createCategory' })
  createCategory(@Args('createCategoryInput') createCategoryInput: CreateCategoryInput): Promise<CategoryModel> {
    return this.categoriesService.create(createCategoryInput);
  }

  @Mutation(() => CategoryModel, { name: 'updateCategory' })
  updateCategory(@Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput): Promise<CategoryModel> {
    return this.categoriesService.update(updateCategoryInput.id, updateCategoryInput);
  }

  @Mutation(() => CategoryModel, { name: 'deleteCategory' })
  deleteCategory(@Args('id', { type: () => Int }, ParseIntPipe) id: number): Promise<CategoryModel> {
    return this.categoriesService.remove(id);
  }

  @ResolveField(() => [ProductModel])
  products(@Parent() categoryModel: CategoryModel): Promise<ProductModel[]> {
    return this.productsLoader.byCategory.load(categoryModel.id);
  }

  @ResolveField(() => Int)
  async totalProducts(@Parent() categoryModel: CategoryModel): Promise<number> {
    const products = await this.productsLoader.byCategory.load(categoryModel.id);
    return products.length;
  }

  @ResolveField(() => Float)
  async inventoryValue(@Parent() categoryModel: CategoryModel): Promise<number> {
    const products = await this.productsLoader.byCategory.load(categoryModel.id);
    return products.reduce((sum, p) => sum + p.price * p.stock, 0);
  }
}
