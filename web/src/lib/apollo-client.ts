import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

// Set up the GraphQL endpoint. We default to http://localhost:3000/graphql which is the typical NestJS setup.
const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_API_URL || "http://localhost:3000/graphql",
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // We can configure custom cache settings here if needed
        },
      },
    },
  }),
});
