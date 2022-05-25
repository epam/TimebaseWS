import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { fLinerDecimal, Rectangle, AlignText, Line, connectWithSkip, SkipRenderProps, Styled, Circle, Pure, XAxisLabel, fLiner, YAxisLabel, Background, appInitializedAction, wheelAction, changePositionAction, changeOnCanvasAction, AbstractEmbeddableKernel } from '@deltix/hd.components-multi-app';
import { L2MessageSide, recordHoveredAction, noHoveredRecordsAction } from '@deltix/hd.components-order-book';
import { Container, Graphics } from '@inlet/react-pixi';
import * as React from 'react';
import { ZERO, minDecimal, maxDecimal, toDecimal, negate, POSITIVE_INFINITY } from '@deltix/decimal-utils';
import { createDecimalTicks, formatMoney, createTicks, isCreator, getType, createRootReducer } from '@deltix/hd.components-utils';
import { range } from 'lodash';
import { EOrientations, updateDepthChartAction, depthChartZoomAction, depthChartEpicType, highlightPriceAction, noPriceToHighlightAction, updateParametersAction } from '@deltix/hd.components-depth-chart-common';
import { ttfRobotoCondensed_regular_10, getFormattedNumber, robotoCondensedRegular16, fontStyleCache, robotoMonoRegular10, noopFormatFunction, commonFonts } from '@deltix/hd.components-common';
import { useSelector } from 'react-redux';
import { DropShadowFilter } from '@pixi/filter-drop-shadow';
import { OutlineFilter } from '@pixi/filter-outline';
import * as PIXI from 'pixi.js';
import deepEqual from 'fast-deep-equal';
import { combineEpics } from 'redux-observable';
import { merge, interval } from 'rxjs';
import { filter, map, take, tap, ignoreElements, debounce } from 'rxjs/operators';

const getMaxQuantity = (buyPrices, sellPrices, orientation) => {
  const lastSellSum = sellPrices.length ? sellPrices[sellPrices.length - 1].sum : ZERO;
  const lastBuySum = buyPrices.length ? buyPrices[buyPrices.length - 1].sum : ZERO;
  let sum;

  switch (orientation) {
    case EOrientations.price:
      sum = maxDecimal(lastSellSum, lastBuySum);
      break;

    case EOrientations.quantity:
      sum = minDecimal(lastSellSum, lastBuySum);
      break;
  }

  if (sum.eq(ZERO)) {
    sum = maxDecimal(lastSellSum, lastBuySum);
  }

  return sum;
};

const getFilteredPrices = (buyPrices, sellPrices, orientation) => {
  const maxQuantity = getMaxQuantity(buyPrices, sellPrices, orientation);
  return [buyPrices.filter(price => price.sum.lte(maxQuantity)), sellPrices.filter(price => price.sum.lte(maxQuantity)), maxQuantity];
};

const getXmidPrice = (from, to, width, midPrice, orientation) => {
  const w = toDecimal(width);

  if (orientation === EOrientations.price) {
    return w.div(2);
  }

  const priceDifference = to.minus(from);

  if (priceDifference.eq(ZERO)) {
    return ZERO;
  } else if (priceDifference.gt(ZERO)) {
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
    from: prices.length ? prices[prices.length - 1].price : ZERO,
    to: midPrice
  };
};

const createRangeParams = (width, leftPrice, rightPrice) => {
  const tickWidth = 80;
  const countTicks = Math.ceil(width / tickWidth);
  const ticks = createDecimalTicks(minDecimal(leftPrice, rightPrice), maxDecimal(leftPrice, rightPrice), countTicks);
  const step = ticks[1].minus(ticks[0]);
  return [leftPrice, rightPrice, step];
};

const createXCommonAxis = (start, end, sep, liner) => {
  const priceRange = range(start, end, sep);
  const prices = priceRange.map(price => ({
    label: price,
    x: liner(price)
  }));
  return prices.slice(1);
};

const takeLastPrice = values => values.length === 0 ? ZERO : values[values.length - 1].price;

const createXAxis = (buyPrices, sellPrices, buyLiner, sellLiner, middlePrice, xMidPrice, width) => {
  const middle = {
    label: middlePrice,
    x: xMidPrice
  };
  let lastSellPrice = takeLastPrice(sellPrices);
  let lastBuyPrice = takeLastPrice(buyPrices);

  if (lastSellPrice.eq(ZERO)) {
    lastSellPrice = lastBuyPrice;
  }

  if (lastBuyPrice.eq(ZERO)) {
    lastBuyPrice = lastSellPrice; // ?
  }

  if (xMidPrice.lte(ZERO)) {
    const [_sellStart, _sellEnd, _sellStep] = createRangeParams(width - xMidPrice.toNumber(), middlePrice, lastSellPrice);
    return [middle, ...createXCommonAxis(_sellStart.toNumber(), _sellEnd.toNumber(), _sellStep.toNumber(), sellLiner)];
  }

  if (xMidPrice.gte(width)) {
    const [_buyStart, _buyEnd, _buyStep] = createRangeParams(xMidPrice.toNumber(), lastBuyPrice, middlePrice);
    return [...createXCommonAxis(_buyEnd.toNumber(), _buyStart.toNumber(), negate(_buyStep).toNumber(), buyLiner), middle];
  }

  const [buyStart, buyEnd, buyStep] = createRangeParams(xMidPrice.toNumber(), lastBuyPrice, middlePrice);
  const [sellStart, sellEnd, sellStep] = createRangeParams(width - xMidPrice.toNumber(), middlePrice, lastSellPrice);
  const step = maxDecimal(buyStep, sellStep);
  return [...createXCommonAxis(buyEnd.toNumber(), buyStart.toNumber(), negate(step).toNumber(), buyLiner), middle, ...createXCommonAxis(sellStart.toNumber(), sellEnd.toNumber(), step.toNumber(), sellLiner)];
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
      xMidPrice: toDecimal(chartWidth / 2),
      maxQuantity: ZERO
    };
  }

  const yDomain = {
    from: ZERO,
    to: maxQuantity
  };
  const yRange = {
    from: toDecimal(chartHeight),
    to: ZERO
  };

  const yLiner = quantity => fLinerDecimal(yDomain, yRange, quantity);

  const xBuyDomain = createXDomain(filteredBuyPrices, middlePrice);
  const xSellDomain = createXDomain(filteredSellPrices, middlePrice);
  const xMidPrice = getXmidPrice(xBuyDomain.from, xSellDomain.from, chartWidth, middlePrice, orientation);
  const inSpread = xBuyDomain.from.gte(xSellDomain.from);
  const buyRange = {
    from: ZERO,
    to: xMidPrice
  };

  const xBuyLiner = price => fLinerDecimal(xBuyDomain, buyRange, price);

  const sellRange = {
    from: toDecimal(chartWidth),
    to: xMidPrice
  };

  const xSellLiner = price => fLinerDecimal(xSellDomain, sellRange, price);

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

  const buyWorst = filteredBuyPrices.length ? filteredBuyPrices[filteredBuyPrices.length - 1].price : ZERO;
  const sellWorst = filteredSellPrices.length ? filteredSellPrices[filteredSellPrices.length - 1].price : ZERO;
  const sellBest = filteredSellPrices.length ? filteredSellPrices[0].price : ZERO;
  const buyBest = filteredBuyPrices.length ? filteredBuyPrices[0].price : ZERO;
  const xMidPrice = getXmidPrice(buyWorst, sellWorst, width, middlePrice, orientation);

  const _x = toDecimal(x);

  let side = _x.lt(xMidPrice) ? L2MessageSide.buy : L2MessageSide.sell;
  let from = buyWorst;
  let to = sellWorst;

  if (!filteredSellPrices.length) {
    to = buyBest;
    side = L2MessageSide.buy;
  } else if (!filteredBuyPrices.length) {
    from = sellBest;
    side = L2MessageSide.sell;
  }

  const price = from.eq(to) ? from : fLinerDecimal({
    from: ZERO,
    to: toDecimal(width)
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
    case L2MessageSide.buy:
      {
        const buyCoefficient = middlePrice.minus(buyWorst).div(xMidPrice);
        const buyPrice = price.gt(buyBest) ? buyBest : price;
        const buyDifference = buyPrice.minus(buyWorst);
        return buyDifference.div(buyCoefficient).toNumber();
      }

    case L2MessageSide.sell:
      {
        const sellCoefficient = sellWorst.minus(middlePrice).div(toDecimal(width).minus(xMidPrice));
        const sellPrice = price.lt(sellBest) ? sellBest : price;
        const sellDifference = sellWorst.minus(sellPrice);
        return width - sellDifference.div(sellCoefficient).toNumber();
      }
  }
};
const getQuantityByPrice = (state, price, dataSet) => {
  var _a;

  const index = findClosestIndex(price, state.app.prices[dataSet], _ => _.price, dataSet === L2MessageSide.buy);
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
    from: ZERO,
    to: getMaxQuantity(buy, sell, orientation)
  };
  const range = {
    from: toDecimal(state.viewport.height - 10),
    to: ZERO
  };
  return fLinerDecimal(domain, range, getQuantityByPrice(state, price, dataSet)).toNumber();
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
  const buyPrice = highlightPriceSelector(state, L2MessageSide.buy);
  const sellPrice = highlightPriceSelector(state, L2MessageSide.sell);
  return {
    [L2MessageSide.sell]: sellPrice,
    [L2MessageSide.buy]: buyPrice
  };
};
const formatFunctionsSelector = state => state.app.formatFunctions;

const ANCHOR$1 = [0, 0];
const priceStyle = Object.assign(Object.assign({}, ttfRobotoCondensed_regular_10), {
  fontSize: 15
});
const legendStyle = Object.assign(Object.assign({}, ttfRobotoCondensed_regular_10), {
  fontSize: 12
});
const volumeStyle = Object.assign(Object.assign({}, ttfRobotoCondensed_regular_10), {
  fontSize: 12
});
const padding = 10;

const getFormattedVolume = (volume, decimalPart, code) => `${formatMoney(volume, decimalPart)} ${code}`;

const getFormattedTotalPrice = (volume, price, decimalPart, code) => `${formatMoney(volume.times(price), decimalPart)} ${code}`;

const getFormattedPrice = (price, decimalPart, code) => `${formatMoney(price, decimalPart)} ${code}`;

const Legend = /*#__PURE__*/React.memo(({
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
  } = useSelector(formatFunctionsSelector);
  const offset = labelWidth / 2 - padding;
  const secondLine = padding + 20;
  const thirdLine = secondLine + 20;
  const formattedTotalPrice = formatPrice(getFormattedTotalPrice(volume, price, term.decimalPart, term.code));
  const formattedVolume = volume ? formatVolume(getFormattedVolume(volume, base.decimalPart, base.code)) : '';
  const formattedPrice = formatPrice(getFormattedPrice(price, term.decimalPart, term.code));
  return jsxs(Fragment, {
    children: [jsx(Rectangle, {
      width: labelWidth,
      height: labelHeight,
      color: 0x1e2b34,
      alpha: 0.8
    }, void 0), jsx(Container, Object.assign({
      x: padding,
      y: padding
    }, {
      children: jsx(AlignText, {
        anchor: ANCHOR$1,
        height: 10,
        width: 10,
        horizontal: 'left',
        text: getFormattedNumber(formattedPrice),
        style: priceStyle,
        vertical: 'top'
      }, void 0)
    }), void 0), jsx(Container, Object.assign({
      x: padding,
      y: secondLine
    }, {
      children: jsx(AlignText, {
        anchor: ANCHOR$1,
        height: 10,
        width: 10,
        horizontal: 'left',
        text: type === L2MessageSide.sell ? 'Can be bought:' : 'Can be sold:',
        style: legendStyle,
        vertical: 'top'
      }, void 0)
    }), void 0), jsx(Line, {
      color: 0xb8b9b9,
      lineWidth: 1,
      alpha: 1,
      lines: [[[padding + offset, secondLine], [padding + offset, labelHeight - padding]]]
    }, void 0), jsx(Container, Object.assign({
      x: padding * 2 + offset,
      y: secondLine
    }, {
      children: jsx(AlignText, {
        anchor: ANCHOR$1,
        height: 10,
        width: 10,
        horizontal: 'left',
        text: 'For a total of:',
        style: legendStyle,
        vertical: 'top'
      }, void 0)
    }), void 0), jsx(Container, Object.assign({
      x: padding * 2 + offset,
      y: thirdLine
    }, {
      children: jsx(AlignText, {
        anchor: ANCHOR$1,
        height: 10,
        width: 10,
        horizontal: 'left',
        text: getFormattedNumber(formattedTotalPrice),
        style: volumeStyle,
        vertical: 'top'
      }, void 0)
    }), void 0), jsx(Container, Object.assign({
      x: padding,
      y: thirdLine
    }, {
      children: jsx(AlignText, {
        anchor: ANCHOR$1,
        height: 10,
        width: 10,
        horizontal: 'left',
        text: getFormattedNumber(formattedVolume),
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
    case L2MessageSide.sell:
      if (pointX + labelOffset < labelWidth) {
        return right;
      } else {
        return left;
      }

    case L2MessageSide.buy:
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
    return SkipRenderProps;
  }

  if (!price) {
    return SkipRenderProps;
  }

  if (priceInSpread(state, price)) {
    return SkipRenderProps;
  }

  if (pointX === undefined) {
    return SkipRenderProps;
  }

  if (pointX < 0) {
    return SkipRenderProps;
  }

  if (pointX > width) {
    return SkipRenderProps;
  }

  const color = type === L2MessageSide.sell ? 0xff6939 : 0x4da53c;
  const volume = getQuantityByPrice(state, price, type);
  const pointY = getYByPrice(state, price, type);
  const labelY = getLabelY(state.viewport.height, labelWidth, pointY);
  const labelX = getLabelX(width, labelWidth, pointX, type);
  const linePosition = type === L2MessageSide.sell ? ELinePosition.left : ELinePosition.right;
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

const CrossHair = /*#__PURE__*/React.memo(props => jsx(Styled, {
  children: ({
    depthChart: {
      tooltip
    }
  }) => jsx(Container, Object.assign({
    x: props.labelX + 1.5,
    y: props.labelY
  }, {
    children: jsx(Legend, {
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
const ConnectedCrossHair = connectWithSkip(mapStateToProps$1, CrossHair);

const width = 3;
const radius = width * 2;
const alpha = 1;
const Highlight = /*#__PURE__*/React.memo(({
  height
}) => {
  const {
    sell,
    buy
  } = useSelector(highlightPricesSelector);
  return jsx(Styled, {
    children: ({
      depthChart: {
        tooltip
      }
    }) => jsxs(Fragment, {
      children: [sell && jsxs(Fragment, {
        children: [jsx(Circle, {
          color: tooltip[L2MessageSide.sell].color,
          x: sell.pointX + width / 2,
          y: sell.pointY,
          radius: radius,
          alpha: alpha
        }, void 0), jsx(Container, Object.assign({
          x: sell.pointX,
          y: sell.pointY
        }, {
          children: jsx(Rectangle, {
            width: width,
            height: height - sell.pointY,
            color: tooltip[L2MessageSide.sell].color,
            alpha: alpha
          }, void 0)
        }), void 0)]
      }, void 0), buy && jsxs(Fragment, {
        children: [jsx(Circle, {
          color: tooltip[L2MessageSide.buy].color,
          x: buy.pointX + width / 2,
          y: buy.pointY,
          radius: radius,
          alpha: alpha
        }, void 0), jsx(Container, Object.assign({
          x: buy.pointX,
          y: buy.pointY
        }, {
          children: jsx(Rectangle, {
            width: width,
            height: height - buy.pointY,
            color: tooltip[L2MessageSide.buy].color,
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
const PriceLine = /*#__PURE__*/React.memo(({
  height
}) => jsx(Styled, {
  children: ({
    depthChart: {
      midPrice: {
        line: {
          color
        }
      }
    }
  }) => jsx(Line, {
    color: color,
    lineWidth: 1,
    alpha: 0.2,
    lines: [[[0, height], [0, height - height / 2]]]
  }, void 0)
}, void 0));
Object.assign(Object.assign({}, robotoCondensedRegular16), {
  fontSize: 20
});
const MidPrice = /*#__PURE__*/React.memo(({
  renderLine,
  xMidPrice,
  xMidPriceLabel
}) => {
  const {
    price,
    height,
    decimalPart,
    formatMidPrice
  } = useSelector(midPriceDataSelector);
  const formattedMidPrice = formatMidPrice(formatMoney(price, decimalPart));
  return jsx(Styled, {
    children: ({
      depthChart: {
        midPrice
      }
    }) => jsxs(Fragment, {
      children: [jsx(Container, Object.assign({
        x: xMidPriceLabel || xMidPrice,
        y: 20
      }, {
        children: jsx(AlignText, {
          anchor: ANCHOR,
          height: 10,
          width: 10,
          horizontal: 'left',
          text: getFormattedNumber(formattedMidPrice),
          style: fontStyleCache(robotoCondensedRegular16, midPrice.price.color),
          vertical: 'top'
        }, void 0)
      }), void 0), renderLine && jsx(Container, Object.assign({
        x: xMidPrice,
        y: 20
      }, {
        children: jsx(PriceLine, {
          height: height
        }, void 0)
      }), void 0), jsx(Container, Object.assign({
        x: xMidPriceLabel || xMidPrice,
        y: 45
      }, {
        children: jsx(AlignText, {
          anchor: ANCHOR,
          height: 10,
          width: 10,
          horizontal: 'left',
          text: 'Mid Market Price',
          style: fontStyleCache(ttfRobotoCondensed_regular_10, midPrice.label.color),
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

let Plotter = class Plotter extends React.Component {
  constructor() {
    super(...arguments);
    this.lineRef = /*#__PURE__*/React.createRef();
    this.areaRef = /*#__PURE__*/React.createRef();
  }

  componentDidUpdate() {
    this.update();
  }

  componentDidMount() {
    this.lineRef.current.filters = [];

    if (this.props.line.shadow) {
      this.lineRef.current.filters = this.props.line.shadow.map(options => new DropShadowFilter(options));
      this.lineRef.current.filters.push(new OutlineFilter(0, this.props.line.color, this.props.line.alpha));
    }

    this.update();
  }

  render() {
    return [jsx(Graphics, {
      ref: this.lineRef
    }, 'line'), jsx(Graphics, {
      ref: this.areaRef
    }, 'area')];
  }

  update() {
    const polygon = new PIXI.Polygon(this.props.polygon);
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
Plotter = __decorate([Pure()], Plotter);

const formatPrice = (price, decimalPart) => {
  const formatted = formatMoney(price.abs(), decimalPart);
  return price.gte(ZERO) ? `${formatted}` : `-${formatted}`;
};

const XAxis = /*#__PURE__*/React.memo(({
  ticks,
  color,
  width,
  decimalPart
}) => {
  const {
    xAxis: formatXAxis
  } = useSelector(formatFunctionsSelector);
  return jsxs(Container, {
    children: [jsx(Styled, {
      children: ({
        depthChart: {
          xAxis: {
            background: {
              color
            }
          }
        }
      }) => jsx(Container, Object.assign({
        y: -10
      }, {
        children: jsx(Rectangle, {
          color: color,
          width: width,
          height: 10,
          alpha: 1
        }, void 0)
      }), void 0)
    }, void 0), ticks.map(({
      label,
      x
    }, i) => jsx(XAxisLabel, {
      formatFunction: formatXAxis,
      y: 0,
      x: x,
      style: fontStyleCache(robotoMonoRegular10, color),
      text: formatPrice(toDecimal(label), decimalPart),
      width: 100,
      height: 12,
      position: 'bottom'
    }, i))]
  }, void 0);
}, deepEqual);

const Labels = /*#__PURE__*/React.memo(({
  width,
  color,
  tick,
  liner
}) => {
  const {
    yAxis: formatYAxis
  } = useSelector(formatFunctionsSelector);
  const visible = tick !== undefined;
  const props = visible ? {
    text: tick.toFixed(2),
    y: liner(tick) - 5
  } : {
    y: -1,
    text: ''
  };
  const style = fontStyleCache(robotoMonoRegular10, color);
  return jsxs(Container, Object.assign({
    visible: visible
  }, {
    children: [jsx(YAxisLabel, Object.assign({
      formatFunction: formatYAxis,
      width: 20,
      height: 10,
      x: 0,
      position: 'left',
      style: style
    }, props), void 0), jsx(YAxisLabel, Object.assign({
      formatFunction: formatYAxis,
      width: 50,
      height: 10,
      x: width,
      position: 'right',
      style: style
    }, props), void 0)]
  }), tick);
});
const YAxis = /*#__PURE__*/React.memo(({
  range: [from, to],
  height,
  width,
  color
}) => {
  const liner = React.useCallback(tick => fLiner({
    from,
    to
  }, {
    from: height,
    to: 0
  }, tick), [from, to, height]);
  const ticks = React.useMemo(() => createTicks(from, to, 7), [from, to]);
  return jsx(Fragment, {
    children: ticks.slice(0, 10).map(tick => jsx(Labels, {
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
    return SkipRenderProps;
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

class Root extends React.Component {
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
    return jsx(Styled, {
      children: ({
        depthChart: {
          plotter,
          yAxis,
          xAxis,
          background
        }
      }) => jsxs(Container, {
        children: [jsx(Background, Object.assign({
          width: width,
          height: height
        }, background), void 0), jsxs(Container, {
          children: [jsx(Container, {
            children: jsx(Plotter, Object.assign({
              polygon: buyPolygon,
              height: chartHeight
            }, plotter[L2MessageSide.buy], {
              lineWidth: plotter.lineWidth
            }), void 0)
          }, void 0), jsx(Container, {
            children: jsx(Plotter, Object.assign({
              polygon: sellPolygon,
              height: chartHeight
            }, plotter[L2MessageSide.sell], {
              lineWidth: plotter.lineWidth
            }), void 0)
          }, void 0), jsx(YAxis, {
            height: chartHeight,
            width: width,
            range: [0, maxQuantity],
            color: yAxis.label.color
          }, void 0)]
        }, void 0), jsx(Container, Object.assign({
          y: height
        }, {
          children: jsx(XAxis, {
            ticks: ticks,
            color: xAxis.label.color,
            width: width,
            decimalPart: symbol.term.decimalPart
          }, void 0)
        }), void 0), highlightPrices.buy !== null && highlightPrices.sell !== null && jsx(Highlight, {
          height: chartHeight
        }, void 0), jsx(MidPrice, {
          renderLine: true,
          xMidPrice: xMidPrice,
          xMidPriceLabel: xOriginalMidPrice
        }, void 0), jsx(ConnectedCrossHair, {}, void 0)]
      }, void 0)
    }, void 0);
  }

}

const ConnectedRoot = connectWithSkip(mapStateToProps, Root);

const awaitInitializeEpic = action$ => action$.pipe(isCreator(updateDepthChartAction), filter(({
  payload: {
    buy,
    sell
  }
}) => buy.length !== 0 || sell.length !== 0), map(() => appInitializedAction()), take(1));

const zoomEpic = (orderBook, channel, smoothness) => action$ => {
  let current = 1;
  let step = 0.1;
  return action$.pipe(isCreator(wheelAction), map(({
    payload: {
      delta
    }
  }) => delta), tap(delta => {
    current += delta > 0 ? step : -step; // current -= delta > 0 ? step : -step; todo normalized scroll direction

    current = Math.max(0.01, Math.min(1, current));
    step = current / (smoothness * 10);
    orderBook.sendActionToOrderBookWorker(channel, depthChartZoomAction(current));
  }), ignoreElements());
};

const initiatingTypes = [getType(changePositionAction), getType(depthChartZoomAction), getType(updateDepthChartAction)];
const createDepthChartEpic = (orderBook, symbol, parameters, channel, appId) => combineEpics((action$, state$) => merge(orderBook.subscribe(symbol, parameters, channel, depthChartEpicType, appId), action$.pipe(filter(({
  type
}) => initiatingTypes.includes(type)), debounce(() => interval(10)), tap(() => {
  const state = state$.value;
  const {
    sell,
    buy
  } = state.app.prices;

  if (state.input.onCanvas) {
    const [filteredBuy, filteredSell] = getFilteredPrices(buy, sell, state.app.parameters.orientation);

    if (filteredBuy.length > 0 || filteredSell.length > 0) {
      const [price, side] = getPriceByX(state);
      orderBook.sendActionToOrderBookWorker(recordHoveredAction(parameters.groupId, side, {
        price
      }));
    }
  }
}), ignoreElements()), action$.pipe(isCreator(changeOnCanvasAction), filter(action => !action.payload.onCanvas), tap(() => {
  orderBook.sendActionToOrderBookWorker(noHoveredRecordsAction(parameters.groupId));
}), ignoreElements())), awaitInitializeEpic, zoomEpic(orderBook, channel, 1));

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

  if (!orientation || orientation === EOrientations.price) {
    const [filteredBuyPrices, filteredSellPrices] = getFilteredPrices(buy, sell, orientation);

    if (filteredBuyPrices.length === 0 && filteredSellPrices.length === 0) {
      return state;
    }

    const bestBuyPrice = filteredBuyPrices.length ? filteredBuyPrices[0].price : ZERO;
    const bestSellPrice = filteredSellPrices.length ? filteredSellPrices[0].price : ZERO;
    const priceDifference = side === L2MessageSide.sell ? toDecimal(entity.price).minus(bestSellPrice) : bestBuyPrice.minus(entity.price);
    const sellPrice = bestSellPrice.add(priceDifference);
    const buyPrice = bestBuyPrice.minus(priceDifference);
    return Object.assign(Object.assign({}, state), {
      app: Object.assign(Object.assign({}, state.app), {
        highlightPrices: {
          mainSide: side,
          [L2MessageSide.sell]: sellPrice,
          [L2MessageSide.buy]: buyPrice
        }
      })
    });
  } else {
    let price1;
    const currentSide = side === L2MessageSide.buy ? buy : sell;
    const oppositeSide = side !== L2MessageSide.buy ? buy : sell;
    let minDiff = POSITIVE_INFINITY;
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
    minDiff = POSITIVE_INFINITY;

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
          [L2MessageSide.sell]: side === L2MessageSide.buy ? price1 : price2,
          [L2MessageSide.buy]: side !== L2MessageSide.buy ? price1 : price2
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
        [L2MessageSide.sell]: null,
        [L2MessageSide.buy]: null
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
  price: toDecimal(item.price),
  sum: toDecimal(item.sum)
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
      middlePrice: toDecimal(middlePrice),
      symbol: state.app.symbol
    })
  });
};

const depthChartReducer = ({
  parameters,
  formatFunctions,
  symbol
}) => createRootReducer([[updateReducer, updateDepthChartAction], [highlightPriceReducer, highlightPriceAction], [noPriceToHighlightReducer, noPriceToHighlightAction], [updateParametersReducer, updateParametersAction]], {
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

class DepthChartEmbeddableKernel extends AbstractEmbeddableKernel {
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
        yAxis: rawFormatFunctions.yAxis || noopFormatFunction,
        xAxis: rawFormatFunctions.xAxis || noopFormatFunction,
        price: rawFormatFunctions.price || noopFormatFunction,
        volume: rawFormatFunctions.volume || noopFormatFunction
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
      resources: [...commonFonts]
    }
  }
};

export { ConnectedRoot, DepthChartEmbeddableKernel, createDepthChartEpic, depthCharParameters, findClosestIndex, formatFunctionsSelector, getPriceByX, getQuantityByPrice, getXByPrice, getYByPrice, highlightPricesSelector, priceInSpread };
