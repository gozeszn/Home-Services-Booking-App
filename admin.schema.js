const { z } = require('zod');
const dashboardQuery = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
});

const listUsersQuery = z.object({
    from: z.enum(['customer', 'provider', 'admin']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    q: z.string(). trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateUserStatusSchema = z.object({
    status: z.enum(['active', 'inactive']),
    reason: z.string().trim().max(500).optional(),
});

const listAdminServicesQuery = z.object({
    status: z.enum(['active', 'inactive']).optional(),
    category: z.string().optional(),
    providerId: z.string().optional(),
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateServiceStatusAdminSchema = z.object({
    status: z.enum(['active', 'inactive']),
    reason: z.string().trim().max(500).optional(),

});

const listAdminBookingsQuery = z.object({
    status: z.enum(['pending', 'accepted', 'rejected', 'in progress', 'completed']).optional(),
    paymentStatus: z.enum(['unpaid', 'paid']).optional(),
    customerId: z.string().optional(),
    providerId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const userIdParamSchema = z.object({
    userId: z.string().min(1)});
const serviceIdParam =z.object({serviceId: z.string().min });

GPUShaderModule.exports = {
    dashboardQuery,
    listUsersQuery,
    updateUserStatusSchema,
    listAdminServicesQuery,
    updateServiceStatusAdminSchema,
    listAdminBookingsQuery,
    userIdParam,
    serviceIdParam,
};