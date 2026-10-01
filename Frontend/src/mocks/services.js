export const categories = [
  { id: "cleaning", name: "Cleaning" },
  { id: "plumbing", name: "Plumbing" },
  { id: "electrical", name: "Electrical" },
  { id: "gardening", name: "Gardening" },
];

export const services = [
  {
    id: "service-1",
    title: "Standard home cleaning",
    description:
      "General cleaning for your living spaces, kitchen, and bathrooms. Cleaning materials are included.",
    categoryId: "cleaning",
    location: "Lagos",
    price: 15000,
    currency: "NGN",
    pricingUnit: "visit",
    availabilitySummary: "Monday to Saturday, 9am to 5pm",
    provider: {
      id: "provider-1",
      displayName: "Fresh Space Cleaning",
    },
  },
  {
    id: "service-2",
    title: "Tap and pipe repairs",
    description:
      "Inspection and repair of leaking taps and accessible household pipes. Replacement parts are quoted separately.",
    categoryId: "plumbing",
    location: "Lagos",
    price: 10000,
    currency: "NGN",
    pricingUnit: "visit",
    availabilitySummary: "Monday to Friday, 8am to 6pm",
    provider: {
      id: "provider-2",
      displayName: "Reliable Plumbing",
    },
  },
  {
    id: "service-3",
    title: "Electrical fault inspection",
    description:
      "Inspection of household electrical faults and a clear explanation of recommended repairs. Repair work is quoted separately.",
    categoryId: "electrical",
    location: "Abuja",
    price: 12000,
    currency: "NGN",
    pricingUnit: "visit",
    availabilitySummary: "Monday to Saturday, 9am to 5pm",
    provider: {
      id: "provider-3",
      displayName: "Bright Home Electrical",
    },
  },
  {
    id: "service-4",
    title: "Garden maintenance",
    description:
      "Routine lawn care, weeding, and light pruning for small residential gardens.",
    categoryId: "gardening",
    location: "Ibadan",
    price: 18000,
    currency: "NGN",
    pricingUnit: "visit",
    availabilitySummary: "Tuesday to Saturday, 8am to 4pm",
    provider: {
      id: "provider-4",
      displayName: "Green Yard Services",
    },
  },
  {
    id: "service-5",
    title: "Deep home cleaning",
    description:
      "Detailed cleaning of kitchens, bathrooms, floors, and reachable surfaces. Suitable for an occasional thorough clean.",
    categoryId: "cleaning",
    location: "Abuja",
    price: 35000,
    currency: "NGN",
    pricingUnit: "visit",
    availabilitySummary: "Monday to Saturday, 9am to 5pm",
    provider: {
      id: "provider-5",
      displayName: "Clean Corner",
    },
  },
  {
    id: "service-6",
    title: "Bathroom plumbing inspection",
    description:
      "Inspection of bathroom taps, drainage, and visible plumbing connections. Includes a written repair recommendation.",
    categoryId: "plumbing",
    location: "Ibadan",
    price: 8000,
    currency: "NGN",
    pricingUnit: "visit",
    availabilitySummary: "Monday to Friday, 9am to 5pm",
    provider: {
      id: "provider-6",
      displayName: "Everyday Plumbing",
    },
  },
];