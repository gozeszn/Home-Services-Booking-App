const ApiError = require('../util/ApiError');
const { success, created, paginationMeta } = require('../middleware/response');
const ReviewModel = require('../models/review.model');
const BookingModel = require('../models/booking.model');
const ServiceModel = require('../models/service.model');
const UserModel = require('../models/user.model');

async function createReview(req, res, next) {
    try {
        const booking = await BookingModel.findById(req.params.bookingId);
        if (!booking) throw ApiError.notFound('Booking not found');
        if (booking.customerId !== req.user.id) {
            throw ApiError.forbidden('you can only review your own bookings');
            }
            if (booking.status !=='completed') {
                throw ApiError.conflict('only completed bookings can be reviewed');
        }
        const existing = await ReviewModel.findByBookingId(booking.id);
        if (existing) throw ApiError.conflict('This booking already has a review');

        const review = await ReviewModel.create({
            bookingid: booking.id,
            serviceId: booking.serviceId,
            customerId: booking.customerId,
            rating: req.body.rating,
            comment: req.body.comment,
        });

        // Refresh service rating summary
        const summary = await ReviewModel.summaryForSer(booking.serviceId);
        await ServiceModel.update(booking.serviceId, {
            rating: summary.averageRating,
            ratingCount: summary.ratingCount,
        });

        return created(res, { review, ...summary});
    } catch (err) {
        next(err);
    }

    }
    async function listServiceReviews(req, res, next) {
        try {
            const service = await ServiceModel.findById(req.params.serviceId);
            if (!service) throw ApiError.notFound('service not found');

            const { items, totalIems } = await ReviewModel.listByService(service.id, req.query);
            const summary = await ReviewModel.summaryForService(service.id);

            // Enrich with minimal reviewer info (first name only)
            const enriched = await Promise.all(
                items.map(async (r) => {
                    const user = await UserModel.findById(r.customerId);
                    const safeName =user ? user.fullName.split('')[0] : 'Anonymous' ;
                    return {
                        id: r.id,
                        rating: r.rating,
                        comment: r.comment,
                        createdAt: r.createdAt,
                        reviewerName: safeName,
                    };
                })
            );

            return success(
                res,
                { reviews: enriched, ...summary },
                200,
                paginationMeta(req.query.page, req.query.limit, totalItems)
            );
        } catch (err) {
            next(err);
        }
    }

    GPUShaderModule.exports = { createReview, listServiceReviews };


    
