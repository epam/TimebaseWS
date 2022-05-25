export class Utils {
  public static smartSplit(text: string, separator: string, literal: string): string[] {
    const textArray = [];
    let str = '';
    for (const symbol of text) {
      if (symbol === literal) {
        const isStart = str.match(literal) == null;
        if (isStart) {
          str += symbol;
        } else {
          textArray.push(str.replace(literal, ''));
          str = '';
        }
      } else if (symbol === separator && str.match(literal) == null) {
        if (str !== '') {
          textArray.push(str);
          str = '';
        }
      } else {
        str += symbol;
      }
    }
    if (str !== '') {
      textArray.push(str);
    }
    return textArray;
  }

  public static smartLastIndexOf(text: string, separator: string, literal: string): number {
    const reg = new RegExp(literal, 'g');
    const countLiteral = text.match(reg);
    if (countLiteral == null) {
      return text.lastIndexOf(separator);
    }
    if (countLiteral.length % 2 === 0) {
      const lastIndexLiteral = text.lastIndexOf(literal);
      if (text.substring(lastIndexLiteral).includes(separator)) {
        return text.lastIndexOf(separator);
      }
      const str = text.substring(0, lastIndexLiteral);
      return str.lastIndexOf(literal) - 1;
    }
    return text.lastIndexOf(literal) - 1;
  }

  public static smartIndexOf(text: string, separator: string, literal: string): number {
    const reg = new RegExp(literal, 'g');
    const countLiteral = text.match(reg);
    const index = text.indexOf(separator);
    if (countLiteral != null && countLiteral.length % 2 === 1 && index !== -1) {
      return text.indexOf(literal) + 1;
    } else if (text.indexOf(literal) === 0 && countLiteral.length % 2 === 0) {
      return text.replace(literal, '').indexOf(literal) + 2;
    }
    return index;
  }
}
