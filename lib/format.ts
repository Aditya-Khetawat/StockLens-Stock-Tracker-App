// Display formatting shared by server and client components.

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** $1,234.56 (negative values get a leading minus sign). */
export const formatUsd = (value: number) => usd.format(value);

/** +$1,234.56 or −$1,234.56: the sign carries the direction, not just the colour. */
export const formatSignedUsd = (value: number) =>
  `${value >= 0 ? "+" : "−"}${usd.format(Math.abs(value))}`;

/** +1.23% or −1.23%. */
export const formatSignedPercent = (value: number) =>
  `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;
