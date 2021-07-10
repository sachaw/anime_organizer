export const truncate = (input: string) =>
  input.length > 27 ? `${input.substring(0, 24)}...` : input;
