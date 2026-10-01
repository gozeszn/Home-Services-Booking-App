const DEMO_BOOKINGS = [
  {
    id: "demo-booking-001",
    serviceTitle: "Standard home cleaning",
    customerName: "Demo Customer A",
    providerName: "Fresh Space Cleaning",
    scheduledAt: "2026-10-05T09:00:00+01:00",
    serviceAddress: "10 Example Street, Lagos",
    customerNote: "Please bring cleaning supplies.",
    agreedPrice: 15000,
    currency: "NGN",
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: "2026-09-28T10:00:00+01:00",
  },
  {
    id: "demo-booking-002",
    serviceTitle: "Tap and pipe repairs",
    customerName: "Demo Customer B",
    providerName: "Reliable Plumbing",
    scheduledAt: "2026-10-06T11:00:00+01:00",
    serviceAddress: "20 Sample Avenue, Lagos",
    customerNote: "Kitchen tap requires inspection.",
    agreedPrice: 10000,
    currency: "NGN",
    status: "accepted",
    paymentStatus: "unpaid",
    createdAt: "2026-09-27T14:00:00+01:00",
  },
  {
    id: "demo-booking-003",
    serviceTitle: "Electrical fault inspection",
    customerName: "Demo Customer C",
    providerName: "Bright Home Electrical",
    scheduledAt: "2026-09-29T10:00:00+01:00",
    serviceAddress: "30 Demo Road, Abuja",
    customerNote: "",
    agreedPrice: 12000,
    currency: "NGN",
    status: "in_progress",
    paymentStatus: "unpaid",
    createdAt: "2026-09-26T09:00:00+01:00",
  },
  {
    id: "demo-booking-004",
    serviceTitle: "Garden maintenance",
    customerName: "Demo Customer D",
    providerName: "Green Yard Services",
    scheduledAt: "2026-09-25T08:00:00+01:00",
    serviceAddress: "40 Example Close, Ibadan",
    customerNote: "Small front garden.",
    agreedPrice: 18000,
    currency: "NGN",
    status: "completed",
    paymentStatus: "paid",
    createdAt: "2026-09-22T12:00:00+01:00",
  },
  {
    id: "demo-booking-005",
    serviceTitle: "Deep home cleaning",
    customerName: "Demo Customer E",
    providerName: "Clean Corner",
    scheduledAt: "2026-09-24T09:00:00+01:00",
    serviceAddress: "50 Sample Lane, Abuja",
    customerNote: "",
    agreedPrice: 35000,
    currency: "NGN",
    status: "cancelled",
    paymentStatus: "unpaid",
    createdAt: "2026-09-21T16:00:00+01:00",
  },
  {
    id: "demo-booking-006",
    serviceTitle: "Bathroom plumbing inspection",
    customerName: "Demo Customer F",
    providerName: "Everyday Plumbing",
    scheduledAt: "2026-09-23T13:00:00+01:00",
    serviceAddress: "60 Demo Crescent, Ibadan",
    customerNote: "",
    agreedPrice: 8000,
    currency: "NGN",
    status: "rejected",
    paymentStatus: "unpaid",
    createdAt: "2026-09-20T11:00:00+01:00",
  },
];

export async function getAdminBookings(admin) {
  if (!admin?.id || admin.role !== "admin") {
    throw new Error("An administrator account is required.");
  }

  // Independent fixtures, not live customer or provider bookings.
  return DEMO_BOOKINGS.map((booking) => ({ ...booking })).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}