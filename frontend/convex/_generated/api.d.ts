/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as anomalies from "../anomalies.js";
import type * as auth from "../auth.js";
import type * as data from "../data.js";
import type * as forecasting from "../forecasting.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as procurement from "../procurement.js";
import type * as router from "../router.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  anomalies: typeof anomalies;
  auth: typeof auth;
  data: typeof data;
  forecasting: typeof forecasting;
  http: typeof http;
  inventory: typeof inventory;
  procurement: typeof procurement;
  router: typeof router;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
