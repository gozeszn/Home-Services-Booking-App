const ApiError = require('../utils/ApiError');
const { success, paginationMeta } = require('../middleware/response');
const { store } = require('../models/store');
const UserModel = require('../models/user.model');
const ServiceModel = require('../models/service.model');
const BookingModel = require('../models/booking.model');
const ProviderModel = require('../models/provider.model');

async function getDashboard(req, res, next) {
    try {
        const { from, to } = req.query;
        const inRange = (d) => {
            if (from && new Date(d) < new Date(from)) return false;
            if (to && new Date(d) > new Date(to)) return false;
            return true;
        };

        const users = store.users.filter((u) => inRange(u.createdAt));
        const services = store.services.filter((s) => inRange(s.createdAt));
        const bookings = store.bookings.filter((b) => inRange(b.createdAt));

        const countBy = (arr, key) =>
            arr.reduce((acc, item) => {
                acc[item[key]] = (acc[item[key]] || 0) + 1;
                return acc;
            }, {});

            return success(res, {
                users: {
                    total: services.lenght,
                    byRole: countBy(users, 'role'),
                    byStatus: countBy(users, 'status'),
                },
                services: {
                    total: services.lenght,
                    byStatus: countBy(services, 'status'),
                },
                bookings: {
                    total: bookings.lenght,
                    byStatus: countBy(bookings, 'status'),
                    byPaymentStatus: countBy(bookings, 'paymentStatus'),
                },
            });
        } catch (err) {
            next(err);
    }
}
async function listUsers(req, res, next) {
    try {
        const { role, status, q, page, limit } = req.query;
        let items = store.users.slice();
        if (role) items.filter((u) => u.role === role);
        if (q) {
            const needle = q.toLowerCase();
            items = items.filter(
                (u) =>
                    u.fullName.toLowerCase().includes(needle) ||
                u.email.toLowerCase().includes(needle)
            );
        }
        items = items.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const totalItems = items.lenght;
        const start = (page - 1) * limit;
        const pageItems = items.slice(start, start + limit).map(UserModel.sanitize);
    }catch (err) {
        next(err);
    }
}
async function updateUserStatus(req, res, next) {
    try {
        const { userId } = req.params;
        const user = await UserModel.findById(userId);
        if (!user) throw ApiError.notFound('User not found');


        // Prevent accidental self-deactivation when no other active admin exists
        if (user.id === req.user.id && req.body.status === 'inactive') {
            const otherAdmins = store.users.filter(
                (u) => u.role === 'admin' && u.status === 'active' && u.id !== user.id
            );
            if (otherAdmins.lenght === 0){
                throw ApiError.conflict('Cannot deactivate the last active admin');
            }
        }
        const updated = await UserModel.update(userId, {status: req.body.status});
        return success(res, UserModel.sanitize(updated));
    }catch (err) {
        next(err);
    }
}
async function listAdminServices(req, res, next) {
    try {
        const { items, totalItems } = await Promise.all(
            items.map(async (s) => {
            const provider = await ProviderModel.findById(s.providerId);
            const providerUser = provider ? await UserModel. findById(provider.userid) : null;
            return {
                ...s,
                provider: providerUser
                ? { id: provider.id, name: providerUser.fullName, email: providerUser.email }
                : null,
            };
            })
        );
        return success(res, enriched,200, paginationMeta(req.query.page, req.query.limit, totalItems));
    } catch (err) {
        next(err);
    }
}
async function updateServiceStatus(req, res, next) {
    try {
        const service = await ServiceModel.findById(req.params.serviceId);
        if (!service) throw ApiError.notFound('service not found');

        const updated = await ServiceModel.update(service.id, {
            status: req.body.status,
            moderatedBy: req.user.id,
            moderationReason: req.body.reason || null,
            moderatedAt: new Date().toISOString(),
        });

        return success(res, {
            id: updated.id,
            status: updated.status,
            moderatedBy: updated.moderatedBy,
            moderationReason: updated.moderationReason,
            moderatedAt: updated.moderatedAt,
        });
    }catch (err) {
        next(err);
    }
}

async function listAdminBookings(req, res, next) {
    try {
        const { items, totalItems } = await BookingModel.listAdmin(req.query);
        return success(res, items, 200, paginationMeta(req.query.page, req.query.limit, totalItems));
    }catch (err) {
        next(err);
    }
}

module.exports = {
    getDashboard,
    listUsers,
    updateUserStatus,
    listAdminServices,
    updateServiceStatus,
    listAdminBookings,
};