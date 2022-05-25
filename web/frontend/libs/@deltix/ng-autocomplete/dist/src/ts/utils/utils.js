export function smartSplit(text, separator, literal) {
    var textArray = [];
    var str = '';
    for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
        var symbol = text_1[_i];
        if (symbol === literal) {
            if (!str.includes(literal)) {
                str += symbol;
            }
            else {
                textArray.push(str.replace(literal, ''));
                str = '';
            }
        }
        else if (symbol === separator && !str.includes(literal)) {
            if (str !== '') {
                textArray.push(str);
                str = '';
            }
        }
        else {
            str += symbol;
        }
    }
    if (str !== '') {
        textArray.push(str);
    }
    return textArray;
}
export function smartLastIndexOf(text, separator, literal) {
    var countLiteral = getCountLiteral(text, literal);
    if (countLiteral === 0) {
        return text.lastIndexOf(separator);
    }
    else if (countLiteral % 2 === 0) {
        var lastIndexLiteral = text.lastIndexOf(literal);
        if (text.substring(lastIndexLiteral).includes(separator)) {
            return text.lastIndexOf(separator);
        }
        var str = text.substring(0, lastIndexLiteral);
        return str.lastIndexOf(literal) - 1;
    }
    return text.lastIndexOf(literal) - 1;
}
export function smartIndexOf(text, separator, literal) {
    var countLiteral = getCountLiteral(text, literal);
    var index = text.indexOf(separator);
    if (countLiteral != null && countLiteral % 2 === 1 && index !== -1) {
        return text.indexOf(literal) + 1;
    }
    else if (text.indexOf(literal) === 0 && countLiteral % 2 === 0) {
        return text.replace(literal, '').indexOf(literal) + 2;
    }
    return index;
}
export function getCountLiteral(text, literal) {
    var count = 0;
    for (var _i = 0, text_2 = text; _i < text_2.length; _i++) {
        var symbol = text_2[_i];
        if (symbol === literal) {
            count++;
        }
    }
    return count;
}
export function correctPasteString(text, separator, literal) {
    var count = 0;
    var str = '';
    for (var _i = 0, text_3 = text; _i < text_3.length; _i++) {
        var symbol = text_3[_i];
        if (symbol === literal) {
            count++;
            if (count === 2) {
                count = 0;
                str += symbol;
                str += separator;
            }
            else {
                if (str !== '' && str[str.length - 1] !== literal && str[str.length - 1] !== separator) {
                    str += separator;
                }
                str += symbol;
            }
        }
        else {
            str += symbol;
        }
    }
    return str;
}
export function smartJoin(selectedValues, separator, literal) {
    return selectedValues.map(function (value) {
        return value != null && value.includes(separator) ? "" + literal + value + literal : value;
    }).join(separator);
}
//# sourceMappingURL=utils.js.map