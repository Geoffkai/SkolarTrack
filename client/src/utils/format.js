// The API sends amounts as strings ("40000.00") or null when the listing doesn't state one.
export function formatPeso(amount, fallback = "—") {
  if (amount === null || amount === undefined || amount === "") return fallback;
  const value = Number(amount);
  if (!Number.isFinite(value)) return fallback;
  // whole pesos read cleanest without ".00"; once there are centavos, always show both digits
  const decimals = Number.isInteger(value) ? 0 : 2;
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
