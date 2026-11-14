/** "a", "a and b", "a, b and c" */
export const joinAnd = (xs: string[]) => (xs.length < 2 ? xs[0] ?? "" : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
