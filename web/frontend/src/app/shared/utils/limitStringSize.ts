export function limitStringLength(str: string, limit: number) {
  if (str.length <= limit) {
    return str;
  } else {
    return `${str.slice(0, limit - 3)}...`
  }
}