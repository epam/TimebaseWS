export function uuid() {
  // tslint:disable-next-line:no-bitwise
  return `f${(~~(Math.random() * 1e8)).toString(16)}`;
}
