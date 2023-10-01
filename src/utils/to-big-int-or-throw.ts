export const toBigIntOrThrow = (value: string | undefined): bigint => {
  if (value === undefined || !/^\d+$/.test(value)) {
    throw new Error(`Invalid number for conversion to BigInt: ${value}`);
  }
  return BigInt(value);
};
