(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('rxjs'), require('rxjs/operators'), require('ramda'), require('@deltix/decimal-utils'), require('big.js')) :
  typeof define === 'function' && define.amd ? define(['exports', 'rxjs', 'rxjs/operators', 'ramda', '@deltix/decimal-utils', 'big.js'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Utils = {}, global.rxjs, global.operators, global.R, global.decimalUtils, global.Big));
})(this, (function (exports, rxjs, operators, R, decimalUtils, Big) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    }
    n["default"] = e;
    return Object.freeze(n);
  }

  var R__namespace = /*#__PURE__*/_interopNamespace(R);
  var Big__default = /*#__PURE__*/_interopDefaultLegacy(Big);

  const reverseString$1 = str => Array.from(str).reverse().join();
  const trimEnd$1 = (str, delimiter) => {
    if (!delimiter) {
      return reverseString$1(reverseString$1(str).replace(/^\s+/gm, ""));
    }

    let index = str.length;

    while (str.endsWith(delimiter) && index >= 0) {
      str = str.substring(0, str.length - 1);
      --index;
    }

    return str;
  };

  const uniqueArray = (...arr) => {
    const d = {};
    const result = [];

    for (const a of arr) {
      for (const item of a) {
        if (d[item] === void 0) {
          result.push(item);
          d[item] = 0;
        }
      }
    }

    return result;
  };

  const boundary = (min, max) => value => Math.min(min, Math.max(max, value)); // todo VolumePlotter

  const boundaryFor = (min, max, value) => Math.min(min, Math.max(max, value));

  const isFunction = v => !!(v && v.constructor && v.call && v.apply);
  const isUndefined = v => typeof v === "undefined";
  const isDefined = v => !isUndefined(v);
  const isObject = v => isPlainObject(v);

  function isObjectObject(o) {
    return (o != null && typeof o === "object" && Array.isArray(o) === false) === true && Object.prototype.toString.call(o) === "[object Object]";
  }

  function isPlainObject(o) {
    if (isObjectObject(o) === false) {
      return false;
    } // If has modified constructor


    const ctor = o.constructor;

    if (typeof ctor !== "function") {
      return false;
    } // If has modified prototype


    const prot = ctor.prototype;

    if (isObjectObject(prot) === false) {
      return false;
    } // If constructor does not have an Object-specific method


    if (prot.hasOwnProperty("isPrototypeOf") === false) {
      return false;
    } // Most likely a plain Object


    return true;
  }

  const createThunk = v => isFunction(v) ? v : () => v;

  const delay = duration => new Promise(resolve => setTimeout(resolve, duration));

  // see test for exploration
  const stringDifferentPart = (first, second) => {
    if (first === second) {
      return 0;
    }

    let differentIndex = -1;

    for (let i = first.length - 1; i >= 0; i--) {
      if ("." === first[i] || first[i] === second[i]) {
        continue;
      }

      differentIndex = i;
    }

    return -1 === differentIndex ? 0 : first.length - differentIndex;
  };

  exports.EResourceType = void 0;

  (function (EResourceType) {
    EResourceType["image"] = "image";
    EResourceType["font"] = "font";
    EResourceType["bitmap"] = "bitmap";
  })(exports.EResourceType || (exports.EResourceType = {}));

  function trimRightChar(s, c) {
    while (s.charAt(s.length - 1) === c) {
      s = s.substring(0, s.length - 1);
    }

    return s;
  }

  const getRealPrecision = (price, precision, symbolWidth, maxWidth) => {
    const fixed = price.toFixed(precision);
    const overflow = fixed.length * symbolWidth - maxWidth;

    if (overflow <= 0) {
      return precision;
    }

    return Math.max(0, precision - Math.max(0, Math.ceil(overflow / symbolWidth)));
  };
  const splitPriceWithMaxWidth = (price, precision, symbolWidth, maxWidth) => {
    return splitPrice(price, getRealPrecision(price, precision, symbolWidth, maxWidth));
  };
  const splitPrice = (price, precision) => {
    const fixed = price.toFixed(precision); // eslint-disable-next-line prefer-const

    let [ceil, decimal] = fixed.split('.');
    decimal = decimal || '';
    const reversed = decimal.split('').reverse();
    let zeroPartLength = 0;

    for (; zeroPartLength < decimal.length; zeroPartLength++) {
      if (reversed[zeroPartLength] !== '0') {
        break;
      }
    }

    return {
      ceil,
      decimal: trimRightChar(decimal, '0'),
      zero: '0'.repeat(zeroPartLength)
    };
  };

  class TakeWhileInclusiveSubscriber extends rxjs.Subscriber {
    constructor(destination, predicate) {
      super(destination);
      this.destination = destination;
      this.predicate = predicate;
      this.index = 0;
    }

    _next(value) {
      const destination = this.destination;
      let result;

      try {
        result = this.predicate(value, this.index++);
      } catch (err) {
        destination.error(err);
        return;
      }

      destination.next(value);

      if (!result) {
        destination.complete();
      }
    }

  }
  /* tslint:disable-next-line*/


  class TakeWhileInclusiveOperator {
    constructor(predicate) {
      this.predicate = predicate;
    }

    call(subscriber, source) {
      return source.subscribe(new TakeWhileInclusiveSubscriber(subscriber, this.predicate));
    }

  }
  /**
   * Emits values emitted by the source Observable so long as each value satisfies
   * the given `predicate`, and then completes after the last emitted value
   * satisfies the `predicate`.
   *
   * `takeWhileInclusive` subscribes and begins mirroring the source Observable.
   * Each value emitted on the source is emitted then given to the `predicate`
   * function which returns a boolean, representing a condition to be satisfied by
   * the source values. The output Observable emits the source values until such
   * time as the `predicate` returns false, at which point `takeWhileInclusive`
   * stops mirroring the source Observable and completes the output Observable.
   *
   * @param {function(value: T, index: number): boolean} predicate A function that
   * evaluates a value emitted by the source Observable and returns a boolean.
   * Also takes the (zero-based) index as the second argument.
   * @return {Observable<T>} An Observable that emits the values from the source
   * Observable and completes after emitting a value that satisfies the condition
   * defined by the `predicate`.
   * @method takeWhileInclusive
   * @owner Observable
   */


  function takeWhileInclusive(predicate) {
    return source => source.lift(new TakeWhileInclusiveOperator(predicate));
  }

  exports.EGradientDirection = void 0;

  (function (EGradientDirection) {
    EGradientDirection["vertical"] = "vertical";
    EGradientDirection["horizontal"] = "horizontal";
  })(exports.EGradientDirection || (exports.EGradientDirection = {}));

  const getType = actionCreator => actionCreator().type;

  function isCreator(...creators) {
    const creatorTypes = {};

    for (const c of creators) {
      creatorTypes[c().type] = void 0;
    }

    return source => source.pipe(operators.filter(v => {
      if (typeof v !== 'object') {
        return false;
      }

      if (!('type' in v)) {
        return false;
      }

      return v.type in creatorTypes;
    }));
  }
  const select = selector => state$ => operators.map(() => selector(state$.value));

  const createRootReducer = (reducerMap, initialState = undefined) => {
    const map = reducerMap.reduce((reducerMap, [reducer, ...actions]) => actions.reduce((map, action) => {
      const type = getType(action);

      if (!map.hasOwnProperty(type)) {
        map[type] = [];
      }

      map[type].push(reducer);
      return map;
    }, reducerMap), {});
    return (state = initialState, action) => map.hasOwnProperty(action.type) ? map[action.type].reduce((nextState, reducer) => reducer(nextState, action), state) : state;
  };
  const rootSymbol = '@root';

  const enhancePath = (path, reducer) => (state, action) => {
    const current = R__namespace.path(path, state);
    const next = reducer(current, action);

    if (next === current) {
      return state;
    }

    return R__namespace.assocPath(path, next, state);
  };

  const combineMaps = (...maps) => {
    const reducers = [];
    maps.forEach(map => {
      Object.entries(map).forEach(([path, reducer]) => {
        if (path === rootSymbol) {
          reducers.push(reducer);
          return;
        }

        reducers.push(enhancePath(path.split('.'), reducer));
      });
    });
    return mergeReducer(...reducers);
  };
  const mergeReducer = (...reducers) => (state, action) => reducers.reduce((nextState, reducer) => reducer(nextState, action), state);
  const enhanceReducer = (part, reducer) => (state, action) => {
    const statePart = state[part];
    const nextStatePart = reducer(statePart, action);

    if (nextStatePart !== statePart) {
      return R__namespace.assoc(part, nextStatePart, state);
    }

    return state;
  };

  /**
   * Return tuple (number, bool).
   *
   * IF price founded second value will be true first will be index of element.
   * ELSE first value will index of nearest element and second value will be false.
   */
  const binarySearch = comparator => direction => (haystack, needle) => {
    let low = 0;
    let high = haystack.length - 1;

    while (low <= high) {
      /* Note that "(low + high) >>> 1" may overflow, and results in a typecast
       * to double (which gives the wrong results). */
      const mid = low + (high - low >> 1);
      const cmp = +comparator(haystack[mid], needle) * (direction === "ASC" ? -1 : 1);
      /* Too low. */

      if (cmp < 0.0) {
        low = mid + 1;
        /* Too high. */
      } else if (cmp > 0.0) {
        high = mid - 1;
        /* Key found. */
      } else {
        return [mid, true];
      }
    }
    /* Key not found. */


    return [low, false];
  };

  /**
   * @param min
   * @param max
   * @param ticks suggest count ticks
   */

  const createTicks = (min, max, ticks) => {
    // This routine creates the Y axis values for a graph.
    //
    // Calculate Min amd Max graphical labels and graph
    // increments.  The number of ticks defaults to
    // 5 which is the SUGGESTED value.  Any tick value
    // entered is used as a suggested value which is
    // adjusted to be a 'pretty' value.
    //
    // Output will be an array of the Y axis values that
    // encompass the Y values.
    const result = []; // If min and max are identical, then
    // adjust the min and max values to actually
    // make a graph. Also avoids division by zero errors.

    if (min === max) {
      min = min - 10; // some small value

      max = max + 10; // some small value
    } // Determine Range


    const range = max - min; // Adjust ticks if needed

    if (ticks < 2) {
      ticks = 2;
    } else if (ticks > 2) {
      ticks = Math.max(2, ticks - 2);
    } // calculate an initial guess at step size


    const tempStep = range / ticks; // Calculate pretty step value

    const magnitude = Math.floor(Math.log(tempStep) / Math.LN10);
    const magnitudePow = Math.pow(10, magnitude); // calculate most significant digit of the new step size

    const magnitudeMsd = tempStep / magnitudePow + 0.5 | 0;
    const stepSize = magnitudeMsd * magnitudePow; // Lower and upper bounds calculations

    const loverBoundary = stepSize * Math.floor(min / stepSize);
    const upperBoundary = stepSize * Math.ceil(max / stepSize); // Build array

    let val = loverBoundary;

    if (isFinite(ticks)) {
      while (result.length <= ticks) {
        result.push(val);
        val += stepSize;

        if (val >= upperBoundary) {
          break;
        }
      }
    }

    return result;
  };
  /**
   * @param min
   * @param max
   * @param ticks suggest count ticks
   */

  const createDecimalTicks = (min, max, ticks) => {
    // This routine creates the Y axis values for a graph.
    //
    // Calculate Min amd Max graphical labels and graph
    // increments.  The number of ticks defaults to
    // 5 which is the SUGGESTED value.  Any tick value
    // entered is used as a suggested value which is
    // adjusted to be a 'pretty' value.
    //
    // Output will be an array of the Y axis values that
    // encompass the Y values.
    const result = []; // If min and max are identical, then
    // adjust the min and max values to actually
    // make a graph. Also avoids division by zero errors.

    if (min.eq(max)) {
      min = min.minus(10); // some small value

      max = max.add(10); // some small value
    } // Determine Range


    const range = max.minus(min); // Adjust ticks if needed

    if (ticks < 2) {
      ticks = 2;
    } else if (ticks > 2) {
      ticks = Math.max(2, ticks - 2);
    } // calculate an initial guess at step size


    const tempStep = range.div(ticks); // Calculate pretty step value

    const magnitude = Math.floor(Math.log(tempStep.toNumber()) / Math.LN10);
    const magnitudePow = Math.pow(10, magnitude); // calculate most significant digit of the new step size

    const magnitudeMsd = tempStep.toNumber() / magnitudePow + 0.5 | 0;
    const stepSize = magnitudeMsd * magnitudePow; // Lower and upper bounds calculations

    const loverBoundary = decimalUtils.toDecimal(stepSize * Math.floor(min.toNumber() / stepSize));
    const upperBoundary = decimalUtils.toDecimal(stepSize * Math.ceil(max.toNumber() / stepSize)); // Build array

    let val = loverBoundary;

    if (isFinite(ticks)) {
      while (result.length <= ticks) {
        result.push(val);
        val = val.add(stepSize);

        if (val.gte(upperBoundary)) {
          break;
        }
      }
    }

    return result;
  };

  const bigHelper = {
    max: (a, b) => a.gt(b) ? a : b,
    min: (a, b) => a.lt(b) ? a : b
  };

  const reverseString = str => Array.from(str).reverse().join();

  const trimEnd = (str, delimiter) => {
    if (!delimiter) {
      return reverseString(reverseString(str).replace(/^\s+/gm, ''));
    }

    let index = str.length;

    while (str.endsWith(delimiter) && index >= 0) {
      str = str.substring(0, str.length - 1);
      --index;
    }

    return str;
  };

  const formatMoney = (sum, precision) => {
    const [ceil, decimal] = sum.toFixed(precision).split('.'); // const ceilFormatted = ceil.replace(/(\d)(?=(\d{3})+$)/g, "$1");

    const formattedDecimal = undefined === decimal ? '' : trimEnd(decimal, '0');
    return precision === 0 || formattedDecimal.length === 0 ? ceil : `${ceil}.${formattedDecimal}`;
  };

  const fullFieldTime = unit => unit < 10 ? "0" + unit : unit.toString();

  exports.Format = void 0;

  (function (Format) {
    Format[Format["MM-DD-YY HH-mm-SS"] = 0] = "MM-DD-YY HH-mm-SS";
    Format[Format["HH-mm-SS"] = 1] = "HH-mm-SS";
  })(exports.Format || (exports.Format = {}));

  const formatTime = (time, format) => {
    const d = new Date(time);
    const f = fullFieldTime;

    if (format === exports.Format["MM-DD-YY HH-mm-SS"]) {
      return `${f(d.getMonth() + 1)}-${f(d.getDate())}-${d.getFullYear()} ${f(d.getHours())}:${f(d.getMinutes())}:${f(d.getSeconds())}`;
    }

    if (format === exports.Format["HH-mm-SS"]) {
      return `${f(d.getHours())}:${f(d.getMinutes())}:${f(d.getSeconds())}`;
    }

    return `${time}`;
  };

  // In Math:
  // Floor: Go to the next integer left of where you are.
  // Ceiling: Go to the next integer right of where you are.
  //
  //         -.8      -.8
  // ---|-----|--|-----|--|------------->
  //   -1        0        1
  //
  // Math.floor(-.8)  === -1   <- go to first left
  // Math.floor(.8)   ===  0   <- go to first left
  // Math.ceil(-.8)   ===  0   <- go to first right
  // Math.ceil(.8)    ===  1   <- go to first right
  const roundOffset = n => n === 0 ? 0 : n > 0 ? Math.floor(Math.abs(n)) : -Math.ceil(Math.abs(n));

  const formatPriceByPrecision = (precision, price) => {
    if (price == null) {
      return null;
    }

    const value = decimalUtils.roundDecimalBy(new Big__default["default"](price), precision);
    return value instanceof Big__default["default"] ? value.toFixed() : value;
  };

  const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const shortMonth = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

  const decimalPartWithoutZero = (labels, maxLength = 6) => {
    const countZero = [];
    const allDecimalPartIsZero = [];
    labels.forEach(label => {
      const [_, decimal] = label.toFixed(maxLength).split(".");

      if (!decimal) {
        return;
      }

      let countZeroInString = 0;

      for (const char of decimal.split("").reverse()) {
        if (char !== "0") {
          break;
        }

        countZeroInString++;
      }

      countZero.push(countZeroInString);
      allDecimalPartIsZero.push(decimal.length === countZeroInString);
    });

    if (0 === countZero.length) {
      return 0;
    }

    return Math.min.apply(Math, countZero) + +allDecimalPartIsZero.every(v => v);
  };

  const prettyAxisLabels = (labels, maxLength = 6) => {
    const slice = decimalPartWithoutZero(labels, maxLength) || -Infinity;
    return labels.map(label => label.toFixed(maxLength).slice(0, -slice));
  };

  const bigNumberToString = bigNum => {
    var _a;

    return (_a = bigNum === null || bigNum === void 0 ? void 0 : bigNum.toFixed()) !== null && _a !== void 0 ? _a : '';
  };

  exports.bigHelper = bigHelper;
  exports.bigNumberToString = bigNumberToString;
  exports.binarySearch = binarySearch;
  exports.boundary = boundary;
  exports.boundaryFor = boundaryFor;
  exports.combineMaps = combineMaps;
  exports.createDecimalTicks = createDecimalTicks;
  exports.createRootReducer = createRootReducer;
  exports.createThunk = createThunk;
  exports.createTicks = createTicks;
  exports.delay = delay;
  exports.enhanceReducer = enhanceReducer;
  exports.formatMoney = formatMoney;
  exports.formatPriceByPrecision = formatPriceByPrecision;
  exports.formatTime = formatTime;
  exports.fullFieldTime = fullFieldTime;
  exports.getRealPrecision = getRealPrecision;
  exports.getType = getType;
  exports.isCreator = isCreator;
  exports.isDefined = isDefined;
  exports.isFunction = isFunction;
  exports.isObject = isObject;
  exports.isUndefined = isUndefined;
  exports.mergeReducer = mergeReducer;
  exports.month = month;
  exports.prettyAxisLabels = prettyAxisLabels;
  exports.reverseString = reverseString$1;
  exports.rootSymbol = rootSymbol;
  exports.roundOffset = roundOffset;
  exports.select = select;
  exports.shortMonth = shortMonth;
  exports.splitPrice = splitPrice;
  exports.splitPriceWithMaxWidth = splitPriceWithMaxWidth;
  exports.stringDifferentPart = stringDifferentPart;
  exports.takeWhileInclusive = takeWhileInclusive;
  exports.trimEnd = trimEnd$1;
  exports.uniqueArray = uniqueArray;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
