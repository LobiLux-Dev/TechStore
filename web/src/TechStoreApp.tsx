import { ApolloProvider } from "@apollo/client/react";
import { RouterProvider } from "@tanstack/react-router";
import { client } from "@/lib/apollo-client";
import { router } from "@/lib/router";

export function TechStoreApp() {
  return (
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>
  );
}
