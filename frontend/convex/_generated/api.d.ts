/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as anomalies from "../anomalies.js";
import type * as auth from "../auth.js";
import type * as data from "../data.js";
import type * as forecasting from "../forecasting.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as procurement from "../procurement.js";
import type * as router from "../router.js";

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
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
