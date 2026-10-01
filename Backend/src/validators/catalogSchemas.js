const { z } = require("zod");
const { MAX_PRICE, isValidPrice } = require("../utils/catalogRules");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid identifier");
const searchText = z.string().trim().max(100).optional();
const integerQuery = (max) => z.string().regex(/^[1-9]\d*$/, "Use a positive integer")
  .transform(Number).pipe(z.number().int().min(1).max(max));
const pagination = {
  page: integerQuery(100000).default(1),
  limit: integerQuery(50).default(10),
};
const priceQuery = z.string().regex(/^\d+(?:\.\d{1,2})?$/, "Use a non-negative price with at most two decimals")
  .transform(Number).pipe(z.number().max(MAX_PRICE).refine(isValidPrice));

const publicServicesQuery = z.object({
  q: searchText,
  category: objectId.optional(),
  location: z.string().trim().max(200).optional(),
  minPrice: priceQuery.optional(),
  maxPrice: priceQuery.optional(),
  sort: z.enum(["title", "newest", "price-asc", "price-desc", "price_asc", "price_desc"])
    .default("title").transform((value) => value.replace("_", "-")),
  ...pagination,
}).strict().refine(
  (value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice,
  { message: "minPrice must not exceed maxPrice", path: ["minPrice"] }
);

const ownServicesQuery = z.object({
  status: z.enum(["active", "inactive"]).optional(),
  ...pagination,
}).strict();

module.exports = {
  objectId,
  publicServicesQuery,
  ownServicesQuery,
  providerServicesQuery: z.object(pagination).strict(),
  categoriesQuery: z.object({ q: searchText }).strict(),
  serviceParams: z.object({ serviceId: objectId }).strict(),
  providerParams: z.object({ providerId: objectId }).strict(),
};
