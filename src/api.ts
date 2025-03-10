import { FunctionReference, anyApi } from "convex/server";
import { GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  mcps: {
    get_configuration: FunctionReference<
      "query",
      "public",
      { api_key: string },
      any
    >;
    list_nodes_as_resources: FunctionReference<
      "query",
      "public",
      { api_key: string; brain_ids: Array<Id<"brains">> },
      any
    >;
    get_node_context: FunctionReference<
      "query",
      "public",
      { api_key: string; node_id: string },
      any
    >;
  };
};
export type InternalApiType = {};
