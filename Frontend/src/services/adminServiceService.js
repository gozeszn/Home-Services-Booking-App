import { services } from "../mocks/services";

const PREFIX = "homeServices.demoAdminServices.";

function storageKey(admin) {
  if (!admin?.id || admin.role !== "admin") {
    throw new Error("An administrator account is required.");
  }

  return `${PREFIX}${admin.id}`;
}

function writeServices(admin, records) {
  const key = storageKey(admin);

  try {
    sessionStorage.setItem(key, JSON.stringify(records));
  } catch {
    throw new Error(
      "Could not save demo services. Check your browser storage settings."
    );
  }
}

function readServices(admin) {
  const key = storageKey(admin);
  let raw;

  try {
    raw = sessionStorage.getItem(key);
  } catch {
    throw new Error("Could not read demo services.");
  }

  if (raw === null) {
    const records = services.map((service, index) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      providerName: service.provider.displayName,
      categoryId: service.categoryId,
      location: service.location,
      price: service.price,
      currency: service.currency,
      pricingUnit: service.pricingUnit,

      // Admin moderation is separate from provider availability.
      moderationStatus: index === 1 ? "disabled" : "enabled",
      moderationReason:
        index === 1 ? "Demo listing awaiting updated service information." : "",
      moderationHistory: [],
    }));

    writeServices(admin, records);
    return records;
  }

  let records;

  try {
    records = JSON.parse(raw);
  } catch {
    throw new Error("Saved demo service data is invalid.");
  }

  const valid =
    Array.isArray(records) &&
    records.every(
      (record) =>
        record &&
        typeof record.id === "string" &&
        typeof record.title === "string" &&
        typeof record.providerName === "string" &&
        typeof record.description === "string" &&
        typeof record.location === "string" &&
        typeof record.price === "number" &&
        Number.isFinite(record.price) &&
        typeof record.currency === "string" &&
        typeof record.moderationReason === "string" &&
        ["enabled", "disabled"].includes(record.moderationStatus) &&
        Array.isArray(record.moderationHistory) &&
        record.moderationHistory.every(
          (entry) =>
            entry &&
            ["enabled", "disabled"].includes(entry.from) &&
            ["enabled", "disabled"].includes(entry.to) &&
            typeof entry.reason === "string" &&
            typeof entry.changedAt === "string"
        )
    );

  if (!valid) {
    throw new Error("Saved demo service data is invalid.");
  }

  return records;
}

export async function getAdminServices(admin) {
  return readServices(admin);
}

export async function updateServiceModeration(
  admin,
  serviceId,
  { status, reason, expectedStatus }
) {
  if (!["enabled", "disabled"].includes(status)) {
    throw new Error("Invalid moderation status.");
  }

  const cleanReason = typeof reason === "string" ? reason.trim() : "";

  if (cleanReason.length < 5 || cleanReason.length > 500) {
    throw new Error("Provide a reason between 5 and 500 characters.");
  }

  const records = readServices(admin);
  const selected = records.find((service) => service.id === serviceId);

  if (!selected) {
    throw new Error("Service not found.");
  }

  if (selected.moderationStatus !== expectedStatus) {
    throw new Error("This listing has changed. Reload the page and try again.");
  }

  if (selected.moderationStatus === status) {
    throw new Error(`This service is already ${status}.`);
  }

  const changedAt = new Date().toISOString();

  const updated = {
    ...selected,
    moderationStatus: status,
    moderationReason: cleanReason,
    updatedAt: changedAt,
    moderationHistory: [
      ...selected.moderationHistory,
      {
        from: selected.moderationStatus,
        to: status,
        reason: cleanReason,
        changedAt,
        changedBy: admin.id,
      },
    ],
  };

  writeServices(
    admin,
    records.map((service) => (service.id === serviceId ? updated : service))
  );

  return updated;
}