export const walletKeys = {
  all: ["wallet"] as const,
  me: () => [...walletKeys.all, "me"] as const,
};
