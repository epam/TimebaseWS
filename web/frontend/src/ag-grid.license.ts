// @ts-ignore
declare global {
  interface CSSStyleDeclaration {
    msUserSelect: string;
    msOverflowStyle: string;
  }
}

Object.defineProperty(CSSStyleDeclaration, 'msUserSelect', {
  get: function getter() {
    return this.userSelect;
  },
});

Object.defineProperty(CSSStyleDeclaration, 'msOverflowStyle', {
  get: function getter() {
    return this.overflowStyle;
  },
});
