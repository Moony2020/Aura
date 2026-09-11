export type MinorUnitMoney = {
  amount: number;
  currency: string;
};

export function formatMinorUnitMoney(money: MinorUnitMoney) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: money.currency }).format(money.amount / 100);
}

export function majorUnitToMinorUnit(value: number) {
  return Math.round(value * 100);
}

export function minorUnitToMajorUnit(value: number | null) {
  return value === null ? null : value / 100;
}

