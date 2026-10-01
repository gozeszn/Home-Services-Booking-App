const PREFIX = "homeServices.demoProviderBookings.";

const transitions = {
  pending: ["accepted", "rejected"],
  accepted: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
};

function storageKey(providerId) {
  if (!providerId) {
    throw new Error("Please log in to manage booking requests.");
  }

  return `${PREFIX}${providerId}`;
}

function createDemoBookings(providerId) {
  const now = new Date().toISOString();

  function appointment(daysFromToday) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    date.setHours(10, 0, 0, 0);
    return date.toISOString();
  }

  return [
    {
      id: crypto.randomUUID(),
      providerId,
      serviceTitle: "Standard home cleaning",
      customerName: "Demo Customer A",
      scheduledAt: appointment(2),
      serviceAddress: "12 Example Street, Lagos",
      customerNote: "Please focus on the kitchen and living room.",
      agreedPrice: 15000,
      currency: "NGN",
      pricingUnit: "visit",
      status: "pending",
      paymentStatus: "unpaid",
      createdAt: now,
      updatedAt: now,
      statusHistory: [],
    },
    {
      id: crypto.randomUUID(),
      providerId,
      serviceTitle: "Deep home cleaning",
      customerName: "Demo Customer B",
      scheduledAt: appointment(3),
      serviceAddress: "8 Sample Avenue, Lagos",
      customerNote: "",
      agreedPrice: 35000,
      currency: "NGN",
      pricingUnit: "visit",
      status: "accepted",
      paymentStatus: "unpaid",
      createdAt: now,
      updatedAt: now,
      statusHistory: [],
    },
    {
      id: crypto.randomUUID(),
      providerId,
      serviceTitle: "Standard home cleaning",
      customerName: "Demo Customer C",
      scheduledAt: appointment(0),
      serviceAddress: "5 Practice Close, Lagos",
      customerNote: "Demo request for testing completion.",
      agreedPrice: 15000,
      currency: "NGN",
      pricingUnit: "visit",
      status: "in_progress",
      paymentStatus: "unpaid",
      createdAt: now,
      updatedAt: now,
      statusHistory: [],
    },
  ];
}

function writeBookings(providerId, bookings) {
  try {
    sessionStorage.setItem(
      storageKey(providerId),
      JSON.stringify(bookings)
    );
  } catch {
    throw new Error(
      "Unable to save demo requests. Check that browser storage is available."
    );
  }
}

function readBookings(providerId) {
  const key = storageKey(providerId);
  let saved;

  try {
    saved = sessionStorage.getItem(key);
  } catch {
    throw new Error("Unable to access demo booking storage.");
  }

  if (saved === null) {
    const initial = createDemoBookings(providerId);
    writeBookings(providerId, initial);
    return initial;
  }

  try {
    const bookings = JSON.parse(saved);

    if (
      !Array.isArray(bookings) ||
      bookings.some(
        (booking) =>
          !booking ||
          booking.providerId !== providerId ||
          !Object.hasOwn(transitions, booking.status) ||
          !Array.isArray(booking.statusHistory)
      )
    ) {
      throw new Error("Invalid booking data");
    }

    return bookings;
  } catch {
    throw new Error("Unable to read the saved demo booking requests.");
  }
}

export async function getProviderBookings(providerId) {
  return readBookings(providerId).sort(
    (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)
  );
}

export async function updateProviderBookingStatus(
  providerId,
  bookingId,
  nextStatus,
  reason = ""
) {
  const bookings = readBookings(providerId);
  const booking = bookings.find((item) => item.id === bookingId);

  if (!booking) {
    throw new Error("This booking could not be found.");
  }

  if (!transitions[booking.status].includes(nextStatus)) {
    throw new Error(
      "This action is no longer available for the booking."
    );
  }

  const trimmedReason = reason.trim();

  if (trimmedReason.length > 500) {
    throw new Error("The reason must not exceed 500 characters.");
  }

  const now = new Date().toISOString();

  const updated = {
    ...booking,
    status: nextStatus,
    updatedAt: now,
    statusHistory: [
      ...booking.statusHistory,
      {
        from: booking.status,
        to: nextStatus,
        reason: trimmedReason,
        changedAt: now,
      },
    ],
  };

  writeBookings(
    providerId,
    bookings.map((item) =>
      item.id === bookingId ? updated : item
    )
  );

  return updated;
}