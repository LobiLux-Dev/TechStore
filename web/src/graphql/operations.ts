import { gql } from "@apollo/client";

// --- Fragments for Optimization ---
export const PRODUCT_FIELDS = gql`
  fragment ProductFields on Product {
    id
    name
    price
    stock
    status
    category {
      id
      name
    }
    provider {
      id
      name
    }
  }
`;

export const CATEGORY_FIELDS = gql`
  fragment CategoryFields on Category {
    id
    name
    totalProducts
    inventoryValue
  }
`;

export const PROVIDER_FIELDS = gql`
  fragment ProviderFields on Provider {
    id
    name
    totalProducts
    inventoryValue
  }
`;

// --- Queries ---

// Product Queries
export const GET_PRODUCTS = gql`
  query GetProducts(
    $search: String
    $status: ProductStatus
    $minPrice: Float
    $maxPrice: Float
    $limit: Int
    $offset: Int
    $orderBy: ProductOrderBy
    $sortOrder: SortOrder
  ) {
    products(
      search: $search
      status: $status
      minPrice: $minPrice
      maxPrice: $maxPrice
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      sortOrder: $sortOrder
    ) {
      ...ProductFields
    }
    totalProducts(
      search: $search
      status: $status
      minPrice: $minPrice
      maxPrice: $maxPrice
    )
  }
  ${PRODUCT_FIELDS}
`;

export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: Int!) {
    product(id: $id) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

// Category Queries
export const GET_CATEGORIES = gql`
  query GetCategories(
    $search: String
    $limit: Int
    $offset: Int
    $orderBy: CategoryOrderBy
    $sortOrder: SortOrder
  ) {
    categories(
      search: $search
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      sortOrder: $sortOrder
    ) {
      ...CategoryFields
    }
    totalCategories(search: $search)
  }
  ${CATEGORY_FIELDS}
`;

// Provider Queries
export const GET_PROVIDERS = gql`
  query GetProviders(
    $search: String
    $limit: Int
    $offset: Int
    $orderBy: ProviderOrderBy
    $sortOrder: SortOrder
  ) {
    providers(
      search: $search
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      sortOrder: $sortOrder
    ) {
      ...ProviderFields
    }
    totalProviders(search: $search)
  }
  ${PROVIDER_FIELDS}
`;

// Dedicated lightweight queries for select options
export const GET_CATEGORIES_FOR_SELECT = gql`
  query GetCategoriesForSelect($limit: Int) {
    categories(limit: $limit) {
      id
      name
    }
  }
`;

export const GET_PROVIDERS_FOR_SELECT = gql`
  query GetProvidersForSelect($limit: Int) {
    providers(limit: $limit) {
      id
      name
    }
  }
`;

// Dashboard Data Query (optimised to load all stats, alerts, and complete product summary in one roundtrip)
export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    totalProducts
    totalCategories
    totalProviders
    # We fetch a list of products with limit 5 ordered by stock ascending to find low-stock alerts
    lowStockProducts: products(limit: 5, orderBy: stock, sortOrder: asc) {
      id
      name
      stock
      price
      status
    }
    # We fetch some products to compute client-side distribution if needed, but keeping it minimal
    recentProducts: products(limit: 5, orderBy: id, sortOrder: desc) {
      id
      name
      price
      status
      category {
        name
      }
    }
    # Fetch all products with limit -1 to prevent pagination limit from skewing warehouse/inventory aggregates
    allProducts: products(limit: -1) {
      id
      price
      stock
      status
      category {
        id
        name
      }
      provider {
        id
        name
      }
    }
  }
`;

// --- Mutations ---

// Product Mutations
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(createProductInput: $input) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(updateProductInput: $input) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export const ACTIVATE_PRODUCT = gql`
  mutation ActivateProduct($id: Int!) {
    activateProduct(id: $id) {
      id
      status
    }
  }
`;

export const DEACTIVATE_PRODUCT = gql`
  mutation DeactivateProduct($id: Int!) {
    deactivateProduct(id: $id) {
      id
      status
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: Int!) {
    deleteProduct(id: $id) {
      id
    }
  }
`;

// Category Mutations
export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(createCategoryInput: $input) {
      ...CategoryFields
    }
  }
  ${CATEGORY_FIELDS}
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($input: UpdateCategoryInput!) {
    updateCategory(updateCategoryInput: $input) {
      ...CategoryFields
    }
  }
  ${CATEGORY_FIELDS}
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: Int!) {
    deleteCategory(id: $id) {
      id
    }
  }
`;

// Provider Mutations
export const CREATE_PROVIDER = gql`
  mutation CreateProvider($input: CreateProviderInput!) {
    createProvider(createProviderInput: $input) {
      ...ProviderFields
    }
  }
  ${PROVIDER_FIELDS}
`;

export const UPDATE_PROVIDER = gql`
  mutation UpdateProvider($input: UpdateProviderInput!) {
    updateProvider(updateProviderInput: $input) {
      ...ProviderFields
    }
  }
  ${PROVIDER_FIELDS}
`;

export const DELETE_PROVIDER = gql`
  mutation DeleteProvider($id: Int!) {
    deleteProvider(id: $id) {
      id
    }
  }
`;


