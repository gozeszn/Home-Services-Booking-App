const MAX_PRICE = 1_000_000_000;
const PRICING_UNITS = ["visit", "hour", "job", "day"];
const LEGACY_UNITS = { "per hour": "hour", "per service": "job", "per day": "day" };

function normalizePricingUnit(value) {
  return LEGACY_UNITS[value] || value;
}

function isValidPrice(value) {
  return typeof value === "number" && Number.isFinite(value) &&
    value >= 0 && value <= MAX_PRICE &&
    value === Number(value.toFixed(2));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { MAX_PRICE, PRICING_UNITS, LEGACY_UNITS, normalizePricingUnit, isValidPrice, escapeRegex };
