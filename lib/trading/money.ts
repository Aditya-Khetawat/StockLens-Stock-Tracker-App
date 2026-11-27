/**
 * Round a dollar amount to whole cents. Applied to every stored balance and
 * trade total so floating-point noise (0.1 + 0.2) never reaches the database.
 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
