(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react/jsx-runtime'), require('@deltix/hd.components-multi-app'), require('@deltix/hd.components-order-book'), require('@inlet/react-pixi'), require('react'), require('@deltix/decimal-utils'), require('@deltix/hd.components-utils'), require('lodash'), require('@deltix/hd.components-depth-chart-common'), require('@deltix/hd.components-common'), require('react-redux'), require('@pixi/filter-drop-shadow'), require('@pixi/filter-outline'), require('pixi.js'), require('fast-deep-equal'), require('redux-observable'), require('rxjs'), require('rxjs/operators')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react/jsx-runtime', '@deltix/hd.components-multi-app', '@deltix/hd.components-order-book', '@inlet/react-pixi', 'react', '@deltix/decimal-utils', '@deltix/hd.components-utils', 'lodash', '@deltix/hd.components-depth-chart-common', '@deltix/hd.components-common', 'react-redux', '@pixi/filter-drop-shadow', '@pixi/filter-outline', 'pixi.js', 'fast-deep-equal', 'redux-observable', 'rxjs', 'rxjs/operators'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.DepthChart = {}, global.jsxRuntime, global.hd_componentsMultiApp, global.hd_componentsOrderBook, global.reactPixi, global.React, global.decimalUtils, global.hd_componentsUtils, global.lodash, global.hd_componentsDepthChartCommon, global.hd_componentsCommon, global.reactRedux, global.filterDropShadow, global.filterOutline, global.PIXI, global.deepEqual, global.reduxObservable, global.rxjs, global.operators));
})(this, (function (exports, jsxRuntime, hd_componentsMultiApp, hd_componentsOrderBook, reactPixi, React, decimalUtils, hd_componentsUtils, lodash, hd_componentsDepthChartCommon, hd_componentsCommon, reactRedux, filterDropShadow, filterOutline, PIXI, deepEqual, reduxObservable, rxjs, operators) { 'use strict';

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

  var React__namespace = /*#__PURE__*/_interopNamespace(React);
  var PIXI__namespace = /*#__PURE__*/_interopNamespace(PIXI);
  var deepEqual__default = /*#__PURE__*/_interopDefaultLegacy(deepEqual);

  const getMaxQuantity = (buyPrices, sellPrices, orientation) => {
    const lastSellSum = sellPrices.length ? sellPrices[sellPrices.length - 1].sum : decimalUtils.ZERO;
    const lastBuySum = buyPrices.length ? buyPrices[buyPrices.length - 1].sum : decimalUtils.ZERO;
    let sum;

    switch (orientation) {
      case hd_componentsDepthChartCommon.EOrientations.price:
        sum = decimalUtils.maxDecimal(lastSellSum, lastBuySum);
        break;

      case hd_componentsDepthChartCommon.EOrientations.quantity:
        sum = decimalUtils.minDecimal(lastSellSum, lastBuySum);
        break;
    }

    if (sum.eq(decimalUtils.ZERO)) {
      sum = decimalUtils.maxDecimal(lastSellSum, lastBuySum);
    }

    return sum;
  };

  const getFilteredPrices = (buyPrices, sellPrices, orientation) => {
    const maxQuantity = getMaxQuantity(buyPrices, sellPrices, orientation);
    return [buyPrices.filter(price => price.sum.lte(maxQuantity)), sellPrices.filter(price => price.sum.lte(maxQuantity)), maxQuantity];
  };

  const getXmidPrice = (from, to, width, midPrice, orientation) => {
    const w = decimalUtils.toDecimal(width);

    if (orientation === hd_componentsDepthChartCommon.EOrientations.price) {
      return w.div(2);
    }

    const priceDifference = to.minus(from);

    if (priceDifference.eq(decimalUtils.ZERO)) {
      return decimalUtils.ZERO;
    } else if (priceDifference.gt(decimalUtils.ZERO)) {
      const coefficient = w.div(priceDifference);

      if (midPrice.lt(from)) {
        return from.minus(midPrice).times(coefficient).minus(w);
      }

      if (midPrice.gt(to)) {
        return midPrice.minus(to).times(coefficient).add(w);
      }

      return midPrice.minus(from).times(coefficient);
    } else {
      const coefficient = w.div(priceDifference.abs());

      if (midPrice.gt(from)) {
        return midPrice.minus(from).times(coefficient).add(w);
      }

      if (midPrice.lt(to)) {
        return to.minus(midPrice).times(coefficient).minus(w);
      }

      return midPrice.minus(to).times(coefficient);
    }
  };

  const getSquaredDistance = (pointOne, pointTwo) => {
    const xDistance = pointOne.x - pointTwo.x;
    const yDistance = pointOne.y - pointTwo.y;
    return Math.pow(xDistance, 2) + Math.pow(yDistance, 2);
  };

  const getSquaredSegmentDistance = (points, pointOne, pointTwo) => {
    let x = pointOne.x;
    let y = pointOne.y;
    let xDistance = pointTwo.x - x;
    let yDistance = pointTwo.y - y;

    if (xDistance !== 0 || yDistance !== 0) {
      const t = ((points.x - x) * xDistance + (points.y - y) * yDistance) / (Math.pow(xDistance, 2) + Math.pow(yDistance, 2));

      if (t > 1) {
        x = pointTwo.x;
        y = pointTwo.y;
      } else if (t > 0) {
        x += xDistance * t;
        y += yDistance * t;
      }
    }

    xDistance = points.x - x;
    yDistance = points.y - y;
    return Math.pow(xDistance, 2) + Math.pow(yDistance, 2);
  };

  const simplifyRadialDistance = (points, tolerance) => {
    let prevPoint = points[0];
    const newPoints = [prevPoint];
    let point;

    for (let i = 1, len = points.length; i < len; i++) {
      point = points[i];

      if (getSquaredDistance(point, prevPoint) > tolerance) {
        newPoints.push(point);
        prevPoint = point;
      }
    }

    if (prevPoint !== point) {
      newPoints.push(point);
    }

    return newPoints;
  };

  const simplifyDPStep = (points, first, last, tolerance, simplified) => {
    let maxSquaredDistance = tolerance;
    let index;

    for (let i = first + 1; i < last; i++) {
      const squaredDistance = getSquaredSegmentDistance(points[i], points[first], points[last]);

      if (squaredDistance > maxSquaredDistance) {
        index = i;
        maxSquaredDistance = squaredDistance;
      }
    }

    if (maxSquaredDistance > tolerance) {
      if (index - first > 1) {
        simplifyDPStep(points, first, index, tolerance, simplified);
      }

      simplified.push(points[index]);

      if (last - index > 1) {
        simplifyDPStep(points, index, last, tolerance, simplified);
      }
    }
  };

  const simplifyDouglasPeucker = (points, tolerance) => {
    const last = points.length - 1;
    const simplified = [points[0]];
    simplifyDPStep(points, 0, last, tolerance, simplified);
    simplified.push(points[last]);
    return simplified;
  };

  const simplifyPolygon = (points, tolerance, highestQuality) => {
    if (points.length <= 2) {
      return points;
    }

    const squaredTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
    const radialDist = highestQuality ? points : simplifyRadialDistance(points, squaredTolerance);
    return simplifyDouglasPeucker(radialDist, squaredTolerance);
  };

  const computePolygon = (xLiner, yLiner, prices, width, closeX) => {
    const forSimplifying = [];
    let prevY;

    for (const {
      price,
      sum
    } of prices) {
      const x = xLiner(price).toNumber();
      const y = yLiner(sum).toNumber();

      if (prevY != null) {
        forSimplifying.push({
          x,
          y: prevY
        });
      }

      forSimplifying.push({
        x,
        y
      });
      prevY = y;
    }

    if (forSimplifying.length === 1) {
      forSimplifying.push({
        x: closeX,
        y: prevY
      });
    }

    const simplifiedPoints = simplifyPolygon(forSimplifying, 2.5, false);
    const buf = new Array(simplifiedPoints.length * 2);

    for (let i = 0, j = 0; i < simplifiedPoints.length; i++, j += 2) {
      buf[j] = simplifiedPoints[i].x;
      buf[j + 1] = simplifiedPoints[i].y;
    }

    return buf;
  };

  const createXDomain = (prices, midPrice) => {
    if (!prices.length) {
      return {
        from: midPrice,
        to: midPrice
      };
    }

    return {
      from: prices.length ? prices[prices.length - 1].price : decimalUtils.ZERO,
      to: midPrice
    };
  };

  const createRangeParams = (width, leftPrice, rightPrice) => {
    const tickWidth = 80;
    const countTicks = Math.ceil(width / tickWidth);
    const ticks = hd_componentsUtils.createDecimalTicks(decimalUtils.minDecimal(leftPrice, rightPrice), decimalUtils.maxDecimal(leftPrice, rightPrice), countTicks);
    const step = ticks[1].minus(ticks[0]);
    return [leftPrice, rightPrice, step];
  };

  const createXCommonAxis = (start, end, sep, liner) => {
    const priceRange = lodash.range(start, end, sep);
    const prices = priceRange.map(price => ({
      label: price,
      x: liner(price)
    }));
    return prices.slice(1);
  };

  const takeLastPrice = values => values.length === 0 ? decimalUtils.ZERO : values[values.length - 1].price;

  const createXAxis = (buyPrices, sellPrices, buyLiner, sellLiner, middlePrice, xMidPrice, width) => {
    const middle = {
      label: middlePrice,
      x: xMidPrice
    };
    let lastSellPrice = takeLastPrice(sellPrices);
    let lastBuyPrice = takeLastPrice(buyPrices);

    if (lastSellPrice.eq(decimalUtils.ZERO)) {
      lastSellPrice = lastBuyPrice;
    }

    if (lastBuyPrice.eq(decimalUtils.ZERO)) {
      lastBuyPrice = lastSellPrice; // ?
    }

    if (xMidPrice.lte(decimalUtils.ZERO)) {
      const [_sellStart, _sellEnd, _sellStep] = createRangeParams(width - xMidPrice.toNumber(), middlePrice, lastSellPrice);
      return [middle, ...createXCommonAxis(_sellStart.toNumber(), _sellEnd.toNumber(), _sellStep.toNumber(), sellLiner)];
    }

    if (xMidPrice.gte(width)) {
      const [_buyStart, _buyEnd, _buyStep] = createRangeParams(xMidPrice.toNumber(), lastBuyPrice, middlePrice);
      return [...createXCommonAxis(_buyEnd.toNumber(), _buyStart.toNumber(), decimalUtils.negate(_buyStep).toNumber(), buyLiner), middle];
    }

    const [buyStart, buyEnd, buyStep] = createRangeParams(xMidPrice.toNumber(), lastBuyPrice, middlePrice);
    const [sellStart, sellEnd, sellStep] = createRangeParams(width - xMidPrice.toNumber(), middlePrice, lastSellPrice);
    const step = decimalUtils.maxDecimal(buyStep, sellStep);
    return [...createXCommonAxis(buyEnd.toNumber(), buyStart.toNumber(), decimalUtils.negate(step).toNumber(), buyLiner), middle, ...createXCommonAxis(sellStart.toNumber(), sellEnd.toNumber(), step.toNumber(), sellLiner)];
  };

  const createPolygons = (buyPrices, sellPrices, middlePrice, chartHeight, chartWidth, orientation) => {
    const [filteredBuyPrices, filteredSellPrices, maxQuantity] = getFilteredPrices(buyPrices, sellPrices, orientation);
    const emptyBuy = filteredBuyPrices.length === 0;
    const emptySell = filteredSellPrices.length === 0;

    if (emptyBuy && emptySell) {
      return {
        buyPolygon: [],
        sellPolygon: [],
        ticks: [],
        xMidPrice: decimalUtils.toDecimal(chartWidth / 2),
        maxQuantity: decimalUtils.ZERO
      };
    }

    const yDomain = {
      from: decimalUtils.ZERO,
      to: maxQuantity
    };
    const yRange = {
      from: decimalUtils.toDecimal(chartHeight),
      to: decimalUtils.ZERO
    };

    const yLiner = quantity => hd_componentsMultiApp.fLinerDecimal(yDomain, yRange, quantity);

    const xBuyDomain = createXDomain(filteredBuyPrices, middlePrice);
    const xSellDomain = createXDomain(filteredSellPrices, middlePrice);
    const xMidPrice = getXmidPrice(xBuyDomain.from, xSellDomain.from, chartWidth, middlePrice, orientation);
    const inSpread = xBuyDomain.from.gte(xSellDomain.from);
    const buyRange = {
      from: decimalUtils.ZERO,
      to: xMidPrice
    };

    const xBuyLiner = price => hd_componentsMultiApp.fLinerDecimal(xBuyDomain, buyRange, price);

    const sellRange = {
      from: decimalUtils.toDecimal(chartWidth),
      to: xMidPrice
    };

    const xSellLiner = price => hd_componentsMultiApp.fLinerDecimal(xSellDomain, sellRange, price);

    const buyPolygon = computePolygon(xBuyLiner, yLiner, filteredBuyPrices, chartWidth, chartWidth);
    const sellPolygon = computePolygon(xSellLiner, yLiner, filteredSellPrices, chartWidth, 0);
    const ticks = createXAxis(filteredBuyPrices, filteredSellPrices, xBuyLiner, xSellLiner, middlePrice, xMidPrice, chartWidth);
    const realBuyPolygon = inSpread && !emptyBuy ? [0, -chartHeight, chartWidth, -chartHeight] : buyPolygon;
    const realSellPolygon = inSpread && !emptySell ? [chartWidth, -chartHeight, 0, -chartHeight] : sellPolygon;
    return {
      buyPolygon: realBuyPolygon,
      sellPolygon: realSellPolygon,
      ticks,
      xMidPrice,
      maxQuantity,
      xOriginalMidPrice: chartWidth / 2
    };
  };

  const findClosestIndex = (num, arr, select, reversed) => {
    let mid;
    let loIndex = 0;
    let hiIndex = arr.length - 1;

    while (hiIndex - loIndex > 1) {
      mid = Math.floor((loIndex + hiIndex) / 2);

      if (select(arr[mid]).lt(num)) {
        if (reversed) {
          hiIndex = mid;
        } else {
          loIndex = mid;
        }
      } else {
        if (reversed) {
          loIndex = mid;
        } else {
          hiIndex = mid;
        }
      }
    }

    return loIndex;
  };
  const priceInSpread = (state, price) => {
    const {
      buy,
      sell
    } = state.app.prices;

    if (!buy[0] || !sell[0]) {
      return false;
    }

    return price.gt(buy[0].price) && price.lt(sell[0].price);
  };
  const getPriceByX = state => {
    const {
      width
    } = state.viewport;
    const {
      x
    } = state.input;

    if (!isFinite(x)) {
      return [];
    }

    const {
      orientation
    } = state.app.parameters;
    const {
      buy,
      sell
    } = state.app.prices;
    const {
      middlePrice
    } = state.app;
    const [filteredBuyPrices, filteredSellPrices] = getFilteredPrices(buy, sell, orientation);

    if (!filteredBuyPrices.length && !filteredSellPrices.length) {
      return [];
    }

    const buyWorst = filteredBuyPrices.length ? filteredBuyPrices[filteredBuyPrices.length - 1].price : decimalUtils.ZERO;
    const sellWorst = filteredSellPrices.length ? filteredSellPrices[filteredSellPrices.length - 1].price : decimalUtils.ZERO;
    const sellBest = filteredSellPrices.length ? filteredSellPrices[0].price : decimalUtils.ZERO;
    const buyBest = filteredBuyPrices.length ? filteredBuyPrices[0].price : decimalUtils.ZERO;
    const xMidPrice = getXmidPrice(buyWorst, sellWorst, width, middlePrice, orientation);

    const _x = decimalUtils.toDecimal(x);

    let side = _x.lt(xMidPrice) ? hd_componentsOrderBook.L2MessageSide.buy : hd_componentsOrderBook.L2MessageSide.sell;
    let from = buyWorst;
    let to = sellWorst;

    if (!filteredSellPrices.length) {
      to = buyBest;
      side = hd_componentsOrderBook.L2MessageSide.buy;
    } else if (!filteredBuyPrices.length) {
      from = sellBest;
      side = hd_componentsOrderBook.L2MessageSide.sell;
    }

    const price = from.eq(to) ? from : hd_componentsMultiApp.fLinerDecimal({
      from: decimalUtils.ZERO,
      to: decimalUtils.toDecimal(width)
    }, {
      from,
      to
    }, _x);
    return [price, side];
  };
  const getXByPrice = (state, price, side) => {
    const orientation = state.app.parameters.orientation;
    const {
      width
    } = state.viewport;
    const {
      buy,
      sell
    } = state.app.prices;
    const {
      middlePrice
    } = state.app;
    const [filteredBuyPrices, filteredSellPrices] = getFilteredPrices(buy, sell, orientation);

    if (filteredBuyPrices.length === 0 || filteredSellPrices.length === 0) {
      return;
    }

    const sellBest = filteredSellPrices[0].price;
    const sellWorst = filteredSellPrices[filteredSellPrices.length - 1].price;
    const buyBest = filteredBuyPrices[0].price;
    const buyWorst = filteredBuyPrices[filteredBuyPrices.length - 1].price;
    const xMidPrice = getXmidPrice(buyWorst, sellWorst, width, middlePrice, orientation);

    switch (side) {
      case hd_componentsOrderBook.L2MessageSide.buy:
        {
          const buyCoefficient = middlePrice.minus(buyWorst).div(xMidPrice);
          const buyPrice = price.gt(buyBest) ? buyBest : price;
          const buyDifference = buyPrice.minus(buyWorst);
          return buyDifference.div(buyCoefficient).toNumber();
        }

      case hd_componentsOrderBook.L2MessageSide.sell:
        {
          const sellCoefficient = sellWorst.minus(middlePrice).div(decimalUtils.toDecimal(width).minus(xMidPrice));
          const sellPrice = price.lt(sellBest) ? sellBest : price;
          const sellDifference = sellWorst.minus(sellPrice);
          return width - sellDifference.div(sellCoefficient).toNumber();
        }
    }
  };
  const getQuantityByPrice = (state, price, dataSet) => {
    var _a;

    const index = findClosestIndex(price, state.app.prices[dataSet], _ => _.price, dataSet === hd_componentsOrderBook.L2MessageSide.buy);
    const side = state.app.prices[dataSet];
    return side.length ? (_a = side[index]) === null || _a === void 0 ? void 0 : _a.sum : null;
  };
  const getYByPrice = (state, price, dataSet) => {
    const {
      orientation
    } = state.app.parameters;
    const {
      buy,
      sell
    } = state.app.prices;
    const domain = {
      from: decimalUtils.ZERO,
      to: getMaxQuantity(buy, sell, orientation)
    };
    const range = {
      from: decimalUtils.toDecimal(state.viewport.height - 10),
      to: decimalUtils.ZERO
    };
    return hd_componentsMultiApp.fLinerDecimal(domain, range, getQuantityByPrice(state, price, dataSet)).toNumber();
  };

  const highlightPriceSelector = (state, side) => {
    const price = state.app.highlightPrices[side];
    const pointX = getXByPrice(state, price, side);

    if (pointX === undefined) {
      return;
    }

    const pointY = getYByPrice(state, price, side);
    return {
      pointX,
      pointY
    };
  };

  const highlightPricesSelector = state => {
    const buyPrice = highlightPriceSelector(state, hd_componentsOrderBook.L2MessageSide.buy);
    const sellPrice = highlightPriceSelector(state, hd_componentsOrderBook.L2MessageSide.sell);
    return {
      [hd_componentsOrderBook.L2MessageSide.sell]: sellPrice,
      [hd_componentsOrderBook.L2MessageSide.buy]: buyPrice
    };
  };
  const formatFunctionsSelector = state => state.app.formatFunctions;

  const ANCHOR$1 = [0, 0];
  const priceStyle = Object.assign(Object.assign({}, hd_componentsCommon.ttfRobotoCondensed_regular_10), {
    fontSize: 15
  });
  const legendStyle = Object.assign(Object.assign({}, hd_componentsCommon.ttfRobotoCondensed_regular_10), {
    fontSize: 12
  });
  const volumeStyle = Object.assign(Object.assign({}, hd_componentsCommon.ttfRobotoCondensed_regular_10), {
    fontSize: 12
  });
  const padding = 10;

  const getFormattedVolume = (volume, decimalPart, code) => `${hd_componentsUtils.formatMoney(volume, decimalPart)} ${code}`;

  const getFormattedTotalPrice = (volume, price, decimalPart, code) => `${hd_componentsUtils.formatMoney(volume.times(price), decimalPart)} ${code}`;

  const getFormattedPrice = (price, decimalPart, code) => `${hd_componentsUtils.formatMoney(price, decimalPart)} ${code}`;

  const Legend = /*#__PURE__*/React__namespace.memo(({
    volume,
    price,
    symbol: {
      term,
      base
    },
    type,
    labelHeight,
    labelWidth
  }) => {
    const {
      price: formatPrice,
      volume: formatVolume
    } = reactRedux.useSelector(formatFunctionsSelector);
    const offset = labelWidth / 2 - padding;
    const secondLine = padding + 20;
    const thirdLine = secondLine + 20;
    const formattedTotalPrice = formatPrice(getFormattedTotalPrice(volume, price, term.decimalPart, term.code));
    const formattedVolume = volume ? formatVolume(getFormattedVolume(volume, base.decimalPart, base.code)) : '';
    const formattedPrice = formatPrice(getFormattedPrice(price, term.decimalPart, term.code));
    return jsxRuntime.jsxs(jsxRuntime.Fragment, {
      children: [jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
        width: labelWidth,
        height: labelHeight,
        color: 0x1e2b34,
        alpha: 0.8
      }, void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
        x: padding,
        y: padding
      }, {
        children: jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
          anchor: ANCHOR$1,
          height: 10,
          width: 10,
          horizontal: 'left',
          text: hd_componentsCommon.getFormattedNumber(formattedPrice),
          style: priceStyle,
          vertical: 'top'
        }, void 0)
      }), void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
        x: padding,
        y: secondLine
      }, {
        children: jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
          anchor: ANCHOR$1,
          height: 10,
          width: 10,
          horizontal: 'left',
          text: type === hd_componentsOrderBook.L2MessageSide.sell ? 'Can be bought:' : 'Can be sold:',
          style: legendStyle,
          vertical: 'top'
        }, void 0)
      }), void 0), jsxRuntime.jsx(hd_componentsMultiApp.Line, {
        color: 0xb8b9b9,
        lineWidth: 1,
        alpha: 1,
        lines: [[[padding + offset, secondLine], [padding + offset, labelHeight - padding]]]
      }, void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
        x: padding * 2 + offset,
        y: secondLine
      }, {
        children: jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
          anchor: ANCHOR$1,
          height: 10,
          width: 10,
          horizontal: 'left',
          text: 'For a total of:',
          style: legendStyle,
          vertical: 'top'
        }, void 0)
      }), void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
        x: padding * 2 + offset,
        y: thirdLine
      }, {
        children: jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
          anchor: ANCHOR$1,
          height: 10,
          width: 10,
          horizontal: 'left',
          text: hd_componentsCommon.getFormattedNumber(formattedTotalPrice),
          style: volumeStyle,
          vertical: 'top'
        }, void 0)
      }), void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
        x: padding,
        y: thirdLine
      }, {
        children: jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
          anchor: ANCHOR$1,
          height: 10,
          width: 10,
          horizontal: 'left',
          text: hd_componentsCommon.getFormattedNumber(formattedVolume),
          style: volumeStyle,
          vertical: 'top'
        }, void 0)
      }), void 0)]
    }, void 0);
  });

  var ELinePosition;

  (function (ELinePosition) {
    ELinePosition["left"] = "left";
    ELinePosition["right"] = "right";
  })(ELinePosition || (ELinePosition = {}));

  const labelOffset = 1.5;
  const labelWidth = 250;
  const labelHeight = 80;

  const getLabelX = (width, labelWidth, pointX, type) => {
    const left = pointX - labelWidth - labelOffset;
    const right = pointX + labelOffset;

    switch (type) {
      case hd_componentsOrderBook.L2MessageSide.sell:
        if (pointX + labelOffset < labelWidth) {
          return right;
        } else {
          return left;
        }

      case hd_componentsOrderBook.L2MessageSide.buy:
        if (width - pointX < labelWidth + labelOffset) {
          return left;
        } else {
          return right;
        }

    }
  };

  const getLabelY = (height, labelWidth, pointY) => {
    const below = pointY + labelOffset;
    const above = pointY - labelHeight - labelOffset;

    if (pointY + labelHeight + labelOffset >= height) {
      return above;
    } else {
      return below;
    }
  };

  const mapStateToProps$1 = state => {
    const width = state.viewport.width;
    const highlightPrices = state.app.highlightPrices;
    const type = highlightPrices.mainSide;
    const price = highlightPrices[type];
    const pointX = getXByPrice(state, price, type);

    if (!type) {
      return hd_componentsMultiApp.SkipRenderProps;
    }

    if (!price) {
      return hd_componentsMultiApp.SkipRenderProps;
    }

    if (priceInSpread(state, price)) {
      return hd_componentsMultiApp.SkipRenderProps;
    }

    if (pointX === undefined) {
      return hd_componentsMultiApp.SkipRenderProps;
    }

    if (pointX < 0) {
      return hd_componentsMultiApp.SkipRenderProps;
    }

    if (pointX > width) {
      return hd_componentsMultiApp.SkipRenderProps;
    }

    const color = type === hd_componentsOrderBook.L2MessageSide.sell ? 0xff6939 : 0x4da53c;
    const volume = getQuantityByPrice(state, price, type);
    const pointY = getYByPrice(state, price, type);
    const labelY = getLabelY(state.viewport.height, labelWidth, pointY);
    const labelX = getLabelX(width, labelWidth, pointX, type);
    const linePosition = type === hd_componentsOrderBook.L2MessageSide.sell ? ELinePosition.left : ELinePosition.right;
    return {
      type,
      color,
      pointX,
      pointY,
      labelX,
      labelY,
      linePosition,
      price,
      volume,
      symbol: state.app.symbol
    };
  };

  const CrossHair = /*#__PURE__*/React__namespace.memo(props => jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
    children: ({
      depthChart: {
        tooltip
      }
    }) => jsxRuntime.jsx(reactPixi.Container, Object.assign({
      x: props.labelX + 1.5,
      y: props.labelY
    }, {
      children: jsxRuntime.jsx(Legend, {
        labelWidth: labelWidth,
        labelHeight: labelHeight,
        price: props.price,
        volume: props.volume,
        lineColor: tooltip[props.type].color,
        linePosition: props.linePosition,
        symbol: props.symbol,
        type: props.type
      }, void 0)
    }), void 0)
  }, void 0));
  const ConnectedCrossHair = hd_componentsMultiApp.connectWithSkip(mapStateToProps$1, CrossHair);

  const width = 3;
  const radius = width * 2;
  const alpha = 1;
  const Highlight = /*#__PURE__*/React__namespace.memo(({
    height
  }) => {
    const {
      sell,
      buy
    } = reactRedux.useSelector(highlightPricesSelector);
    return jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
      children: ({
        depthChart: {
          tooltip
        }
      }) => jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [sell && jsxRuntime.jsxs(jsxRuntime.Fragment, {
          children: [jsxRuntime.jsx(hd_componentsMultiApp.Circle, {
            color: tooltip[hd_componentsOrderBook.L2MessageSide.sell].color,
            x: sell.pointX + width / 2,
            y: sell.pointY,
            radius: radius,
            alpha: alpha
          }, void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
            x: sell.pointX,
            y: sell.pointY
          }, {
            children: jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
              width: width,
              height: height - sell.pointY,
              color: tooltip[hd_componentsOrderBook.L2MessageSide.sell].color,
              alpha: alpha
            }, void 0)
          }), void 0)]
        }, void 0), buy && jsxRuntime.jsxs(jsxRuntime.Fragment, {
          children: [jsxRuntime.jsx(hd_componentsMultiApp.Circle, {
            color: tooltip[hd_componentsOrderBook.L2MessageSide.buy].color,
            x: buy.pointX + width / 2,
            y: buy.pointY,
            radius: radius,
            alpha: alpha
          }, void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
            x: buy.pointX,
            y: buy.pointY
          }, {
            children: jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
              width: width,
              height: height - buy.pointY,
              color: tooltip[hd_componentsOrderBook.L2MessageSide.buy].color,
              alpha: alpha
            }, void 0)
          }), void 0)]
        }, void 0)]
      }, void 0)
    }, void 0);
  });

  const midPriceDataSelector = state => ({
    price: state.app.middlePrice,
    height: state.viewport.height,
    decimalPart: state.app.symbol.term.decimalPart,
    formatMidPrice: state.app.formatFunctions.price
  });

  const ANCHOR = [0.5, 0.5];
  const PriceLine = /*#__PURE__*/React__namespace.memo(({
    height
  }) => jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
    children: ({
      depthChart: {
        midPrice: {
          line: {
            color
          }
        }
      }
    }) => jsxRuntime.jsx(hd_componentsMultiApp.Line, {
      color: color,
      lineWidth: 1,
      alpha: 0.2,
      lines: [[[0, height], [0, height - height / 2]]]
    }, void 0)
  }, void 0));
  Object.assign(Object.assign({}, hd_componentsCommon.robotoCondensedRegular16), {
    fontSize: 20
  });
  const MidPrice = /*#__PURE__*/React__namespace.memo(({
    renderLine,
    xMidPrice,
    xMidPriceLabel
  }) => {
    const {
      price,
      height,
      decimalPart,
      formatMidPrice
    } = reactRedux.useSelector(midPriceDataSelector);
    const formattedMidPrice = formatMidPrice(hd_componentsUtils.formatMoney(price, decimalPart));
    return jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
      children: ({
        depthChart: {
          midPrice
        }
      }) => jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [jsxRuntime.jsx(reactPixi.Container, Object.assign({
          x: xMidPriceLabel || xMidPrice,
          y: 20
        }, {
          children: jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
            anchor: ANCHOR,
            height: 10,
            width: 10,
            horizontal: 'left',
            text: hd_componentsCommon.getFormattedNumber(formattedMidPrice),
            style: hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoCondensedRegular16, midPrice.price.color),
            vertical: 'top'
          }, void 0)
        }), void 0), renderLine && jsxRuntime.jsx(reactPixi.Container, Object.assign({
          x: xMidPrice,
          y: 20
        }, {
          children: jsxRuntime.jsx(PriceLine, {
            height: height
          }, void 0)
        }), void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
          x: xMidPriceLabel || xMidPrice,
          y: 45
        }, {
          children: jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
            anchor: ANCHOR,
            height: 10,
            width: 10,
            horizontal: 'left',
            text: 'Mid Market Price',
            style: hd_componentsCommon.fontStyleCache(hd_componentsCommon.ttfRobotoCondensed_regular_10, midPrice.label.color),
            vertical: 'top'
          }, void 0)
        }), void 0)]
      }, void 0)
    }, void 0);
  });

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */

  function __decorate(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  function __awaiter(thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  }

  let Plotter = class Plotter extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.lineRef = /*#__PURE__*/React__namespace.createRef();
      this.areaRef = /*#__PURE__*/React__namespace.createRef();
    }

    componentDidUpdate() {
      this.update();
    }

    componentDidMount() {
      this.lineRef.current.filters = [];

      if (this.props.line.shadow) {
        this.lineRef.current.filters = this.props.line.shadow.map(options => new filterDropShadow.DropShadowFilter(options));
        this.lineRef.current.filters.push(new filterOutline.OutlineFilter(0, this.props.line.color, this.props.line.alpha));
      }

      this.update();
    }

    render() {
      return [jsxRuntime.jsx(reactPixi.Graphics, {
        ref: this.lineRef
      }, 'line'), jsxRuntime.jsx(reactPixi.Graphics, {
        ref: this.areaRef
      }, 'area')];
    }

    update() {
      const polygon = new PIXI__namespace.Polygon(this.props.polygon);
      polygon.closeStroke = false;
      this.lineRef.current.clear().lineStyle(this.props.lineWidth, this.props.line.color, this.props.line.alpha).drawPolygon(polygon);
      this.areaRef.current.clear().beginFill(this.props.area.color, this.props.area.alpha).lineStyle(0).drawPolygon(this.closeArea(this.props.polygon, this.props.height)).endFill();
    }

    closeArea(points, height) {
      const firstX = points[0] || 0;
      const lastX = points[points.length - 2] || 0;
      return [firstX, height, ...points, lastX, height, firstX, height];
    }

  };
  Plotter = __decorate([hd_componentsMultiApp.Pure()], Plotter);

  const formatPrice = (price, decimalPart) => {
    const formatted = hd_componentsUtils.formatMoney(price.abs(), decimalPart);
    return price.gte(decimalUtils.ZERO) ? `${formatted}` : `-${formatted}`;
  };

  const XAxis = /*#__PURE__*/React__namespace.memo(({
    ticks,
    color,
    width,
    decimalPart
  }) => {
    const {
      xAxis: formatXAxis
    } = reactRedux.useSelector(formatFunctionsSelector);
    return jsxRuntime.jsxs(reactPixi.Container, {
      children: [jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
        children: ({
          depthChart: {
            xAxis: {
              background: {
                color
              }
            }
          }
        }) => jsxRuntime.jsx(reactPixi.Container, Object.assign({
          y: -10
        }, {
          children: jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
            color: color,
            width: width,
            height: 10,
            alpha: 1
          }, void 0)
        }), void 0)
      }, void 0), ticks.map(({
        label,
        x
      }, i) => jsxRuntime.jsx(hd_componentsMultiApp.XAxisLabel, {
        formatFunction: formatXAxis,
        y: 0,
        x: x,
        style: hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, color),
        text: formatPrice(decimalUtils.toDecimal(label), decimalPart),
        width: 100,
        height: 12,
        position: 'bottom'
      }, i))]
    }, void 0);
  }, deepEqual__default["default"]);

  const Labels = /*#__PURE__*/React__namespace.memo(({
    width,
    color,
    tick,
    liner
  }) => {
    const {
      yAxis: formatYAxis
    } = reactRedux.useSelector(formatFunctionsSelector);
    const visible = tick !== undefined;
    const props = visible ? {
      text: tick.toFixed(2),
      y: liner(tick) - 5
    } : {
      y: -1,
      text: ''
    };
    const style = hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, color);
    return jsxRuntime.jsxs(reactPixi.Container, Object.assign({
      visible: visible
    }, {
      children: [jsxRuntime.jsx(hd_componentsMultiApp.YAxisLabel, Object.assign({
        formatFunction: formatYAxis,
        width: 20,
        height: 10,
        x: 0,
        position: 'left',
        style: style
      }, props), void 0), jsxRuntime.jsx(hd_componentsMultiApp.YAxisLabel, Object.assign({
        formatFunction: formatYAxis,
        width: 50,
        height: 10,
        x: width,
        position: 'right',
        style: style
      }, props), void 0)]
    }), tick);
  });
  const YAxis = /*#__PURE__*/React__namespace.memo(({
    range: [from, to],
    height,
    width,
    color
  }) => {
    const liner = React__namespace.useCallback(tick => hd_componentsMultiApp.fLiner({
      from,
      to
    }, {
      from: height,
      to: 0
    }, tick), [from, to, height]);
    const ticks = React__namespace.useMemo(() => hd_componentsUtils.createTicks(from, to, 7), [from, to]);
    return jsxRuntime.jsx(jsxRuntime.Fragment, {
      children: ticks.slice(0, 10).map(tick => jsxRuntime.jsx(Labels, {
        tick: tick,
        width: width,
        color: color,
        liner: liner
      }, tick))
    }, void 0);
  });

  const mapStateToProps = state => {
    const xAxisWidth = 10;
    const orientation = state.app.parameters.orientation;
    const {
      width,
      height
    } = state.viewport;
    const {
      buy,
      sell
    } = state.app.prices;
    const {
      middlePrice
    } = state.app;

    if (buy.length === 0 && sell.length === 0) {
      return hd_componentsMultiApp.SkipRenderProps;
    }

    const chartHeight = height - xAxisWidth;
    const {
      sellPolygon,
      buyPolygon,
      ticks,
      xOriginalMidPrice,
      maxQuantity,
      xMidPrice
    } = createPolygons(buy, sell, middlePrice, chartHeight, width, orientation);
    return {
      height,
      width,
      buyPolygon,
      sellPolygon,
      chartHeight,
      maxQuantity,
      xMidPrice,
      xOriginalMidPrice,
      symbol: state.app.symbol,
      ticks,
      highlightPrices: state.app.highlightPrices
    };
  };

  class Root extends React__namespace.Component {
    render() {
      const {
        buyPolygon,
        sellPolygon,
        width,
        chartHeight,
        height,
        maxQuantity,
        symbol,
        ticks,
        highlightPrices,
        xMidPrice,
        xOriginalMidPrice
      } = this.props;
      return jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
        children: ({
          depthChart: {
            plotter,
            yAxis,
            xAxis,
            background
          }
        }) => jsxRuntime.jsxs(reactPixi.Container, {
          children: [jsxRuntime.jsx(hd_componentsMultiApp.Background, Object.assign({
            width: width,
            height: height
          }, background), void 0), jsxRuntime.jsxs(reactPixi.Container, {
            children: [jsxRuntime.jsx(reactPixi.Container, {
              children: jsxRuntime.jsx(Plotter, Object.assign({
                polygon: buyPolygon,
                height: chartHeight
              }, plotter[hd_componentsOrderBook.L2MessageSide.buy], {
                lineWidth: plotter.lineWidth
              }), void 0)
            }, void 0), jsxRuntime.jsx(reactPixi.Container, {
              children: jsxRuntime.jsx(Plotter, Object.assign({
                polygon: sellPolygon,
                height: chartHeight
              }, plotter[hd_componentsOrderBook.L2MessageSide.sell], {
                lineWidth: plotter.lineWidth
              }), void 0)
            }, void 0), jsxRuntime.jsx(YAxis, {
              height: chartHeight,
              width: width,
              range: [0, maxQuantity],
              color: yAxis.label.color
            }, void 0)]
          }, void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
            y: height
          }, {
            children: jsxRuntime.jsx(XAxis, {
              ticks: ticks,
              color: xAxis.label.color,
              width: width,
              decimalPart: symbol.term.decimalPart
            }, void 0)
          }), void 0), highlightPrices.buy !== null && highlightPrices.sell !== null && jsxRuntime.jsx(Highlight, {
            height: chartHeight
          }, void 0), jsxRuntime.jsx(MidPrice, {
            renderLine: true,
            xMidPrice: xMidPrice,
            xMidPriceLabel: xOriginalMidPrice
          }, void 0), jsxRuntime.jsx(ConnectedCrossHair, {}, void 0)]
        }, void 0)
      }, void 0);
    }

  }

  const ConnectedRoot = hd_componentsMultiApp.connectWithSkip(mapStateToProps, Root);

  const awaitInitializeEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(hd_componentsDepthChartCommon.updateDepthChartAction), operators.filter(({
    payload: {
      buy,
      sell
    }
  }) => buy.length !== 0 || sell.length !== 0), operators.map(() => hd_componentsMultiApp.appInitializedAction()), operators.take(1));

  const zoomEpic = (orderBook, channel, smoothness) => action$ => {
    let current = 1;
    let step = 0.1;
    return action$.pipe(hd_componentsUtils.isCreator(hd_componentsMultiApp.wheelAction), operators.map(({
      payload: {
        delta
      }
    }) => delta), operators.tap(delta => {
      current += delta > 0 ? step : -step; // current -= delta > 0 ? step : -step; todo normalized scroll direction

      current = Math.max(0.01, Math.min(1, current));
      step = current / (smoothness * 10);
      orderBook.sendActionToOrderBookWorker(channel, hd_componentsDepthChartCommon.depthChartZoomAction(current));
    }), operators.ignoreElements());
  };

  const initiatingTypes = [hd_componentsUtils.getType(hd_componentsMultiApp.changePositionAction), hd_componentsUtils.getType(hd_componentsDepthChartCommon.depthChartZoomAction), hd_componentsUtils.getType(hd_componentsDepthChartCommon.updateDepthChartAction)];
  const createDepthChartEpic = (orderBook, symbol, parameters, channel, appId) => reduxObservable.combineEpics((action$, state$) => rxjs.merge(orderBook.subscribe(symbol, parameters, channel, hd_componentsDepthChartCommon.depthChartEpicType, appId), action$.pipe(operators.filter(({
    type
  }) => initiatingTypes.includes(type)), operators.debounce(() => rxjs.interval(10)), operators.tap(() => {
    const state = state$.value;
    const {
      sell,
      buy
    } = state.app.prices;

    if (state.input.onCanvas) {
      const [filteredBuy, filteredSell] = getFilteredPrices(buy, sell, state.app.parameters.orientation);

      if (filteredBuy.length > 0 || filteredSell.length > 0) {
        const [price, side] = getPriceByX(state);

        if (price) {
          orderBook.sendActionToOrderBookWorker(hd_componentsOrderBook.recordHoveredAction(parameters.groupId, side, {
            price
          }));
        }
      }
    }
  }), operators.ignoreElements()), action$.pipe(hd_componentsUtils.isCreator(hd_componentsMultiApp.changeOnCanvasAction), operators.filter(action => !action.payload.onCanvas), operators.tap(() => {
    orderBook.sendActionToOrderBookWorker(hd_componentsOrderBook.noHoveredRecordsAction(parameters.groupId));
  }), operators.ignoreElements())), awaitInitializeEpic, zoomEpic(orderBook, channel, 1));

  const highlightPriceReducer = (state, action) => {
    const {
      payload: {
        groupId,
        side,
        entity
      }
    } = action;

    if (state.app.parameters.groupId !== groupId) {
      return state;
    }

    const {
      buy,
      sell
    } = state.app.prices;

    if (buy.length === 0 && sell.length === 0) {
      return state;
    }

    const {
      orientation
    } = state.app.parameters;

    if (!orientation || orientation === hd_componentsDepthChartCommon.EOrientations.price) {
      const [filteredBuyPrices, filteredSellPrices] = getFilteredPrices(buy, sell, orientation);

      if (filteredBuyPrices.length === 0 && filteredSellPrices.length === 0) {
        return state;
      }

      const bestBuyPrice = filteredBuyPrices.length ? filteredBuyPrices[0].price : decimalUtils.ZERO;
      const bestSellPrice = filteredSellPrices.length ? filteredSellPrices[0].price : decimalUtils.ZERO;
      const priceDifference = side === hd_componentsOrderBook.L2MessageSide.sell ? decimalUtils.toDecimal(entity.price).minus(bestSellPrice) : bestBuyPrice.minus(entity.price);
      const sellPrice = bestSellPrice.add(priceDifference);
      const buyPrice = bestBuyPrice.minus(priceDifference);
      return Object.assign(Object.assign({}, state), {
        app: Object.assign(Object.assign({}, state.app), {
          highlightPrices: {
            mainSide: side,
            [hd_componentsOrderBook.L2MessageSide.sell]: sellPrice,
            [hd_componentsOrderBook.L2MessageSide.buy]: buyPrice
          }
        })
      });
    } else {
      let price1;
      const currentSide = side === hd_componentsOrderBook.L2MessageSide.buy ? buy : sell;
      const oppositeSide = side !== hd_componentsOrderBook.L2MessageSide.buy ? buy : sell;
      let minDiff = decimalUtils.POSITIVE_INFINITY;
      let index = 0;

      for (let i = 0; i < currentSide.length; i++) {
        const diff = currentSide[i].price.minus(entity.price).abs();

        if (diff.lte(minDiff)) {
          minDiff = diff;
          index = i;
        } else {
          break;
        }
      }

      if (!currentSide[index]) {
        return state;
      }

      const price2 = currentSide[index].price;
      minDiff = decimalUtils.POSITIVE_INFINITY;

      for (const level of oppositeSide) {
        const diff = level.sum.minus(currentSide[index].sum).abs();
        price1 = level.price;

        if (diff.lte(minDiff)) {
          minDiff = diff;
        } else {
          break;
        }
      }

      return Object.assign(Object.assign({}, state), {
        app: Object.assign(Object.assign({}, state.app), {
          highlightPrices: {
            mainSide: side,
            [hd_componentsOrderBook.L2MessageSide.sell]: side === hd_componentsOrderBook.L2MessageSide.buy ? price1 : price2,
            [hd_componentsOrderBook.L2MessageSide.buy]: side !== hd_componentsOrderBook.L2MessageSide.buy ? price1 : price2
          }
        })
      });
    }
  };

  const noPriceToHighlightReducer = (state, action) => {
    const {
      payload: {
        groupId
      }
    } = action;

    if (state.app.parameters.groupId !== groupId) {
      return state;
    }

    return Object.assign(Object.assign({}, state), {
      app: Object.assign(Object.assign({}, state.app), {
        highlightPrices: {
          mainSide: null,
          [hd_componentsOrderBook.L2MessageSide.sell]: null,
          [hd_componentsOrderBook.L2MessageSide.buy]: null
        }
      })
    });
  };

  const updateParametersReducer = (state, action) => {
    const {
      payload: {
        parameters
      }
    } = action;
    return Object.assign(Object.assign({}, state), {
      app: Object.assign(Object.assign({}, state.app), {
        parameters: Object.assign(Object.assign({}, state.app.parameters), parameters)
      })
    });
  };

  const cast = data => data.map(item => Object.assign(Object.assign({}, item), {
    price: decimalUtils.toDecimal(item.price),
    sum: decimalUtils.toDecimal(item.sum)
  }));

  const updateReducer = (state, action) => {
    const {
      payload: {
        buy,
        sell,
        middlePrice
      }
    } = action;
    return Object.assign(Object.assign({}, state), {
      app: Object.assign(Object.assign({}, state.app), {
        prices: {
          buy: cast(buy),
          sell: cast(sell)
        },
        middlePrice: decimalUtils.toDecimal(middlePrice),
        symbol: state.app.symbol
      })
    });
  };

  const depthChartReducer = ({
    parameters,
    formatFunctions,
    symbol
  }) => hd_componentsUtils.createRootReducer([[updateReducer, hd_componentsDepthChartCommon.updateDepthChartAction], [highlightPriceReducer, hd_componentsDepthChartCommon.highlightPriceAction], [noPriceToHighlightReducer, hd_componentsDepthChartCommon.noPriceToHighlightAction], [updateParametersReducer, hd_componentsDepthChartCommon.updateParametersAction]], {
    parameters,
    formatFunctions,
    prices: {
      buy: [],
      sell: []
    },
    highlightPrices: {
      mainSide: null,
      buy: null,
      sell: null
    },
    middlePrice: undefined,
    symbol
  });

  class DepthChartEmbeddableKernel extends hd_componentsMultiApp.AbstractEmbeddableKernel {
    getAppRoot() {
      return ConnectedRoot;
    }

    getAppType() {
      return 'depthChart';
    }

    createReducerAndEpic(container, _, appId) {
      return __awaiter(this, void 0, void 0, function* () {
        const symbol = container.getParameter('symbol');
        const parameters = container.getParameter('parameters');
        const rawFormatFunctions = container.getParameter('formatFunctions');
        const orderBook = container.get('orderBook');
        yield container.get('resourceLoader').loadAll();
        const channel = `${Math.random()}`;
        const formatFunctions = {
          yAxis: rawFormatFunctions.yAxis || hd_componentsCommon.noopFormatFunction,
          xAxis: rawFormatFunctions.xAxis || hd_componentsCommon.noopFormatFunction,
          price: rawFormatFunctions.price || hd_componentsCommon.noopFormatFunction,
          volume: rawFormatFunctions.volume || hd_componentsCommon.noopFormatFunction
        };
        const reducer = depthChartReducer({
          symbol,
          parameters,
          formatFunctions
        });
        const depthChartEpic = createDepthChartEpic(orderBook, symbol.symbol, parameters, channel, appId);
        return {
          reducer,
          epic: depthChartEpic
        };
      });
    }

  }

  const depthCharParameters = {
    default: {
      // name of extension
      resource: {
        resources: [...hd_componentsCommon.commonFonts]
      }
    }
  };

  exports.ConnectedRoot = ConnectedRoot;
  exports.DepthChartEmbeddableKernel = DepthChartEmbeddableKernel;
  exports.createDepthChartEpic = createDepthChartEpic;
  exports.depthCharParameters = depthCharParameters;
  exports.findClosestIndex = findClosestIndex;
  exports.formatFunctionsSelector = formatFunctionsSelector;
  exports.getPriceByX = getPriceByX;
  exports.getQuantityByPrice = getQuantityByPrice;
  exports.getXByPrice = getXByPrice;
  exports.getYByPrice = getYByPrice;
  exports.highlightPricesSelector = highlightPricesSelector;
  exports.priceInSpread = priceInSpread;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
