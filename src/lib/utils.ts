export function classNames(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function toCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function getMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function normalizeToMonthlyValue(planType: "monthly" | "yearly", monthlyPrice: number, yearlyPrice: number) {
  if (planType === "monthly") {
    return monthlyPrice;
  }

  return yearlyPrice / 12;
}
