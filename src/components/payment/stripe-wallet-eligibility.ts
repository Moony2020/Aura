export type ExpressWalletEligibility = {
  applePay?: boolean;
  googlePay?: boolean;
};

export function getEligibleExpressWallets(input?: ExpressWalletEligibility) {
  return {
    applePay: input?.applePay === true,
    googlePay: input?.googlePay === true,
  };
}

export function hasEligibleExpressWallet(input?: ExpressWalletEligibility) {
  const eligible = getEligibleExpressWallets(input);
  return eligible.applePay || eligible.googlePay;
}
