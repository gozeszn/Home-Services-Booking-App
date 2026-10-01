import { getService } from "./serviceService";
import { services as demoServices } from "../mocks/services";

const STORAGE_PREFIX = "homeServices.demoBookings.";

export const USING_MOCK_BOOKINGS = true;

function getStorageKey(userId) {
  if (!userId) {
    throw new Error("Please log in before managing bookings.");
  }

  return `${STORAGE_PREFIX}${userId}`;
}

function readBookings(userId) {
  try {
    const saved = sessionStorage.getItem(getStorageKey(userId));

    if (!saved) return [];

    const bookings = JSON.parse(saved);

    if (!Array.isArray(bookings)) {
      throw new Error("Invalid booking data");
    }

    return bookings;
  } catch {
    throw new Error(
      "Unable to read demo bookings from this browser session."
    );
  }
}

function writeBookings(userId, bookings) {
  try {
    sessionStorage.setItem(
      getStorageKey(userId),
      JSON.stringify(bookings)
    );
  } catch {
    throw new Error(
      "Unable to save demo bookings. Check that browser storage is available."
    );
  }
}

export async function getMyBookings(userId) {
  return readBookings(userId).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export async function createBooking(userId, details) {
  const service = await getService(details.serviceId);
  const scheduledAt = new Date(details.scheduledAt);

  if (
    !Number.isFinite(scheduledAt.getTime()) ||
    scheduledAt.getTime() <= Date.now()
  ) {
    throw new Error("Choose a future date and time.");
  }

  const serviceAddress = details.serviceAddress.trim();
  const customerNote = details.customerNote.trim();

  if (serviceAddress.length < 10 || serviceAddress.length > 300) {
    throw new Error("Enter an address between 10 and 300 characters.");
  }

  if (customerNote.length > 1000) {
    throw new Error("Your note must not exceed 1,000 characters.");
  }

  const booking = {
    id: crypto.randomUUID(),
    customerId: userId,
    serviceId: service.id,
    serviceTitle: service.title,
    providerName: service.provider.displayName,
    agreedPrice: service.price,
    currency: service.currency,
    pricingUnit: service.pricingUnit,
    scheduledAt: scheduledAt.toISOString(),
    serviceAddress,
    customerNote,
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: new Date().toISOString(),
  };

  const existing = readBookings(userId);
  writeBookings(userId, [booking, ...existing]);

  return booking;
}

export async function cancelBooking(userId, bookingId) {
  const bookings = readBookings(userId);
  const booking = bookings.find((item) => item.id === bookingId);

  if (!booking) {
    throw new Error("This booking could not be found.");
  }

  if (!["pending", "accepted"].includes(booking.status)) {
    throw new Error("This booking can no longer be cancelled.");
  }

  const updated = {
    ...booking,
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };

  writeBookings(
    userId,
    bookings.map((item) =>
      item.id === bookingId ? updated : item
    )
  );

  return updated;
}

export async function addCompletedDemoBooking(userId) {
  const bookings = readBookings(userId);
  const fixtureId = `completed-demo-${userId}`;

  const existing = bookings.find(
    (booking) => booking.id === fixtureId
  );

  if (existing) {
    return existing;
  }

  const service = demoServices.find((item) => item.id === "service-1");

  if (!service) {
    throw new Error("The completed-booking demo fixture is unavailable.");
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const booking = {
    id: fixtureId,
    customerId: userId,
    serviceId: service.id,
    serviceTitle: service.title,
    providerName: service.provider.displayName,
    agreedPrice: service.price,
    currency: service.currency,
    pricingUnit: service.pricingUnit,
    scheduledAt: yesterday.toISOString(),
    serviceAddress: "12 Example Street, Lagos",
    customerNote: "Completed sample booking for testing reviews.",
    status: "completed",
    paymentStatus: "unpaid",
    createdAt: yesterday.toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeBookings(userId, [booking, ...bookings]);

  return booking;
}