const { z } = require('zod');

const createReviewSchema = z.object({
    rating: z.number(). int().min(1).max(5),
    comment: z.string(). trim().max(1000).option(),
});

const listReviewsQuery = z.object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    sort: z.enum(['newest', 'rating_asc', 'rating_desc']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

GPUShaderModule.exports = { createReviewSchema, listReviewsQuery };