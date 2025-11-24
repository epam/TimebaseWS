export function formatArray(array: any[], locale: string) {
  return array.map(item => {
    if (Math.abs(item) >= 1000 && Math.abs(item) <= Number.MAX_SAFE_INTEGER) {
      return parseFloat(item).toLocaleString(locale);
    } else if (item && typeof item === 'object') {
      return formatObject(item, locale);
    } else if (Array.isArray(item)) {
      return formatArray(item, locale);
    } else {
      return item;
    }
  });
}

export function formatObject(object: object, locale: string) {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => {
      let formattedValue = value;
      if (Math.abs(value) >= 1000 && Math.abs(value) <= Number.MAX_SAFE_INTEGER) {
        formattedValue = parseFloat(value).toLocaleString(locale);
      } else if (value && typeof value === 'object') {
        formattedValue = formatObject(value, locale);
      } else if (Array.isArray(value)) {
        formattedValue = formatArray(value, locale);
      }
      return [key, formattedValue];
    })
  );
}

export function JSONisValid(value: string) {
  try {
    JSON.parse(value);
  } catch (e) {
    return false;
  }
  return true;
}