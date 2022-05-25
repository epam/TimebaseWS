(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@deltix/hd.components-multi-app'), require('@deltix/logger'), require('redux-observable'), require('rxjs'), require('@deltix/hd.components-utils'), require('rxjs/operators'), require('memoize-one'), require('lodash'), require('@deltix/hd.components-common'), require('pixi.js'), require('@deltix/hd-date'), require('color-string')) :
    typeof define === 'function' && define.amd ? define(['exports', '@deltix/hd.components-multi-app', '@deltix/logger', 'redux-observable', 'rxjs', '@deltix/hd.components-utils', 'rxjs/operators', 'memoize-one', 'lodash', '@deltix/hd.components-common', 'pixi.js', '@deltix/hd-date', 'color-string'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Everchart = {}, global.hd_componentsMultiApp, global.logger, global.reduxObservable, global.rxjs, global.hd_componentsUtils, global.operators, global.memoizeOne, global.lodash, global.hd_componentsCommon, global.PIXI, global.hdDate, global.colorString));
})(this, (function (exports, hd_componentsMultiApp, logger, reduxObservable, rxjs, hd_componentsUtils, operators, memoizeOne, lodash, hd_componentsCommon, PIXI, hdDate, colorString) { 'use strict';

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

    var memoizeOne__default = /*#__PURE__*/_interopDefaultLegacy(memoizeOne);
    var PIXI__namespace = /*#__PURE__*/_interopNamespace(PIXI);
    var colorString__namespace = /*#__PURE__*/_interopNamespace(colorString);

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

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    const DEFAULT_INTERVAL_GAP = 5;
    exports.EverChartPadItem = void 0;

    (function (EverChartPadItem) {
      EverChartPadItem["LINE"] = "LINE";
      EverChartPadItem["SHAPE"] = "SHAPE";
      EverChartPadItem["LABEL"] = "LABEL";
      EverChartPadItem["INTERVAL"] = "INTERVAL";
      EverChartPadItem["VOLUME"] = "VOLUME"; // unions

      EverChartPadItem["SHAPE_WITH_LABEL"] = "SHAPE_WITH_LABEL";
      EverChartPadItem["RANGE_AREA"] = "RANGE_AREA";
    })(exports.EverChartPadItem || (exports.EverChartPadItem = {}));

    exports.EverChartIntervalType = void 0;

    (function (EverChartIntervalType) {
      EverChartIntervalType["bar"] = "bar";
      EverChartIntervalType["candle"] = "candle";
    })(exports.EverChartIntervalType || (exports.EverChartIntervalType = {}));

    exports.EverChartShapeType = void 0;

    (function (EverChartShapeType) {
      EverChartShapeType["square"] = "square";
      EverChartShapeType["circle"] = "circle";
      EverChartShapeType["triangle"] = "triangle";
      EverChartShapeType["rhombus"] = "rhombus";
      EverChartShapeType["flag"] = "flag";
      EverChartShapeType["arrow"] = "arrow";
      EverChartShapeType["cross"] = "cross";
      EverChartShapeType["crossCircle"] = "crossCircle";
    })(exports.EverChartShapeType || (exports.EverChartShapeType = {}));

    exports.EverChartLineItemDrawType = void 0;

    (function (EverChartLineItemDrawType) {
      EverChartLineItemDrawType["after"] = "after";
      EverChartLineItemDrawType["before"] = "before";
      EverChartLineItemDrawType["afterWithoutLink"] = "afterWithoutLink";
      EverChartLineItemDrawType["beforeWithoutLink"] = "beforeWithoutLink";
    })(exports.EverChartLineItemDrawType || (exports.EverChartLineItemDrawType = {}));

    exports.EverChartLineItemRenderType = void 0;

    (function (EverChartLineItemRenderType) {
      EverChartLineItemRenderType["interrupt"] = "interrupt";
    })(exports.EverChartLineItemRenderType || (exports.EverChartLineItemRenderType = {}));

    const DEFAULT_FONT_SIZE = 30;
    const getMinMax = (pad, data, startTime, endTime, height) => {
      if (!data || !data.length) {
        return {
          min: 0,
          max: 0
        };
      }

      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      let minItemAbsoluteSize = 0;
      let maxItemAbsoluteSize = 0;
      const screen = (endTime - startTime) * 0.25;

      for (const dataItem of data) {
        if (dataItem.time < startTime - screen || dataItem.time > endTime + screen) {
          continue;
        }

        for (const padItem of pad.items) {
          const {
            type
          } = padItem;

          switch (type) {
            case exports.EverChartPadItem.LINE:
              {
                let y = padItem.getY(dataItem);

                if (isFinite(y) && y != null) {
                  y = +y;

                  if (min > y) {
                    min = y;
                    minItemAbsoluteSize = 0;
                  }

                  if (max < y) {
                    max = y;
                    maxItemAbsoluteSize = 0;
                  }
                }

                break;
              }

            case exports.EverChartPadItem.LABEL:
              {
                const {
                  getY,
                  textStyle,
                  getTextStyle
                } = padItem;
                let y = getY(dataItem);
                const style = (getTextStyle === null || getTextStyle === void 0 ? void 0 : getTextStyle(dataItem)) || textStyle;
                const fontSize = (style === null || style === void 0 ? void 0 : style.fontSize) || DEFAULT_FONT_SIZE;

                if (isFinite(y) && y != null) {
                  y = +y;

                  if (min > y) {
                    min = y;
                    minItemAbsoluteSize = +fontSize / 2;
                  }

                  if (max < y) {
                    max = y;
                    maxItemAbsoluteSize = +fontSize / 2;
                  }
                }

                break;
              }

            case exports.EverChartPadItem.INTERVAL:
              {
                const {
                  getOpen,
                  getHigh,
                  getLow
                } = padItem;
                const open = getOpen(dataItem);
                let high = getHigh(dataItem);
                let low = getLow(dataItem);

                if (isFinite(high) && isFinite(low) && open != null) {
                  low = +low;
                  high = +high;

                  if (min > low) {
                    min = low;
                    minItemAbsoluteSize = 0;
                  }

                  if (max < high) {
                    max = high;
                    maxItemAbsoluteSize = 0;
                  }
                }

                break;
              }

            case exports.EverChartPadItem.SHAPE_WITH_LABEL:
            case exports.EverChartPadItem.SHAPE:
              {
                const {
                  getShapeSize,
                  getY,
                  shapeSize
                } = padItem;
                let y = getY(dataItem);
                const size = (getShapeSize === null || getShapeSize === void 0 ? void 0 : getShapeSize(dataItem)) || shapeSize;

                if (isFinite(y) && y != null) {
                  y = +y;

                  if (min > y) {
                    min = y;
                    minItemAbsoluteSize = size / 2;
                  }

                  if (max < y) {
                    max = y;
                    maxItemAbsoluteSize = size / 2;
                  }
                }

                break;
              }

            case exports.EverChartPadItem.RANGE_AREA:
              {
                let y1 = padItem.getY1(dataItem);
                let y2 = padItem.getY2(dataItem);

                if (isFinite(y1) && y1 != null) {
                  y1 = +y1;

                  if (min > y1) {
                    min = y1;
                    minItemAbsoluteSize = 0;
                  }

                  if (max < y1) {
                    max = y1;
                    maxItemAbsoluteSize = 0;
                  }
                }

                if (isFinite(y2) && y2 != null) {
                  y2 = +y2;

                  if (min > y2) {
                    min = y2;
                    minItemAbsoluteSize = 0;
                  }

                  if (max < y2) {
                    max = y2;
                    maxItemAbsoluteSize = 0;
                  }
                }

                break;
              }
          }
        }
      }

      const extremum = {
        min,
        max
      };
      const valueRatio = (max - min) / height;

      if (minItemAbsoluteSize) {
        extremum.min = min - minItemAbsoluteSize * valueRatio;
      }

      if (maxItemAbsoluteSize) {
        extremum.max = max - maxItemAbsoluteSize * valueRatio;
      }

      return extremum;
    };

    const padsToRequest = pads => {
      const obj = {};

      for (const pad of pads) {
        obj[pad.id] = pad.items.map(i => i.id);
      }

      return obj;
    };

    const cmpData = (d1, d2) => d1.time - d2.time;
    const cmpBlock = (d1, d2) => d1.to - d2.to;

    const inRange = (value, from, to) => from <= value && value <= to;

    const merge = (data1, data2) => {
      const merged = [];
      const times = new Map();
      const collision = new Set();

      for (let i = 0; i < data1.length; i++) {
        const d = data1[i];
        merged.push(d);
        times.set(d.time, i);
      }

      for (let i = 0; i < data2.length; i++) {
        const d = data2[i];

        if (collision.has(d.time)) {
          logger.namespace('everchart').warn(`Data contains collision for ${d.time}`);
        }

        if (times.has(d.time)) {
          const index = times.get(d.time);
          merged[index] = Object.assign(Object.assign({}, merged[index]), d);
        } else {
          const newIndex = merged.length;
          merged.push(d);
          times.set(d.time, newIndex);
        }

        collision.add(d.time);
      }

      return merged.sort(cmpData);
    };

    const mergeWithIndex = (data, newData, interval, index) => {
      const merged = merge(data[index].data, newData);
      data[index] = {
        data: merged,
        from: merged[0].time,
        to: merged[merged.length - 1].time,
        interval
      };
      return data;
    };

    const mergeInRange = (data, newData, interval, from, to) => {
      const t = [];

      for (let i = 0; i < data.length; i++) {
        const block = data[i];

        if (block.interval !== interval) {
          continue;
        }

        if (from < block.from && to > block.to) {
          t.push(...block.data);
          data.splice(i, 1);
          i--;
        }
      }

      const merged = merge(t, newData);
      data.push({
        data: merged,
        from: merged[0].time,
        to: merged[merged.length - 1].time,
        interval
      });
      return data.sort(cmpBlock);
    };

    const splitByTime = (data, time, include = true) => {
      let index = 0;

      while (index < data.length && (include ? data[index].time <= time : data[index].time < time)) {
        index++;
      }

      return [data.slice(0, index), data.slice(index)];
    };

    const setTo = (data, interval, i, max) => {
      for (let j = i - 1; j >= 0; j--) {
        if (data[j].interval === interval) {
          data[j].to = Math.max(data[j].to, max);
          break;
        }
      }
    };

    const setFrom = (data, interval, i, min) => {
      for (let j = i + 1; j < data.length; j++) {
        if (data[j].interval === interval) {
          data[j].from = Math.min(data[j].from, min);
          break;
        }
      }
    };

    const appendTimeSeries = (data, newData, interval, initialTime, endTime, blockSize = 500) => {
      if (!newData.length) {
        if (interval == null || initialTime == null) {
          return data;
        } // create empty range


        newData = [{
          time: initialTime
        }, {
          time: Math.round(initialTime + blockSize * interval * 0.25)
        }];
      }

      newData.sort(cmpData);
      let min = newData[0].time;
      let max = newData[newData.length - 1].time;

      if (initialTime != null && min > initialTime) {
        newData.unshift({
          time: initialTime
        });
        min = initialTime;
      }

      if (min === max) {
        if (endTime != null) {
          max = Math.max(max, endTime);
        } else {
          max = max + blockSize * interval * 0.25;
        }
      }

      if (!data.length) {
        return [{
          data: merge([], newData),
          from: min,
          to: max,
          interval
        }];
      }

      data = [...data]; // first index for merge

      let startIndex = -1; // last index for merge

      let endIndex = -1; // find blocks between

      let distance = 0;

      for (let i = 0; i < data.length; i++) {
        const block = data[i];

        if (block.interval !== interval) {
          continue;
        }

        if (inRange(min, block.from, block.to) && startIndex < 0) {
          startIndex = i;
        }

        if (inRange(max, block.from, block.to) && endIndex < 0) {
          endIndex = i;
        }

        if (min < block.from && max > block.to) {
          distance++;
        }

        if (startIndex >= 0 && endIndex >= 0) {
          break;
        }
      }

      if (startIndex < 0 && endIndex < 0) {
        //
        if (distance) {
          // merge everything
          return mergeInRange(data, newData, interval, min, max);
        } // no blocks for merge


        return [...data, {
          data: merge([], newData),
          from: min,
          to: max,
          interval
        }].sort(cmpBlock);
      }

      if (startIndex < 0 && endIndex >= 0) {
        // ... -> right]
        if (!distance) {
          return mergeWithIndex(data, newData, interval, endIndex);
        } else {
          const border = data[endIndex].from;
          const [_left, _right] = splitByTime(newData, border, false);
          data = mergeWithIndex(data, _right, interval, endIndex);
          data = mergeInRange(data, _left, interval, min, border); // fill gap

          for (let i = 0; i < data.length; i++) {
            if (data[i].from === border) {
              setTo(data, interval, i, border - 1);
              break;
            }
          }

          return data;
        }
      }

      if (startIndex >= 0 && endIndex < 0) {
        // [left -> ...
        if (!distance) {
          return mergeWithIndex(data, newData, interval, startIndex);
        } else {
          const border = data[startIndex].to;
          const [_left2, _right2] = splitByTime(newData, border);
          data = mergeWithIndex(data, _left2, interval, startIndex);
          data = mergeInRange(data, _right2, interval, border, max); // fill gap

          for (let i = 0; i < data.length; i++) {
            if (data[i].interval === interval && data[i].to === border) {
              setFrom(data, interval, i, border + 1);
              break;
            }
          }

          return data;
        }
      }

      if (startIndex === endIndex) {
        // extends existent block
        return mergeWithIndex(data, newData, interval, startIndex);
      }

      if (distance === 0) {
        // no gap
        const border = data[startIndex].to;
        const [_left3, _right3] = splitByTime(newData, border);
        data = mergeWithIndex(data, _left3, interval, startIndex);
        data = mergeWithIndex(data, _right3, interval, endIndex);
        data[endIndex].from = Math.min(data[endIndex].from, border + 1);
        return data;
      }

      const leftBorder = data[startIndex].to;
      const rightBorder = data[endIndex].from;
      const [left, t] = splitByTime(newData, leftBorder);
      const [mid, right] = splitByTime(t, rightBorder, false);
      data = mergeWithIndex(data, left, interval, startIndex);
      data = mergeWithIndex(data, right, interval, endIndex);
      data = mergeInRange(data, mid, interval, leftBorder, rightBorder); // fill gaps

      let leftIndex = -1;
      let rightIndex = -1;

      for (let i = 0; i < data.length; i++) {
        if (data[i].to === leftBorder) {
          leftIndex = i;
        }

        if (data[i].from === rightBorder) {
          rightIndex = i;
        }

        if (leftIndex >= 0 && rightIndex >= 0) {
          break;
        }
      }

      if (leftIndex >= 0) {
        setFrom(data, interval, leftIndex, leftBorder + 1);
      }

      if (rightIndex >= 0 && leftIndex !== rightIndex) {
        setTo(data, interval, rightIndex, rightBorder - 1);
      }

      return data;
    };

    const ZOOM = {
      zoom: [1, 1500, 2500, 3900, 4200, 5700, 6100, 6600, 7000, 7500, 8100],
      intervals: [1, 100, 1000, 30000, 60000, 1800000, 3600000, 14400000, 28800000, 86400000, 604800000]
    };
    /**
     * 0 - 1 1ms
     * 1500 - 100 100 ms
     * 2500 - 1000 1s
     * 3900 - 30000 30s
     * 4200 - 60000 1m
     * 5700 - 1800000 30m
     * 6100 - 3600000 1h
     * 6600 - 14400000 4h
     * 7000 - 28800000 8h
     * 7500 - 86400000 1d
     * 8100 - 604800000 1w
     */

    const fromZoom = value => {
      return Math.pow(10.0, value / 1000.0);
    };
    const toZoom = value => {
      return Math.log10(value) * 1000;
    };

    const getClosest = (table, value) => {
      for (let index = 0; index < table.length; index++) {
        if (table[index] > value) {
          return Math.max(0, index - 1);
        }
      }

      return table.length - 1;
    };

    const getClosestIntervalValue = value => ZOOM.intervals[getClosest(ZOOM.intervals, value)];
    const zoomToInterval = zoom => {
      const index = getClosest(ZOOM.zoom, toZoom(zoom));
      return ZOOM.intervals[index];
    };
    const bringingZoomToInterval = zoom => {
      const index = getClosest(ZOOM.zoom, zoom);
      return ZOOM.intervals[index];
    };
    const intervalToZoom = interval => {
      const index = getClosest(ZOOM.intervals, interval);
      return ZOOM.zoom[index];
    };

    const DEFAULT_ANIMATION_DURATION = 600;
    const createAnimationState = (init, duration, easing) => ({
      current: init,
      next: init,
      easing,
      duration,
      isRunning: false,
      startAt: Date.now()
    });

    const createEverChartInitialState = (container, position, appId) => __awaiter(void 0, void 0, void 0, function* () {
      var _a;

      const feed = container.get('feed');
      const pads = container.getParameter('pads');
      const maxBucketSize = container.getParameter('maxBucketSize');
      const minTime = container.getOptionalParameter('minTime');
      const maxTime = container.getOptionalParameter('maxTime');
      const minInterval = container.getOptionalParameter('minInterval');
      const maxInterval = container.getOptionalParameter('maxInterval');
      const disableMagnet = !!container.getOptionalParameter('disableMagnet');
      const formatFunctions = container.getOptionalParameter('formatFunctions');
      const initialZoom = toZoom(container.getOptionalParameter('initialZoom') || ZOOM.zoom[0]);
      let initialInterval = getClosestIntervalValue(container.getOptionalParameter('initialInterval') || zoomToInterval(bringingZoomToInterval(initialZoom)));
      const initialTimeParam = container.getOptionalParameter('initialTime');
      let initialTime = initialTimeParam instanceof Array ? initialTimeParam[0] : initialTimeParam;
      let zoom = initialZoom || intervalToZoom(initialInterval);
      let endTime;

      if (initialTime == null || !isFinite(initialTime)) {
        initialTime = Date.now() - initialInterval;
      } else if (initialTimeParam instanceof Array && isFinite(initialTimeParam[1]) && initialTimeParam[1] > initialTime) {
        endTime = initialTimeParam[1];

        if (maxTime != null) {
          endTime = Math.min(maxTime, endTime);
        }

        const z = (endTime - initialTime) / position.width;
        zoom = toZoom(z);
        initialInterval = zoomToInterval(z);
      }

      const initialData = yield feed.request({
        pads: padsToRequest(pads),
        interval: initialInterval,
        fromTime: initialTime,
        count: maxBucketSize
      }).toPromise();
      const animationDuration = Math.max(1, (_a = container.getOptionalParameter('animationDuration')) !== null && _a !== void 0 ? _a : DEFAULT_ANIMATION_DURATION);
      const p = {};

      for (const pad of pads) {
        const {
          min,
          max
        } = getMinMax(pad, initialData, 0, Infinity, 0);
        p[pad.id] = Object.assign(Object.assign({}, pad), {
          min: createAnimationState(min, animationDuration, 'linear'),
          max: createAnimationState(max, animationDuration, 'linear'),
          width: void 0,
          height: void 0
        });
      }

      const blocks = appendTimeSeries([], initialData, initialInterval, initialTime, null, maxBucketSize);
      let lastTime = blocks.length ? blocks[blocks.length - 1].to : initialTime;

      if (endTime != null && maxTime != null) {
        endTime = Math.min(endTime, maxTime);
      }

      if (endTime != null) {
        lastTime = Math.max(endTime, lastTime);
      }

      if (maxTime != null) {
        lastTime = Math.min(maxTime, lastTime);
      }

      return {
        appId,
        pads: p,
        data: blocks,
        scrollPosition: endTime !== null && endTime !== void 0 ? endTime : lastTime,
        params: {
          maxTime,
          minTime,
          maxBucketSize,
          minInterval,
          maxInterval,
          formatFunctions
        },
        zoom: createAnimationState(zoom, animationDuration, 'linear'),
        lastRequestedTime: initialTime,
        lastTime: lastTime !== null && lastTime !== void 0 ? lastTime : Date.now(),
        lastTimeStub: createAnimationState(0, animationDuration, 'linear'),
        disableMagnet,
        animationDuration,
        disableBackButton: !!container.getOptionalParameter('disableBackButton')
      };
    });

    const everChartNewConfigurationAction = pads => ({
      type: '@EC/NEW_CONFIGURATION',
      payload: {
        pads
      }
    });
    const everChartChangeConfigurationAction = pads => ({
      type: '@EC/CHANGE_CONFIGURATION',
      payload: {
        pads
      }
    });
    const everChartChangeViewportAction = viewport => ({
      type: '@EC/VIEWPORT',
      payload: {
        viewport
      }
    });
    const everChartDataAction = (data, interval) => {
      return {
        type: '@EC/DATA',
        payload: {
          data,
          interval
        }
      };
    };
    const everChartExtremumAction = extremums => ({
      type: '@EC/EXTREMUM',
      payload: {
        extremums
      }
    });
    const everChartRequestHistoryAction = (lastVisibleTime, end) => ({
      type: '@EC/REQUEST_HISTORY',
      payload: {
        lastVisibleTime,
        end
      }
    });
    const everChartHistoryDataAction = (data, time, interval, end) => ({
      type: '@EC/HISTORY_DATA',
      payload: {
        data,
        time,
        interval,
        end
      }
    });
    const everChartCrosshairAction = (crosshair, x, y, data) => ({
      type: '@EC/CROSSHAIR',
      payload: {
        crosshair,
        x,
        y,
        data
      }
    });
    const everChartPointerOverAction = pad => ({
      type: '@EC/POINTER_OVER',
      payload: {
        pad
      }
    });
    const everChartPointerOutAction = pad => ({
      type: '@EC/POINTER_OUT',
      payload: {
        pad
      }
    });
    const everChartPointerMoveAction = (pad, x, y) => ({
      type: '@EC/POINTER_MOVE',
      payload: {
        pad,
        x,
        y
      }
    });
    const everChartTickAction = tick => ({
      type: '@EC/TICK',
      payload: {
        tick
      }
    });
    const everChartNewIntervalAction = (interval, lastVisibleTime) => ({
      type: '@EC/INTERVAL',
      payload: {
        interval,
        lastVisibleTime
      }
    });
    const everChartZoomAction = zoom => ({
      type: '@EC/ZOOM',
      payload: {
        zoom
      }
    });
    /**
     *
     * @param scroll time from right side
     * @param animate
     * @returns
     */

    const everChartScrollToTimeAction = scroll => ({
      type: '@EC/SCROLL_TO',
      payload: {
        scroll
      }
    });
    const everChartLastTimeStubAction = (lastTimeStub, animate = true) => ({
      type: '@EC/LAST_TIME_STUB',
      payload: {
        lastTimeStub,
        animate
      }
    });
    const everChartLastTimeAction = lastTime => ({
      type: '@EC/LAST_TIME',
      payload: {
        lastTime
      }
    }); // Actions for external usages of chart's state

    const everChartChangeWindowTimeBorders = (startTime, endTime) => ({
      type: '@EC/WINDOW_TIME_BORDERS_CHANGE',
      payload: {
        startTime,
        endTime
      }
    });

    const isAnimationExpired = (props, now) => props.current === props.next || now >= props.duration + props.startAt;

    const getAnimationValue = (state, next = false) => {
      if (next) {
        return state.next;
      }

      const now = Date.now();

      if (isAnimationExpired(state, now)) {
        return state.next;
      }

      const timeDelta = (now - state.startAt) / state.duration;
      const delta = Math.min(hd_componentsMultiApp.Ease[state.easing](timeDelta), 1);
      return state.current + (state.next - state.current) * delta;
    };

    const selectEverChartPads = s => s.app.pads;
    const selectEverChartData = s => s.app.data;
    const selectEverChartCrosshair = s => s.app.crosshair;
    const selectEverChartPositionScroll = s => s.app.scrollPosition;
    const selectEverChartZoom = (s, next = true) => fromZoom(getAnimationValue(s.app.zoom, next));
    const selectEverChartMaxBucketSize = s => {
      var _a;

      return (_a = s.app.params.maxBucketSize) !== null && _a !== void 0 ? _a : 500;
    };
    const selectEverChartMinTime = s => {
      return s.app.params.minTime || 0;
    };
    const selectEverChartMinInterval = s => s.app.params.minInterval;
    const selectEverChartMaxInterval = s => s.app.params.maxInterval;
    const selectEverChartMaxTime = s => s.app.params.maxTime;
    const selectEverChartFormatFunctions = s => s.app.params.formatFunctions;
    const selectEverChartDisableMagnet = s => s.app.disableMagnet;
    const selectEverChartAnimationDuration = s => s.app.animationDuration;
    const selectEverChartDisableBackButton = s => s.app.disableBackButton;

    class CoverageTable {
      constructor(pads) {
        this.items = [];

        for (const padName in pads) {
          for (const padItem of pads[padName].items) {
            switch (padItem.type) {
              case exports.EverChartPadItem.INTERVAL:
                if (padItem.getOpen) {
                  this.items.push(padItem);
                }

                break;

              case exports.EverChartPadItem.LINE:
                if (padItem.getY) {
                  this.items.push(padItem);
                }

                break;

              case exports.EverChartPadItem.RANGE_AREA:
                if (padItem.getY1) {
                  this.items.push(padItem);
                }

                break;
            }
          }
        }
      }

      isCovered() {
        return this.items.length === 0;
      }

      updateCoverage(dataItem) {
        for (let i = 0; i < this.items.length; i++) {
          const padItem = this.items[i];
          let functionFromDataItem;

          switch (padItem.type) {
            case exports.EverChartPadItem.INTERVAL:
              functionFromDataItem = padItem.getOpen;
              break;

            case exports.EverChartPadItem.VOLUME:
            case exports.EverChartPadItem.LABEL:
            case exports.EverChartPadItem.SHAPE:
              break;

            case exports.EverChartPadItem.RANGE_AREA:
              functionFromDataItem = padItem.getY1;
              break;

            default:
              functionFromDataItem = padItem.getY;
              break;
          }

          if (functionFromDataItem == null || functionFromDataItem(dataItem) != null) {
            this.items.splice(i, 1);
            i--;
          }
        }
      }

    }

    const DEFAULT_BEHIND_WINDOW_PART = 1 / 2; // TODO: replace memoize fn

    const getSlice = memoizeOne__default["default"]((dataBuckets, scrollPosition, zoom, width, interval, lastTime, lastTimeStub, pads, maxTime, minTime) => {
      var _a, _b;

      if (lastTime <= 0) {
        // TODO: add limit
        return [];
      }

      const collision = new Set();
      let index;
      let windowEndTime = scrollPosition;

      if (maxTime != null && maxTime < windowEndTime) {
        windowEndTime = maxTime;
      }

      let windowStartTime = Math.floor(windowEndTime - width * zoom);

      if (minTime != null && minTime > windowStartTime) {
        windowStartTime = minTime;
      } // find last bucket which falls into window zone


      for (let i = dataBuckets.length - 1; i >= 0; i--) {
        if (dataBuckets[i].interval === interval && dataBuckets[i].from <= windowEndTime) {
          index = i;
          break;
        }
      }

      if (index == null) return [];
      const slice = [];

      const isInsideWindow = time => windowStartTime <= time && time <= windowEndTime;

      let rightIndex = index;
      let leftIndex = index;

      while (index >= 0) {
        if (dataBuckets[index].to < windowStartTime) break;
        leftIndex = index;

        if (dataBuckets[index].interval === interval) {
          const bucketData = dataBuckets[index].data;

          for (let i = bucketData.length - 1; i >= 0; i--) {
            if (isInsideWindow(bucketData[i].time)) {
              if (collision.has(bucketData[i].time)) {
                logger.namespace('everchart').error(`Data contains collisions for time: ${bucketData[i].time}`);
              }

              slice.push(bucketData[i]);
              collision.add(bucketData[i].time);
            }
          }
        }

        index--;
      }

      const min = (_a = slice[0]) === null || _a === void 0 ? void 0 : _a.time;
      const max = (_b = slice[slice.length - 1]) === null || _b === void 0 ? void 0 : _b.time;
      const behindWindowOffset = Math.round(width * DEFAULT_BEHIND_WINDOW_PART) * zoom; // needed to show chart *continuation*
      // **right** side of chart continuation

      const rightCoverage = new CoverageTable(pads);

      while (rightIndex < dataBuckets.length) {
        if (rightCoverage.isCovered() || dataBuckets[rightIndex].from > windowEndTime + behindWindowOffset) {
          break;
        }

        if (dataBuckets[rightIndex].interval === interval) {
          const {
            data
          } = dataBuckets[rightIndex];

          for (let i = 0; i < data.length; ++i) {
            if (rightCoverage.isCovered()) {
              break;
            }

            if (data[i].time > windowEndTime && (max == null || data[i].time > max)) {
              if (collision.has(data[i].time)) {
                logger.namespace('everchart').error(`Data contains collisions for time: ${data[i].time}`);
              }

              slice.push(data[i]);
              rightCoverage.updateCoverage(data[i]);
              collision.add(data[i].time);
            }
          }
        }

        rightIndex++;
      } // **left** side of chart continuation


      const leftCoverage = new CoverageTable(pads);

      while (leftIndex >= 0) {
        if (leftCoverage.isCovered() || dataBuckets[leftIndex].to < windowStartTime - behindWindowOffset) {
          break;
        }

        if (dataBuckets[leftIndex].interval === interval) {
          const {
            data
          } = dataBuckets[leftIndex];

          for (let i = data.length - 1; i >= 0; --i) {
            if (leftCoverage.isCovered()) break;

            if (data[i].time < windowStartTime && (min == null || min > data[i].time)) {
              if (collision.has(data[i].time)) {
                logger.namespace('everchart').error(`Data contains collisions for time: ${data[i].time}`);
              }

              slice.push(data[i]);
              leftCoverage.updateCoverage(data[i]);
              collision.add(data[i].time);
            }
          }
        }

        leftIndex--;
      }

      return slice.sort(cmpData);
    });
    const selectEverChartDataSlice = (s, next = true) => {
      const data = selectEverChartData(s);
      const scroll = selectEverChartPositionScroll(s);
      const zoom = selectEverChartZoom(s, next);
      const width = hd_componentsMultiApp.widthSelector(s);
      const pads = selectEverChartPads(s);
      const interval = zoomToInterval(zoom);
      const last = selectEverChartLastTime(s);
      const lastTimeStub = selectEverChartLastTimeStub(s, next);
      const max = selectEverChartMaxTime(s);
      const min = selectEverChartMinTime(s);
      return getSlice(data, scroll, zoom, width, interval, last, lastTimeStub, pads, max, min);
    };
    /** returns time */

    const selectEverChartLastTimeStub = (s, next = false) => getAnimationValue(s.app.lastTimeStub, next);
    const selectEverChartLastTime = s => s.app.lastTime;

    const DEFAULT_REQUEST_BEHIND_WINDOW_PART = 1 / 2;
    const afterDataChangedEpic = (action$, state$) => {
      let prevBorder = [-1, -1];
      return action$.pipe(hd_componentsUtils.isCreator(everChartDataAction, everChartZoomAction, everChartScrollToTimeAction, everChartLastTimeStubAction, everChartHistoryDataAction, everChartChangeViewportAction), operators.startWith({}), operators.auditTime(200), operators.mergeMap(() => {
        const pads = selectEverChartPads(state$.value);
        const newExtremum = {};
        const slice = selectEverChartDataSlice(state$.value);
        const scrollPosition = selectEverChartPositionScroll(state$.value);
        const dataBlocks = selectEverChartData(state$.value);
        const zoom = selectEverChartZoom(state$.value, true); // const lastTimeStub = selectEverChartLastTimeStub(state$.value, true);

        const width = hd_componentsMultiApp.widthSelector(state$.value);
        const interval = zoomToInterval(zoom);
        const endTime = scrollPosition;
        const startTime = Math.floor(endTime - width * zoom);
        let hasChanges = false;

        for (const id in pads) {
          const extremum = getMinMax(pads[id], slice, startTime, endTime, pads[id].height);

          if (isFinite(extremum.min) && isFinite(extremum.max) && (pads[id].min.next !== extremum.min || pads[id].max.next !== extremum.max)) {
            if (extremum.min === extremum.max) {
              extremum.min--;
              extremum.max++;
            } // infinity in case no data


            newExtremum[id] = extremum;
            hasChanges = true;
          }
        }

        const actions = [];
        let index;

        for (let i = dataBlocks.length - 1; i >= 0; i--) {
          if (dataBlocks[i].interval !== interval) {
            continue;
          }

          if (dataBlocks[i].to < startTime) {
            break;
          }

          if (dataBlocks[i].from <= endTime) {
            index = i;
            break;
          }
        }

        if (index == null) {
          actions.push(everChartRequestHistoryAction(startTime));
        }

        if (dataBlocks.length && index === dataBlocks.length - 1 && dataBlocks[index].to < endTime) {
          actions.push(everChartRequestHistoryAction(Math.max(dataBlocks[index].to, startTime)));
        }

        let prev;
        const buffer = [];

        for (let i = index; i >= 0; i--) {
          if (dataBlocks[i].interval !== interval) {
            continue;
          }

          if (dataBlocks[i].to < startTime) {
            break;
          }

          buffer.unshift(dataBlocks[i]);
        }

        for (let i = 0; i < buffer.length; i++) {
          if (prev == null && buffer[i].from > startTime) {
            actions.push(everChartRequestHistoryAction(startTime, buffer[i].from));
            break;
          }

          if (prev != null && buffer[i].from - prev > 1) {
            actions.push(everChartRequestHistoryAction(prev, buffer[i].from));
            break;
          }

          prev = buffer[i].to;
        }

        const first = dataBlocks.find(block => block.interval === interval);

        if (!first || first.from > startTime) {
          // TODO: replace with relative frequency points in interval
          const requestTime = Math.round(startTime - width * zoom * DEFAULT_REQUEST_BEHIND_WINDOW_PART);
          actions.unshift(everChartRequestHistoryAction(requestTime));
        }

        if (hasChanges) {
          actions.push(everChartExtremumAction(newExtremum));
        }

        if (prevBorder[0] !== startTime || prevBorder[1] !== endTime) {
          actions.push(everChartChangeWindowTimeBorders(startTime, endTime));
          prevBorder = [startTime, endTime];
        }

        return actions.length ? actions : rxjs.EMPTY;
      }));
    };

    const animationEpic = (action$, state$) => action$.pipe(hd_componentsUtils.isCreator(hd_componentsMultiApp.wheelAction, everChartExtremumAction), operators.switchMap(() => {
      const end$ = rxjs.from(hd_componentsUtils.delay(selectEverChartAnimationDuration(state$.value)));
      return rxjs.interval(10).pipe(operators.takeUntil(end$), operators.map(() => everChartTickAction(Date.now())));
    }));

    const changeConfigurationEverChartEpic = (action$, state$) => action$.pipe(hd_componentsUtils.isCreator(everChartNewConfigurationAction), operators.switchMap(({
      payload: {
        pads
      }
    }) => {
      // const lastTimeStub = selectEverChartLastTimeStub(state$.value, true);
      const scrollPosition = selectEverChartPositionScroll(state$.value);
      const zoom = selectEverChartZoom(state$.value, true);
      const width = hd_componentsMultiApp.widthSelector(state$.value); // const lastTime = selectEverChartLastTime(state$.value);

      const startTime = Math.floor(scrollPosition - width * zoom);
      return [everChartChangeConfigurationAction(pads), everChartRequestHistoryAction(startTime)];
    }));

    const everChartZoomEpic = (action$, state$) => action$.pipe(hd_componentsUtils.isCreator(hd_componentsMultiApp.wheelAction), operators.mergeMap(({
      payload: {
        delta,
        x
      }
    }) => {
      const zoomValue = selectEverChartZoom(state$.value, true); // const lastTimeStub = selectEverChartLastTimeStub(state$.value, true);
      // const lastTime = selectEverChartLastTime(state$.value);

      const width = hd_componentsMultiApp.widthSelector(state$.value);
      const scrollPosition = selectEverChartPositionScroll(state$.value); // const minTime = selectEverChartMinTime(state$.value);

      const minInterval = selectEverChartMinInterval(state$.value);
      const maxInterval = selectEverChartMaxInterval(state$.value);
      const minTime = selectEverChartMinTime(state$.value);
      const maxTime = selectEverChartMaxTime(state$.value);
      const interval = zoomToInterval(zoomValue);
      const minZoom = minInterval ? intervalToZoom(minInterval) : ZOOM.zoom[0];
      let maxZoom = maxInterval ? intervalToZoom(maxInterval) : ZOOM.zoom[ZOOM.zoom.length - 1];

      if (minTime != null && maxTime != null) {
        const mz = (maxTime - minTime) / width;
        maxZoom = Math.min(maxZoom, toZoom(mz));
      }

      const z = toZoom(zoomValue) + delta;
      const zoom = Math.min(Math.max(z, minZoom), maxZoom);
      const newZoom = fromZoom(zoom);

      if (newZoom === zoomValue) {
        return rxjs.EMPTY;
      }

      const newInterval = zoomToInterval(fromZoom(zoom));
      const right = width - x;
      const xTime = scrollPosition - right * zoomValue;
      const newScrollPosition = xTime + right * newZoom; // console.log({
      //   xTime: new Date(xTime).toISOString(),
      //   newXTime: new Date(newScrollPosition - right * newZoom).toISOString(),
      //   diff: xTime - (newScrollPosition - right * newZoom)
      // })

      const actions = [];

      if (newScrollPosition !== scrollPosition) {
        actions.push(everChartScrollToTimeAction(newScrollPosition));
      }

      if (interval !== newInterval) {
        actions.push(everChartNewIntervalAction(newInterval, Math.floor(scrollPosition - width * newZoom)));
      }

      actions.push(everChartZoomAction(zoom));
      return actions;
    }));

    class PriorityBuffer {
      constructor() {
        this.cache = new Map();
      }

      clear() {
        this.cache.clear();
      }

      has(time) {
        return this.cache.has(time);
      }

      push(time, extra) {
        if (this.has(time)) {
          return false;
        }

        this.cache.set(time, extra);
        return true;
      }

      pop(target) {
        let index = 0;
        let delta = Infinity;
        const buf = Array.from(this.cache.keys());

        for (let i = 0; i < buf.length; i++) {
          const diff = Math.abs(target - buf[i]);

          if (diff <= delta) {
            delta = diff;
            index = i;
          }
        }

        const value = buf[index];
        const extra = this.cache.get(value);
        this.cache.delete(value);
        return [value, extra];
      }

    }

    const historyEverChartEpic = feed => {
      const cache = new Set();
      let lastInterval;
      const buffer = new PriorityBuffer();
      return (action$, state$) => action$.pipe(hd_componentsUtils.isCreator(everChartRequestHistoryAction, everChartNewIntervalAction), operators.filter(({
        payload: {
          lastVisibleTime,
          end
        }
      }) => {
        return !buffer.has(lastVisibleTime) && !cache.has(lastVisibleTime);
      }), operators.map(({
        payload: {
          end,
          lastVisibleTime
        }
      }) => {
        buffer.push(lastVisibleTime, end);
        return lastVisibleTime;
      }), operators.concatMap(t => {
        const interval = zoomToInterval(selectEverChartZoom(state$.value, true));
        const scrollPosition = selectEverChartPositionScroll(state$.value);
        const zoom = selectEverChartZoom(state$.value, true); // const lastTime = selectEverChartLastTime(state$.value);
        // const lastTimeStub = selectEverChartLastTimeStub(state$.value, true);

        const width = hd_componentsMultiApp.widthSelector(state$.value);
        const endTime = scrollPosition;
        const startTime = Math.floor(endTime - width * zoom);
        const offset = Math.round(width / 2 * zoom);
        const [time, end] = buffer.pop(startTime);

        if (time == null) {
          return rxjs.EMPTY;
        }

        if (lastInterval !== interval) {
          lastInterval = interval;
          cache.clear();
          buffer.clear();
        } else if (cache.has(time)) {
          return rxjs.EMPTY;
        }

        if (time < startTime - offset || time > endTime + offset) {
          return rxjs.EMPTY;
        }

        const data = selectEverChartData(state$.value);

        if (data.find(block => block.from <= time && block.to > time && block.interval === interval)) {
          return rxjs.EMPTY;
        }

        return feed.request({
          pads: padsToRequest(Object.values(selectEverChartPads(state$.value))),
          fromTime: time,
          interval,
          count: selectEverChartMaxBucketSize(state$.value),
          toTime: end
        }).pipe(operators.mergeMap(data => rxjs.of(everChartHistoryDataAction(data, time, interval, end))));
      }), operators.finalize(() => {
        buffer.clear();
        cache.clear();
        lastInterval = void 0;
      }));
    };

    const getYOffset = height => height * 0.1 / 2;

    const getYCoordinate = (value, height, min, max) => {
      const yOffset = getYOffset(height);
      return hd_componentsMultiApp.fLiner({
        from: min,
        to: max
      }, {
        from: height - yOffset,
        to: yOffset
      }, value);
    };
    const getFromYCoordinate = (y, height, min, max) => {
      const yOffset = getYOffset(height);
      const rangeFrom = yOffset;
      const rangeTo = height - yOffset;
      const rise = rangeFrom - rangeTo;
      const run = max - min;

      if (rise === 0 || run === 0) {
        return 0;
      }

      const slope = rise / run;
      const intercept = rangeFrom - slope * max;
      return (y - intercept) / slope;
    };

    const isForward = (polyLine1, polyLine2) => {
      if (!polyLine1.length || !polyLine2.length) {
        return true;
      }

      if (polyLine1.length >= polyLine2.length) {
        const mid = Math.floor(polyLine2.length / 2);
        const point = polyLine2[mid];
        let max = -Infinity;

        for (let i = 0; i < polyLine1.length; i++) {
          if (polyLine1[i][0] === point[0]) {
            max = Math.max(0, polyLine1[i][1]);
          }
        }

        return point[1] > max;
      } else {
        const mid = Math.floor(polyLine1.length / 2);
        const point = polyLine1[mid];
        let max = -Infinity;

        for (let i = 0; i < polyLine2.length; i++) {
          if (polyLine2[i][0] === point[0]) {
            max = Math.max(0, polyLine2[i][1]);
          }
        }

        return point[1] < max;
      }
    };

    const isIntersects = (firstStart, firstEnd, secondStart, secondEnd) => {
      const [x1, y1] = firstStart;
      const [x2, y2] = firstEnd;
      const [x3, y3] = secondStart;
      const [x4, y4] = secondEnd; // Check if none of the lines are of length 0

      if (x1 === x2 && y1 === y2 || x3 === x4 && y3 === y4) {
        return null;
      }

      const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1); // Lines are parallel

      if (denominator === 0) {
        return null;
      }

      const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
      const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator; // is the intersection along the segments

      if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return null;
      } // Return a object with the x and y coordinates of the intersection


      const x = x1 + ua * (x2 - x1);
      const y = y1 + ua * (y2 - y1);
      return [x, y];
    };

    const getAnimationValueFromPad = prop => (s, pad, next = false) => {
      const value = s.app.pads[pad.id];
      return value ? getAnimationValue(value[prop], next) : 0;
    };

    const selectEverChartMin = getAnimationValueFromPad('min');
    const selectEverChartMaxInternal = getAnimationValueFromPad('max');
    const selectEverChartMax = (s, pad, next = false) => {
      const max = selectEverChartMaxInternal(s, pad, next);
      const min = selectEverChartMin(s, pad, next);
      return max === min ? max + 0.1 : max;
    };
    const selectEverChartHeight = (s, pad) => {
      var _a, _b;

      return (_b = (_a = s.app.pads[pad.id]) === null || _a === void 0 ? void 0 : _a.height) !== null && _b !== void 0 ? _b : 1;
    };
    const selectEverChartPoly = (state, pad, padItem) => {
      const slice = selectEverChartDataSlice(state);
      const min = selectEverChartMin(state, pad);
      const max = selectEverChartMax(state, pad);
      const zoom = selectEverChartZoom(state);
      const width = hd_componentsMultiApp.widthSelector(state);
      const height = selectEverChartHeight(state, pad);
      const scrollPosition = selectEverChartPositionScroll(state);

      if (!slice.length) {
        return [];
      }

      const lines = [[]];
      let lastXY = null;

      for (let i = slice.length - 1; i >= 0; i--) {
        const item = padItem;
        const itemY = item.getY(slice[i]);
        const {
          drawType,
          renderType
        } = item;

        if (itemY == null) {
          if (renderType === exports.EverChartLineItemRenderType.interrupt) {
            lastXY = null;
            if (lines[0].length !== 0 && !drawType) lines.unshift([]);
          }

          continue;
        }

        const x = width - (scrollPosition - slice[i].time) / zoom;
        const y = getYCoordinate(itemY, height, min, max);

        if (!drawType) {
          lines[0].unshift({
            x,
            y
          });
          continue;
        }

        if (lastXY) {
          switch (drawType) {
            case exports.EverChartLineItemDrawType.after:
              {
                if (renderType === exports.EverChartLineItemRenderType.interrupt) {
                  lines.unshift([Object.assign({}, lastXY), {
                    x,
                    y: lastXY.y
                  }]);
                } else {
                  if (lastXY.x !== x && lastXY.y !== y) {
                    lines[0].unshift({
                      x,
                      y: lastXY.y
                    });
                  }

                  lines[0].unshift({
                    x,
                    y
                  });
                }

                break;
              }

            case exports.EverChartLineItemDrawType.afterWithoutLink:
              {
                lines.unshift([Object.assign({}, lastXY), {
                  x,
                  y: lastXY.y
                }]);
                break;
              }

            case exports.EverChartLineItemDrawType.before:
              {
                if (renderType === exports.EverChartLineItemRenderType.interrupt) {
                  lines.unshift([{
                    x: lastXY.x,
                    y
                  }, {
                    x,
                    y
                  }]);
                } else {
                  if (lastXY.x !== x && lastXY.y !== y) {
                    lines[0].unshift({
                      x: lastXY.x,
                      y
                    });
                  }

                  lines[0].unshift({
                    x,
                    y
                  });
                }

                break;
              }

            case exports.EverChartLineItemDrawType.beforeWithoutLink:
              {
                lines.unshift([{
                  x: lastXY.x,
                  y
                }, {
                  x,
                  y
                }]);
                break;
              }
          }
        }

        lastXY = {
          x,
          y
        };
      }

      return lines;
    };

    const flat = (polyLine1, polyLine2) => lodash.flatten(polyLine1.concat(polyLine2));

    const findAllIntersections = (polyLine1, polyLine2) => {
      if (polyLine1.length <= 1 || polyLine2.length <= 1) {
        return [];
      }

      const intersections = [];

      for (let i = 1; i < polyLine1.length; i++) {
        for (let j = 1; j < polyLine2.length; j++) {
          const intersection = isIntersects(polyLine1[i - 1], polyLine1[i], polyLine2[j - 1], polyLine2[j]);

          if (intersection) {
            intersections.push(intersection);
          }
        }
      }

      return intersections;
    };

    const selectEverChartRangeAreaPoly = (state, pad, padItem) => {
      const slice = selectEverChartDataSlice(state);
      const min = selectEverChartMin(state, pad);
      const max = selectEverChartMax(state, pad);
      const zoom = selectEverChartZoom(state);
      const width = hd_componentsMultiApp.widthSelector(state);
      const height = selectEverChartHeight(state, pad);
      const scrollPosition = selectEverChartPositionScroll(state);

      if (!slice.length) {
        return [];
      }

      let prevPoint1 = null;
      let prevPoint2 = null;
      const polyLine1 = [];
      const polyLine2 = [];
      const {
        getY1,
        getY2,
        drawType1,
        drawType2
      } = padItem;

      for (let _i = slice.length - 1; _i >= 0; _i--) {
        const itemY1 = getY1(slice[_i]);
        const itemY2 = getY2(slice[_i]);
        const x = width - (scrollPosition - slice[_i].time) / zoom;
        let point1;
        let point2;

        if (itemY1 != null) {
          const y = getYCoordinate(itemY1, height, min, max);
          point1 = [x, y];

          switch (drawType1) {
            case exports.EverChartLineItemDrawType.after:
              {
                if (prevPoint1 && prevPoint1[0] !== x && prevPoint1[1] !== y) {
                  polyLine1.unshift([x, prevPoint1[1]]);
                }

                polyLine1.unshift(point1);
                break;
              }

            case exports.EverChartLineItemDrawType.before:
              {
                if (prevPoint1 && prevPoint1[0] !== x && prevPoint1[1] !== y) {
                  polyLine1.unshift([prevPoint1[0], y]);
                }

                polyLine1.unshift(point1);
                break;
              }

            default:
              polyLine1.unshift(point1);
              break;
          }

          prevPoint1 = point1;
        }

        if (itemY2 != null) {
          const y = getYCoordinate(itemY2, height, min, max);
          point2 = [x, y];

          switch (drawType2) {
            case exports.EverChartLineItemDrawType.after:
              {
                if (prevPoint2 && prevPoint2[0] !== x && prevPoint2[1] !== y) {
                  polyLine2.unshift([x, prevPoint2[1]]);
                }

                polyLine2.unshift(point2);
                break;
              }

            case exports.EverChartLineItemDrawType.before:
              {
                if (prevPoint2 && prevPoint2[0] !== x && prevPoint2[1] !== y) {
                  polyLine2.unshift([prevPoint2[0], y]);
                }

                polyLine2.unshift(point2);
                break;
              }

            default:
              polyLine2.unshift(point2);
              break;
          }

          prevPoint2 = point2;
        }
      }

      const intersections = findAllIntersections(polyLine1, polyLine2);

      if (!intersections.length) {
        const f = isForward(polyLine1, polyLine2);
        const data = flat(polyLine1, polyLine2.reverse());
        return [{
          points: data,
          isForward: f
        }];
      }

      prevPoint1 = null;

      for (let _i2 = 0; _i2 < intersections.length; _i2++) {
        if (prevPoint1) {
          if (prevPoint1[0] === intersections[_i2][0] && prevPoint1[1] === intersections[_i2][1]) {
            intersections.splice(_i2, 1);
            _i2--;
          }
        }

        prevPoint1 = intersections[_i2];
      }

      const polyLines = [];
      let poly1 = [];
      let poly2 = [];
      let i = 0;
      let j = 0;

      for (let k = 0; i < polyLine1.length; i++) {
        const [x] = polyLine1[i];
        const [cx] = intersections[k] || [Infinity];

        if (x < cx) {
          poly1.push(polyLine1[i]);
        } else if (x === cx) {
          poly1.push(polyLine1[i]);

          for (; j < polyLine2.length; j++) {
            poly2.unshift(polyLine2[j]);

            if (polyLine2[j][0] >= cx) {
              break;
            }
          }

          const f = isForward(poly1, poly2);
          poly2.unshift(intersections[k]);
          polyLines.push({
            isForward: f,
            points: flat(poly1, poly2)
          });
          poly1 = [];
          poly2 = [intersections[k]];
          i--;
          k++;
        } else if (x >= cx && cx !== Infinity) {
          for (; j < polyLine2.length; j++) {
            if (polyLine2[j][0] >= cx) {
              break;
            }

            poly2.unshift(polyLine2[j]);
          }

          const f = isForward(poly1, poly2);
          poly2.unshift(intersections[k]);
          polyLines.push({
            isForward: f,
            points: flat(poly1, poly2)
          });
          poly1 = [intersections[k]];
          poly2 = [intersections[k]];
          k++;
          i--;
        }
      }

      if (j !== polyLine2.length - 1) {
        for (; j < polyLine2.length; j++) {
          poly2.unshift(polyLine2[j]);
        }

        polyLines.push({
          isForward: isForward(poly1, poly2),
          points: flat(poly1, poly2)
        });
      }

      return polyLines;
    };

    const DEFAULT_MAGNET_LIMIT = 50;

    const getDistance = (padState, data, time, minDistance) => {
      let newDist = minDistance;

      for (const padItem of padState.items) {
        if (padItem.type === exports.EverChartPadItem.INTERVAL) {
          const item = padItem;
          const intervalWidth = item.getIntervalWidth(data);

          if (intervalWidth != null) {
            const half = intervalWidth / 2;

            if (data.time - half <= time && time <= data.time + half) {
              const dist = Math.abs(data.time - time);

              if (newDist > dist) {
                newDist = dist;
              }
            }
          }
        } else {
          const dist = Math.abs(data.time - time);

          if (newDist > dist) {
            newDist = dist;
          }
        }
      }

      return newDist !== minDistance ? newDist : null;
    };

    const mouseMoveEverChartEpic = (action$, state$) => action$.pipe(hd_componentsUtils.isCreator(everChartPointerOverAction), operators.switchMap(({
      payload: {
        pad
      }
    }) => action$.pipe(hd_componentsUtils.isCreator(everChartPointerMoveAction), operators.takeUntil(action$.pipe(hd_componentsUtils.isCreator(everChartPointerOutAction))), operators.filter(({
      payload: {
        pad: movePad
      }
    }) => pad === movePad), operators.switchMap(({
      payload: {
        pad,
        x,
        y
      }
    }) => {
      return rxjs.of(null).pipe(operators.repeatWhen(() => action$.pipe(hd_componentsUtils.isCreator(everChartDataAction, everChartHistoryDataAction, everChartZoomAction, everChartExtremumAction, everChartScrollToTimeAction, hd_componentsMultiApp.dragMoveAction))), operators.filter(() => !!selectEverChartPads(state$.value)[pad]), operators.exhaustMap(() => {
        const slice = selectEverChartDataSlice(state$.value, true);
        const zoom = selectEverChartZoom(state$.value, true);
        const scrollPosition = selectEverChartPositionScroll(state$.value);
        const width = hd_componentsMultiApp.widthSelector(state$.value);
        const lastTimeStub = selectEverChartLastTimeStub(state$.value, true);
        const disableMagnet = selectEverChartDisableMagnet(state$.value); // const lastTime =
        //   selectEverChartLastTime(state$.value) + lastTimeStub;

        let index;
        let minDistance = Number.POSITIVE_INFINITY;
        const startOffset = scrollPosition;
        const time = startOffset - (width - x) * zoom;
        const padState = selectEverChartPads(state$.value)[pad];

        if (!disableMagnet && slice.length) {
          // magnet by x
          let from = 0;
          let to = slice.length - 1;
          minDistance = Number.POSITIVE_INFINITY;

          do {
            const mid = Math.floor(from + (to - from) / 2);

            if (mid === 0) {
              break;
            }

            const dataTime = slice[mid].time;

            if (dataTime === time) {
              index = mid;
              break;
            }

            if (dataTime > time) {
              to = mid;
            } else {
              from = mid;
            }

            const newDist = getDistance(padState, slice[mid], time, minDistance);

            if (newDist != null) {
              minDistance = newDist;
              index = mid;
            }
          } while (to > 0 && to - from > 1);
        }

        const height = selectEverChartHeight(state$.value, padState);
        const hMax = selectEverChartMax(state$.value, padState, true);
        const hMin = selectEverChartMin(state$.value, padState, true);
        const revertedValue = getFromYCoordinate(y, height, hMin, hMax);
        let value;
        let dataItem;
        let magnetItem;

        if (index != null) {
          minDistance = Number.POSITIVE_INFINITY;

          for (const item of padState.items) {
            // magnet by y
            const points = [];

            if ('getY' in item) {
              points.push(item.getY(slice[index]));
            } else if (item.type === exports.EverChartPadItem.INTERVAL) {
              points.push(item.getOpen(slice[index]));
              points.push(item.getClose(slice[index]));
              points.push(item.getHigh(slice[index]));
              points.push(item.getLow(slice[index]));
            } else if (item.type === exports.EverChartPadItem.RANGE_AREA) {
              points.push(item.getY1(slice[index]));
              points.push(item.getY2(slice[index]));
            }

            for (const v of points) {
              if (v == null) continue;
              const dist = Math.abs(v - revertedValue);
              const pointY = getYCoordinate(v, height, hMin, hMax); // in interval charts we always leave crosshair free by y

              if (minDistance > dist && (Math.abs(pointY - y) <= DEFAULT_MAGNET_LIMIT || item.type === exports.EverChartPadItem.INTERVAL)) {
                value = v;
                magnetItem = item;
                minDistance = dist;
                dataItem = slice[index];
              }
            }
          }
        }

        if (value == null || magnetItem.type === exports.EverChartPadItem.INTERVAL) {
          value = revertedValue;
        }

        let crossHairTime = 0;
        const crosshairTooRight = lastTimeStub && index === slice.length - 1 && slice[index].time < time;
        const crosshairTooLeft = index === 0 && slice[index].time > time;

        if (index == null || crosshairTooRight || crosshairTooLeft || magnetItem == null) {
          crossHairTime = time;
          value = revertedValue;
        } else {
          crossHairTime = slice[index].time;
        }

        return rxjs.of(everChartCrosshairAction({
          pad,
          time: crossHairTime,
          value
        }, x, y, dataItem));
      }));
    }))));

    const scrollEverChartEpic = (action$, state$) => action$.pipe(hd_componentsUtils.isCreator(hd_componentsMultiApp.dragMoveAction), // filter(({ payload: { delta } }) => delta !== 0),
    operators.mergeMap(({
      payload: {
        delta
      }
    }) => {
      const actions = [];
      let scrollPosition = selectEverChartPositionScroll(state$.value); // const lastTimeStub = selectEverChartLastTimeStub(state$.value, true);

      const zoom = selectEverChartZoom(state$.value, true); // const width = widthSelector(state$.value);

      scrollPosition -= delta * zoom;
      actions.push(everChartScrollToTimeAction(scrollPosition));
      return rxjs.of(...actions);
    }));

    const subscribeEverChartEpic = feed => (action$, state$) => action$.pipe(hd_componentsUtils.isCreator(everChartNewIntervalAction, everChartChangeConfigurationAction), operators.startWith({
      payload: {}
    }), operators.switchMap(({
      payload
    }) => {
      const interval = payload['interval'] || zoomToInterval(selectEverChartZoom(state$.value, true));
      return feed.subscribe({
        pads: padsToRequest(Object.values(selectEverChartPads(state$.value))),
        interval
      }).pipe(operators.map(data => everChartDataAction(data, interval)));
    }));

    const fromPerToNumber = per => +per.replace('%', '') / 100;

    const getPadsAccomodationParams = (pads, height, width) => {
      let rest = height;
      let notAssignedInitialHeight = pads.length;
      const accParams = {};

      for (const pad of pads) {
        if (pad.initialHeight) {
          accParams[pad.id] = {
            width,
            height: height * fromPerToNumber(pad.initialHeight)
          };
          notAssignedInitialHeight--;
          rest -= height * fromPerToNumber(pad.initialHeight);
        }
      }

      for (const pad of pads) {
        if (!pad.initialHeight) {
          accParams[pad.id] = {
            width,
            height: rest / notAssignedInitialHeight
          };
        }
      }

      return accParams;
    };

    const updateViewportEpic = (action$, state$) => rxjs.merge(action$.pipe(hd_componentsUtils.isCreator(hd_componentsMultiApp.updateViewportAction, hd_componentsMultiApp.multiAppUpdateViewportAction), operators.map(({
      payload
    }) => payload)), state$.pipe(operators.map(hd_componentsMultiApp.viewportSelector), operators.filter(t => !!t), operators.take(1))).pipe(operators.mergeMap(({
      height,
      width
    }) => {
      const pads = selectEverChartPads(state$.value);
      const padsArray = Object.values(pads);
      return rxjs.of(everChartChangeViewportAction(getPadsAccomodationParams(padsArray, height, width)));
    }));

    const createEverChartEpic = container => reduxObservable.combineEpics(updateViewportEpic, subscribeEverChartEpic(container.get('feed')), afterDataChangedEpic, historyEverChartEpic(container.get('feed')), mouseMoveEverChartEpic, animationEpic, everChartZoomEpic, scrollEverChartEpic, changeConfigurationEverChartEpic, // scrollToEverChartEpic,
    () => rxjs.of(hd_componentsMultiApp.appInitializedAction()));

    const applyState = (state, update) => Object.assign(Object.assign({}, state), {
      app: Object.assign(Object.assign({}, state.app), update)
    });

    const everChartChangeConfigurationReducer = (state, {
      payload: {
        pads
      }
    }) => {
      const width = hd_componentsMultiApp.widthSelector(state);
      const height = hd_componentsMultiApp.heightSelector(state);
      const p = getPadsAccomodationParams(pads, height, width);
      const duration = selectEverChartAnimationDuration(state);

      for (const pad of pads) {
        p[pad.id] = Object.assign(Object.assign(Object.assign({}, p[pad.id]), pad), {
          min: createAnimationState(0, duration, 'linear'),
          max: createAnimationState(0, duration, 'linear')
        });
      }

      return applyState(state, {
        pads: p,
        data: []
      });
    };

    const everChartChangeViewportReducer = (state, {
      payload: {
        viewport
      }
    }) => {
      const pads = Object.assign({}, state.app.pads);

      for (const id in viewport) {
        const pad = pads[id];

        if (!pad) {
          continue;
        }

        pads[id] = Object.assign(Object.assign({}, pads[id]), viewport[id]);
      }

      return applyState(state, {
        pads
      });
    };

    const everChartCleanReducer = (state, {
      payload: {
        interval
      }
    }) => {
      return applyState(state, {
        data: state.app.data.filter(item => item.interval === interval)
      });
    };

    const everChartCrosshairReducer = (state, {
      payload: {
        crosshair
      }
    }) => {
      return applyState(state, {
        crosshair
      });
    };

    const everChartCrosshairResetReducer = (state, _) => {
      return applyState(state, {
        crosshair: null
      });
    };

    const correctingBucketSize = (data, maxBucketSize) => {
      const lastBucket = data[data.length - 1];

      if (lastBucket.data.length <= maxBucketSize) {
        return data;
      }

      const newBucketData = [];

      while (lastBucket.data.length > maxBucketSize) {
        newBucketData.push(lastBucket.data[lastBucket.data.length - 1]);
        lastBucket.data.pop();
      }

      lastBucket.to = lastBucket.data[lastBucket.data.length - 1].time;
      const newBucket = {
        data: newBucketData.reverse(),
        from: newBucketData[0].time,
        to: newBucketData[newBucketData.length - 1].time,
        interval: lastBucket.interval
      };
      data.push(newBucket);
      return data;
    };

    const everChartDataReducer = (state, {
      payload: {
        data,
        interval
      }
    }) => {
      if (!data.length) {
        return state;
      }

      const maxBucketSize = selectEverChartMaxBucketSize(state);
      const currentData = appendTimeSeries(selectEverChartData(state), data, interval, null, null, maxBucketSize);
      let newLastTime;

      for (let i = currentData.length - 1; i >= 0; i--) {
        if (currentData[i].interval === interval) {
          newLastTime = currentData[i].to;
          break;
        }
      }

      let scrollPosition = selectEverChartPositionScroll(state);
      const lastTime = selectEverChartLastTime(state);
      const maxTime = selectEverChartMaxTime(state);

      if (lastTime === scrollPosition) {
        if (newLastTime !== null) {
          scrollPosition = newLastTime;

          if (maxTime != null && maxTime < scrollPosition) {
            scrollPosition = maxTime;
          }
        }
      }

      if (newLastTime == null) {
        newLastTime = lastTime;
      }

      const correctedData = correctingBucketSize(currentData, maxBucketSize);
      return applyState(state, {
        data: correctedData,
        scrollPosition,
        lastTime: maxTime != null ? Math.min(maxTime, newLastTime) : newLastTime
      });
    };

    const setAnimationValue = (state, next, animate = true) => {
      return Object.assign(Object.assign({}, state), {
        next,
        current: !animate ? next : getAnimationValue(state),
        isRunning: true,
        dirty: true,
        startAt: Date.now()
      });
    };

    const everChartExtremumReducer = (state, {
      payload: {
        extremums
      }
    }) => {
      const pads = Object.assign({}, state.app.pads);

      for (const id in extremums) {
        if (pads[id]) {
          pads[id] = Object.assign(Object.assign({}, pads[id]), {
            max: setAnimationValue(pads[id].max, extremums[id].max),
            min: setAnimationValue(pads[id].min, extremums[id].min)
          });
        }
      }

      return applyState(state, {
        pads
      });
    };

    const everChartHistoryDataReducer = (state, {
      payload: {
        data,
        time,
        interval,
        end
      }
    }) => {
      const lastTime = selectEverChartLastTime(state);
      const maxTime = selectEverChartMaxTime(state);
      const maxBucketSize = selectEverChartMaxBucketSize(state);
      const currentData = appendTimeSeries(selectEverChartData(state), data, interval, time, end, maxBucketSize);
      let newLastTime = 0;

      for (let i = currentData.length - 1; i >= 0; i--) {
        if (currentData[i].interval === interval) {
          newLastTime = currentData[i].to;
          break;
        }
      }

      newLastTime = Math.max(lastTime, newLastTime);

      if (maxTime != null) {
        newLastTime = Math.min(newLastTime, maxTime);
      }

      return applyState(state, {
        data: currentData,
        lastRequestedTime: time,
        lastTime: newLastTime
      });
    };

    const everChartLastTimeReducer = (state, {
      payload: {
        lastTime
      }
    }) => {
      return applyState(state, {
        lastTime: Math.max(state.app.lastTime, lastTime)
      });
    };

    const everChartLastTimeStubReducer = (state, {
      payload: {
        lastTimeStub,
        animate
      }
    }) => {
      const lastTime = selectEverChartLastTime(state);
      const zoom = selectEverChartZoom(state, true);
      const width = hd_componentsMultiApp.widthSelector(state);
      const scroll = selectEverChartPositionScroll(state);
      const defaultLastTimeStubGap = zoom * (width / 3);
      const minTime = selectEverChartMinTime(state);
      const maxTime = selectEverChartMaxTime(state) || lastTime + defaultLastTimeStubGap;
      const max = maxTime - lastTime + scroll * zoom;
      const min = Math.max(minTime - lastTime + width * zoom + scroll * zoom, 0);
      return applyState(state, {
        lastTimeStub: setAnimationValue(state.app.lastTimeStub, Math.max(min, Math.min(lastTimeStub, max)), animate)
      });
    };

    const everChartScrollReducer = (state, {
      payload: {
        scroll
      }
    }) => {
      const lastTime = selectEverChartLastTime(state);
      const minTime = selectEverChartMinTime(state);
      const maxTime = selectEverChartMaxTime(state);
      const original = selectEverChartPositionScroll(state);

      if (!isFinite(scroll)) {
        scroll = lastTime;
      } // maxTime -> min zoom
      // minTime -> max zoom


      if (minTime != null && minTime > scroll) {
        scroll = minTime;
      }

      if (maxTime != null && maxTime < scroll) {
        scroll = maxTime;
      }

      if (original === scroll) {
        return state;
      }

      return applyState(state, {
        scrollPosition: scroll
      });
    };

    const everChartTickReducer = (state, {
      payload: {
        tick
      }
    }) => {
      return applyState(state, {
        tick
      });
    };

    const everChartZoomReducer = (state, {
      payload: {
        zoom
      }
    }) => {
      return applyState(state, {
        zoom: setAnimationValue(state.app.zoom, zoom)
      });
    };

    const everChartReducer = initialState => {
      return hd_componentsUtils.mergeReducer(hd_componentsUtils.createRootReducer([[everChartChangeViewportReducer, everChartChangeViewportAction], [everChartDataReducer, everChartDataAction], [everChartExtremumReducer, everChartExtremumAction], [everChartZoomReducer, everChartZoomAction], [everChartScrollReducer, everChartScrollToTimeAction], [everChartHistoryDataReducer, everChartHistoryDataAction], [everChartCrosshairReducer, everChartCrosshairAction], [everChartCrosshairResetReducer, everChartPointerOutAction], [everChartTickReducer, everChartTickAction], [everChartCleanReducer, everChartNewIntervalAction], [everChartLastTimeStubReducer, everChartLastTimeStubAction], [everChartChangeConfigurationReducer, everChartChangeConfigurationAction], [everChartLastTimeReducer, everChartLastTimeAction]], initialState));
    };

    const everChartParameters = {
      default: {
        // name of extension
        resource: {
          resources: [...hd_componentsCommon.commonFonts]
        }
      }
    };

    const MINUTE = 60 * 1000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const MONTH = DAY * 30; // avg

    const YEAR = MONTH * 12;

    const getNumber = (width, from, to, averageLabelWidth = 50) => {
      for (let i = to; i >= from; i--) {
        if (width / i >= averageLabelWidth) {
          // ???
          return i;
        }
      }

      return Math.floor(width / averageLabelWidth);
    };

    const numberOfTicks = (width, interval) => {
      if (interval > YEAR) {
        return getNumber(width, 1, 3);
      } else if (interval > MONTH) {
        return getNumber(width, 2, 4);
      } else if (interval > DAY) {
        return getNumber(width, 2, 4);
      } else if (interval > HOUR) {
        return getNumber(width, 2, 4, 80);
      } else if (interval > MINUTE) {
        return getNumber(width, 2, 4, 100);
      } else {
        return getNumber(width, 2, 4, 120);
      }
    };

    const getXAxisTicks = memoizeOne__default["default"]((lastTime, zoom, width, tickInterval, scrollPosition) => {
      const num = numberOfTicks(width, zoom);
      const startOffset = scrollPosition;
      const tickStartOffset = startOffset % tickInterval;
      const ticks = [];

      for (let i = num; i >= 0; i--) {
        ticks.push(startOffset - tickInterval * i - tickStartOffset);
      }

      return ticks;
    });
    const selectXAxisTicks = s => {
      // const lastTime = selectEverChartDataLastTime(s);
      const zoom = selectEverChartZoom(s, true);
      const width = hd_componentsMultiApp.widthSelector(s);
      const scrollPosition = selectEverChartPositionScroll(s);
      const tickInterval = selectXAxisTickInterval(s);
      return getXAxisTicks(selectEverChartLastTime(s) + selectEverChartLastTimeStub(s), zoom, width, tickInterval, scrollPosition);
    };
    const getInterval = memoizeOne__default["default"]((width, zoom) => {
      const num = numberOfTicks(width, zoom);
      const duration = width * zoom;
      return Math.floor(duration / (num + 1));
    });
    const selectXAxisTickInterval = s => {
      const width = hd_componentsMultiApp.widthSelector(s);
      const zoom = selectEverChartZoom(s, true);
      return getInterval(width, zoom);
    };
    const selectYAxisTicks = (s, pad) => {
      const min = selectEverChartMin(s, pad);
      const max = selectEverChartMax(s, pad);
      const height = hd_componentsMultiApp.heightSelector(s);
      const num = Math.max(Math.min(Math.ceil(height / 25), 5), 3);
      const interval = (max - min) / num;
      const ticks = new Set();

      for (let i = 1; i < num; i++) {
        ticks.add(min + interval * i);
      }

      return Array.from(ticks);
    };

    const SECOND_FORMAT = 'HH:mm:ss.fff';
    const MINUTE_FORMAT = 'HH:mm:ss';
    const HOUR_FORMAT = 'HH:mm:ss';
    const DAY_FORMAT = 'yyyy-MM-dd';
    const MONTH_FORMAT = 'yyyy-MM-dd';
    const YEAR_FORMAT = 'yyyy-MM';
    const FULL_FORMAT = 'yyyy-MM-dd HH:mm:ss.fff';
    const formatAxisDate = (time, interval) => {
      let format;

      if (interval == null) {
        format = FULL_FORMAT;
      } else if (interval > YEAR) {
        format = YEAR_FORMAT;
      } else if (interval > MONTH) {
        format = MONTH_FORMAT;
      } else if (interval > DAY) {
        format = DAY_FORMAT;
      } else if (interval > HOUR) {
        format = HOUR_FORMAT;
      } else if (interval > MINUTE) {
        format = MINUTE_FORMAT;
      } else {
        format = SECOND_FORMAT;
      }

      return new hdDate.HdDate(time).toLocaleFormat(format);
    };
    const formatY = (value, formatter = hd_componentsCommon.noopFormatFunction) => formatter(value.toString());
    const formatX = (value, interval, formatter = formatAxisDate) => formatter(value, interval);

    class XAxisStage extends hd_componentsMultiApp.Container {
      constructor(stage, index) {
        super(stage, index);
        this.buffer = [];
        XAxisStage.symbolWidth = XAxisStage.symbolWidth || hd_componentsMultiApp.computeSymbolWidth(hd_componentsCommon.robotoMonoRegular10);
      }

      setState(state, context, dispatch) {
        const ticks = selectXAxisTicks(state);
        const interval = selectXAxisTickInterval(state);
        const height = hd_componentsMultiApp.heightSelector(state); // const lastTimeStub = selectEverChartLastTimeStub(state);
        // const last = selectEverChartLastTime(state) + lastTimeStub;

        const zoom = selectEverChartZoom(state, true);
        const width = hd_componentsMultiApp.widthSelector(state);
        const scroll = selectEverChartPositionScroll(state);
        const formatFunctions = selectEverChartFormatFunctions(state);
        const {
          XAxis: {
            label: {
              color
            }
          }
        } = context.theme.priceChart;
        this.root.width = width;
        this.root.scale.set(1, 1);

        for (let i = 0; i < ticks.length; i++) {
          if (i >= this.buffer.length) {
            this.buffer.push(new hd_componentsMultiApp.Text(this.root));
          }

          const text = formatX(ticks[i], interval, formatFunctions === null || formatFunctions === void 0 ? void 0 : formatFunctions.xAxis);
          this.buffer[i].setState({
            text,
            style: hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, color),
            x: width - (scroll - ticks[i]) / zoom,
            y: height - 10,
            height: 20,
            width: text.length * XAxisStage.symbolWidth
          }, context, dispatch);
        }

        while (this.buffer.length > ticks.length) {
          const text = this.buffer.pop();
          text.destroy();
        }

        hd_componentsMultiApp.setContainerIndex(this.stage, this.root, this.index);
      }

      destroy() {
        this.buffer.forEach(text => text.destroy());
        this.buffer = [];
        super.destroy();
      }

    }

    const X_CROSSHAIR_LABEL_MIN_WIDTH = 120;
    const baseStyle$1 = Object.assign(Object.assign({}, hd_componentsCommon.ttfRobotoCondensed_regular_10), {
      fontSize: 11
    });
    class XCrosshairStage extends hd_componentsMultiApp.Graphics {
      setState(state, context, dispatch) {
        var _a;

        const crosshair = selectEverChartCrosshair(state);
        this.root.clear();

        if (!crosshair) {
          (_a = this.text) === null || _a === void 0 ? void 0 : _a.destroy();
          this.text = null;
          return;
        }

        if (!this.text) {
          this.text = new hd_componentsMultiApp.TextWithBackground(this.stage, this.index + 1);
        }

        XCrosshairStage.symbolWidth = XCrosshairStage.symbolWidth || hd_componentsMultiApp.computeSymbolWidth(hd_componentsCommon.robotoMonoRegular10);
        const interval = selectXAxisTickInterval(state);
        const height = hd_componentsMultiApp.heightSelector(state); // const lastTimeStub = selectEverChartLastTimeStub(state);
        // const last = selectEverChartLastTime(state) + lastTimeStub;

        const zoom = selectEverChartZoom(state, true);
        const width = hd_componentsMultiApp.widthSelector(state);
        const scrollPosition = selectEverChartPositionScroll(state);
        const formatFunctions = selectEverChartFormatFunctions(state);
        const x = width - (scrollPosition - crosshair.time) / zoom;
        const text = formatX(crosshair.time, interval, formatFunctions === null || formatFunctions === void 0 ? void 0 : formatFunctions.xCrosshair);
        const textWidth = Math.max(text.length * XCrosshairStage.symbolWidth, X_CROSSHAIR_LABEL_MIN_WIDTH);
        const textPosition = Math.min(Math.max(x, textWidth / 2), Math.round(width - textWidth / 2));
        const {
          crosshair: {
            xAxisLabel,
            lines
          }
        } = context.theme.priceChart;
        this.root.lineStyle(lines.width, lines.color, lines.opacity).moveTo(x, 0).lineTo(x, height);
        hd_componentsMultiApp.setContainerIndex(this.stage, this.root, this.index);
        this.text.setState({
          text,
          style: hd_componentsCommon.fontStyleCache(baseStyle$1, xAxisLabel.text.color),
          x: textPosition,
          y: height - 10,
          height: 20,
          width: textWidth,
          backgroundAlpha: xAxisLabel.background.alpha,
          backgroundColor: xAxisLabel.background.color
        }, context, dispatch);
      }

      destroy() {
        var _a;

        (_a = this.text) === null || _a === void 0 ? void 0 : _a.destroy();
        super.destroy();
      }

    }

    const ticksToCoords$1 = (ticks, width, last, zoom, height, scroll) => {
      return ticks.map(tick => {
        const x = width - (scroll - tick) / zoom;
        return [[x, 0], [x, height - 20] // label h
        ];
      });
    };

    class VerticalGridStage extends hd_componentsMultiApp.Graphics {
      setState(state, context, dispatch) {
        var _a;

        const ticks = selectXAxisTicks(state);
        const height = hd_componentsMultiApp.heightSelector(state);
        const lastTimeStub = selectEverChartLastTimeStub(state);
        const last = selectEverChartLastTime(state) + lastTimeStub;
        const zoom = selectEverChartZoom(state);
        const width = hd_componentsMultiApp.widthSelector(state);
        const scrollPosition = selectEverChartPositionScroll(state);
        const grid = ticksToCoords$1(ticks, width, last, zoom, height, scrollPosition);
        const {
          XGrid: {
            mainGrid: mainGridStyle
          }
        } = context.theme.priceChart;
        this.root.clear().lineStyle(mainGridStyle.lineWidth, mainGridStyle.color, (_a = mainGridStyle.alpha) !== null && _a !== void 0 ? _a : 0.2);

        for (const line of grid) {
          const [[x1, y1], [x2, y2]] = line;
          this.root.moveTo(x1, y1).lineTo(x2, y2);
        }
      }

    }

    class YAxisStage extends hd_componentsMultiApp.Container {
      constructor(stage, index) {
        super(stage, index);
        this.buffer = [];
        YAxisStage.symbolWidth = YAxisStage.symbolWidth || hd_componentsMultiApp.computeSymbolWidth(hd_componentsCommon.robotoMonoRegular10);
      }

      setState(state, context, dispatch) {
        if (!this.pad) {
          return;
        }

        const ticks = selectYAxisTicks(state, this.pad);
        const min = selectEverChartMin(state, this.pad);
        const max = selectEverChartMax(state, this.pad);
        const width = hd_componentsMultiApp.widthSelector(state);
        const height = selectEverChartHeight(state, this.pad);
        const formatFunctions = selectEverChartFormatFunctions(state);
        const {
          YAxis: {
            label: {
              color
            }
          }
        } = context.theme.priceChart;
        this.root.width = width;
        this.root.scale.set(1, 1);

        for (let i = 0; i < ticks.length; i++) {
          if (i >= this.buffer.length) {
            this.buffer.push(new hd_componentsMultiApp.Text(this.root));
          }

          const text = hd_componentsCommon.getFormattedNumber(formatY(ticks[i], (formatFunctions === null || formatFunctions === void 0 ? void 0 : formatFunctions.yAxis) || hd_componentsCommon.noopFormatFunction));
          const y = getYCoordinate(ticks[i], height, min, max);
          this.buffer[i].setState({
            text,
            style: hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, color),
            x: width,
            y,
            height: 20,
            width: text.length * YAxisStage.symbolWidth,
            horizontalAlign: 'right'
          }, context, dispatch);
        }

        while (this.buffer.length > ticks.length) {
          const text = this.buffer.pop();
          text.destroy();
        }
      }

      setPad(pad) {
        this.pad = pad;
      }

      destroy() {
        this.buffer.forEach(text => text.destroy());
        this.buffer = [];
        super.destroy();
      }

    }

    const Y_CROSSHAIR_LABEL_MIN_WIDTH = 20;
    const baseStyle = Object.assign(Object.assign({}, hd_componentsCommon.ttfRobotoCondensed_regular_10), {
      fontSize: 11
    });
    class YCrosshairStage extends hd_componentsMultiApp.Graphics {
      setState(state, context, dispatch) {
        var _a;

        const crosshair = selectEverChartCrosshair(state);
        this.root.clear();

        if (!crosshair || this.pad.id !== crosshair.pad) {
          (_a = this.text) === null || _a === void 0 ? void 0 : _a.destroy();
          this.text = null;
          return;
        }

        if (!this.text) {
          this.text = new hd_componentsMultiApp.TextWithBackground(this.stage, this.index + 1);
        }

        YCrosshairStage.symbolWidth = YCrosshairStage.symbolWidth || hd_componentsMultiApp.computeSymbolWidth(hd_componentsCommon.robotoMonoRegular10);
        const min = selectEverChartMin(state, this.pad);
        const max = selectEverChartMax(state, this.pad);
        const height = selectEverChartHeight(state, this.pad);
        const width = hd_componentsMultiApp.widthSelector(state);
        const totalHeight = hd_componentsMultiApp.heightSelector(state);
        const formatFunctions = selectEverChartFormatFunctions(state);
        const y = getYCoordinate(crosshair.value, height, min, max);
        const yCoord = Math.min(totalHeight - 20, Math.max(10, y));
        const text = hd_componentsCommon.getFormattedNumber(formatY(crosshair.value, (formatFunctions === null || formatFunctions === void 0 ? void 0 : formatFunctions.yCrosshair) || hd_componentsCommon.noopFormatFunction));
        const textWidth = Math.max(text.length * YCrosshairStage.symbolWidth, Y_CROSSHAIR_LABEL_MIN_WIDTH);
        const {
          crosshair: {
            yAxisLabel,
            lines
          }
        } = context.theme.priceChart;
        this.root.lineStyle(lines.width, lines.color, lines.opacity).moveTo(0, yCoord).lineTo(width, yCoord);
        hd_componentsMultiApp.setContainerIndex(this.stage, this.root, this.index);
        this.text.setState({
          text,
          style: hd_componentsCommon.fontStyleCache(baseStyle, yAxisLabel.text.color),
          x: width,
          y: yCoord,
          height: 20,
          width: textWidth,
          backgroundAlpha: yAxisLabel.background.alpha,
          backgroundColor: yAxisLabel.background.color,
          horizontalAlign: 'right',
          triangle: true
        }, context, dispatch);
      }

      setPad(pad) {
        this.pad = pad;
      }

      destroy() {
        var _a;

        (_a = this.text) === null || _a === void 0 ? void 0 : _a.destroy();
        super.destroy();
      }

    }

    const ticksToCoords = (ticks, min, max, height, width) => {
      return ticks.map(tick => {
        const y = getYCoordinate(tick, height, min, max);
        return [[0, y], [width, y]];
      });
    };

    class HorizontalGridStage extends hd_componentsMultiApp.Graphics {
      setState(state, context, dispatch) {
        var _a;

        if (!this.pad) {
          return;
        }

        const ticks = selectYAxisTicks(state, this.pad);
        const min = selectEverChartMin(state, this.pad);
        const max = selectEverChartMax(state, this.pad);
        const width = hd_componentsMultiApp.widthSelector(state);
        const height = selectEverChartHeight(state, this.pad);
        const grid = ticksToCoords(ticks, min, max, height, width);
        const {
          YGrid: {
            mainGrid: mainGridStyle
          }
        } = context.theme.priceChart;
        this.root.clear().lineStyle(mainGridStyle.lineWidth, mainGridStyle.color, (_a = mainGridStyle.alpha) !== null && _a !== void 0 ? _a : 0.2);

        for (const line of grid) {
          const [[x1, y1], [x2, y2]] = line;
          this.root.moveTo(x1, y1).lineTo(x2, y2);
        }

        hd_componentsMultiApp.setContainerIndex(this.stage, this.root, this.index);
      }

      setPad(pad) {
        this.pad = pad;
      }

    }

    const selectEverChartLabels = (state, pad, padItem) => {
      const slice = selectEverChartDataSlice(state);
      const min = selectEverChartMin(state, pad);
      const max = selectEverChartMax(state, pad);
      const zoom = selectEverChartZoom(state);
      const width = hd_componentsMultiApp.widthSelector(state);
      const height = selectEverChartHeight(state, pad);
      const scroll = selectEverChartPositionScroll(state);
      if (!slice.length) return [];
      const labels = [];
      const item = padItem;
      const {
        getFontColor,
        getTextStyle,
        getText,
        getY,
        textStyle
      } = item;

      for (let i = slice.length - 1; i >= 0; i--) {
        const itemY = getY(slice[i]);
        const text = getText(slice[i]);

        if (itemY == null || text == null || !text.length) {
          continue;
        }

        const style = (getTextStyle === null || getTextStyle === void 0 ? void 0 : getTextStyle(slice[i])) || textStyle || hd_componentsCommon.ttfRobotoCondensed_regular_10;
        const y = getYCoordinate(itemY, height, min, max);
        const x = width - (scroll - slice[i].time) / zoom;
        labels.unshift({
          x,
          y,
          color: (getFontColor === null || getFontColor === void 0 ? void 0 : getFontColor(slice[i])) || item.color,
          textStyle: style,
          text
        });
      }

      return labels;
    };

    const throwInvalidColorStringException = received => {
      throw new Error(`any2hex - invalid format rbga, received "${received}"`);
    };

    const toHexNumber = hex => {
      return +hex.toLowerCase().replace('#', '0x');
    };

    const fallback = {
      alpha: 1,
      color: 0xffffff
    };
    const any2hex = color => {
      if (color == null) {
        return fallback;
      }

      if (typeof color === 'number') {
        return {
          color,
          alpha: 1
        };
      }

      const deserialized = colorString__namespace.get(color);
      if (!deserialized) throwInvalidColorStringException(color);
      const {
        value
      } = deserialized;
      return {
        alpha: value[3],
        color: toHexNumber(colorString__namespace.to.hex(value.slice(0, 3)))
      };
    };

    const selectEverChartIntervals = (state, pad, padItem) => {
      const slice = selectEverChartDataSlice(state);
      const min = selectEverChartMin(state, pad);
      const max = selectEverChartMax(state, pad);
      const zoom = selectEverChartZoom(state);
      const width = hd_componentsMultiApp.widthSelector(state);
      const height = selectEverChartHeight(state, pad);
      const scrollPosition = selectEverChartPositionScroll(state);
      if (!slice.length) return [];
      const intervals = [];
      const item = padItem;
      const {
        getClose,
        getHigh,
        getLow,
        getOpen,
        riseColor,
        fallColor,
        getIntervalWidth
      } = item;
      const riseColorInfo = any2hex(riseColor);
      const fallColorInfo = any2hex(fallColor);
      let prevX;

      for (let i = slice.length - 1; i >= 0; i--) {
        const itemOpen = getOpen(slice[i]);
        const itemClose = getClose(slice[i]);
        const itemHigh = getHigh(slice[i]);
        const itemLow = getLow(slice[i]);
        if (itemOpen == null) continue;
        let intervalWidth = getIntervalWidth(slice[i]);
        const open = getYCoordinate(itemOpen, height, min, max);
        const close = getYCoordinate(itemClose, height, min, max);
        const high = getYCoordinate(itemHigh, height, min, max);
        const low = getYCoordinate(itemLow, height, min, max);
        const x = width - (scrollPosition - slice[i].time) / zoom;
        const {
          color,
          alpha
        } = open > close ? riseColorInfo : fallColorInfo;

        if (intervalWidth == null) {
          if (prevX != null) {
            // TODO: first bar
            intervalWidth = Math.abs(prevX - x);
          }
        } else {
          intervalWidth = intervalWidth / zoom;
        }

        intervals.unshift({
          open,
          close,
          high,
          low,
          x,
          intervalWidth,
          color,
          alpha
        });
        prevX = x;
      }

      return intervals;
    };

    const DEFAULT_SHAPE_LINE_WIDTH = 1;

    const getRelativeRotatedPoints = (x, y, points, rotation) => {
      const result = [];
      const degreesInRadian = 57.2958;

      for (let i = 0; i < points.length; ++i) {
        const {
          x: pointX,
          y: pointY
        } = points[i];
        result.push({
          x: (pointX - x) * Math.cos(rotation / degreesInRadian) - (pointY - y) * Math.sin(rotation / degreesInRadian) + x,
          y: (pointX - x) * Math.sin(rotation / degreesInRadian) + (pointY - y) * Math.cos(rotation / degreesInRadian) + y
        });
      }

      return result;
    };

    const selectEverChartShapes = (state, pad, padItem) => {
      const slice = selectEverChartDataSlice(state);
      const min = selectEverChartMin(state, pad);
      const max = selectEverChartMax(state, pad);
      const zoom = selectEverChartZoom(state);
      const width = hd_componentsMultiApp.widthSelector(state);
      const height = selectEverChartHeight(state, pad);
      const scrollPosition = selectEverChartPositionScroll(state);

      if (!slice.length) {
        return [];
      }

      const shapes = [];
      const item = padItem;
      const {
        getShapeSize,
        getShapeType,
        getShapeColor,
        getShapeRotation,
        shapeSize,
        shapeType,
        shapeColor,
        getY,
        shapeLineWidth
      } = item;

      for (let i = slice.length - 1; i >= 0; i--) {
        const itemY = getY(slice[i]);

        if (itemY == null) {
          continue;
        }

        const y = getYCoordinate(itemY, height, min, max);
        const x = width - (scrollPosition - slice[i].time) / zoom;
        const size = (getShapeSize === null || getShapeSize === void 0 ? void 0 : getShapeSize(slice[i])) || shapeSize;
        const type = (getShapeType === null || getShapeType === void 0 ? void 0 : getShapeType(slice[i])) || shapeType;
        const rotation = (getShapeRotation === null || getShapeRotation === void 0 ? void 0 : getShapeRotation(slice[i])) || 0;
        const points = [];

        switch (type) {
          case exports.EverChartShapeType.triangle:
            {
              const median = Math.sqrt(Math.pow(size, 2) * 3) / 4;
              points.push({
                x: x - size / 2,
                y: y + median
              }, {
                x: x,
                y: y - median
              }, {
                x: x + size / 2,
                y: y + median
              });
              break;
            }

          case exports.EverChartShapeType.rhombus:
            {
              points.push({
                x: x - size / 2,
                y
              }, {
                x,
                y: y + size / 2
              }, {
                x: x + size / 2,
                y
              }, {
                x,
                y: y - size / 2
              });
              break;
            }

          case exports.EverChartShapeType.flag:
            {
              points.push({
                x,
                y: y + size + size / 2
              }, {
                x,
                y: y + size / 2
              }, {
                x: x + size,
                y
              }, {
                x,
                y: y - size / 2
              });
              break;
            }

          case exports.EverChartShapeType.arrow:
            {
              const triangleSize = Math.sqrt(size);
              const median = Math.sqrt(Math.pow(triangleSize, 2) * 3) / 4;
              points.push({
                x,
                y: y + size / 2
              }, {
                x,
                y: y - size / 2 + median
              }, {
                x: x - triangleSize / 2,
                y: y - size / 2 + median
              }, {
                x,
                y: y - size / 2
              }, {
                x: x + triangleSize / 2,
                y: y - size / 2 + median
              }, {
                x,
                y: y - size / 2 + median
              });
              break;
            }
        }

        shapes.unshift({
          centerY: y,
          centerX: x,
          size,
          type,
          color: (getShapeColor === null || getShapeColor === void 0 ? void 0 : getShapeColor(slice[i])) || shapeColor,
          lineWidth: shapeLineWidth || DEFAULT_SHAPE_LINE_WIDTH,
          points: getRelativeRotatedPoints(x, y, points, rotation)
        });
      }

      return shapes;
    };

    const DEFAULT_VOLUME_WINDOW_PART = 0.2;
    const selectEverChartVolumes = (s, pad, padItem) => {
      if (padItem.type !== exports.EverChartPadItem.VOLUME) return [];
      const slice = selectEverChartDataSlice(s);
      if (!slice.length) return [];
      const height = selectEverChartHeight(s, pad);
      const scrollPosition = selectEverChartPositionScroll(s);
      const width = hd_componentsMultiApp.widthSelector(s);
      const zoom = selectEverChartZoom(s);
      let maxVolume = Number.NEGATIVE_INFINITY;
      let prevX;

      for (let i = 0; i < slice.length; i++) {
        const item = padItem;
        const volume = +item.getVolume(slice[i]);

        if (volume == null) {
          continue;
        }

        maxVolume = Math.max(maxVolume, volume);
      }

      const volumes = [];
      const absoluteVolumeHeight = height * DEFAULT_VOLUME_WINDOW_PART;

      for (let i = 0; i < slice.length; ++i) {
        const item = padItem;
        const volume = +item.getVolume(slice[i]);
        if (volume == null) continue;
        let intervalWidth = item.getIntervalWidth(slice[i]);
        const relativeVolumeHeight = getYCoordinate(volume, absoluteVolumeHeight, 0, maxVolume);
        const x = width - (scrollPosition - slice[i].time) / zoom;
        const y = height - absoluteVolumeHeight + relativeVolumeHeight;

        if (intervalWidth == null) {
          if (prevX != null) {
            intervalWidth = Math.abs(prevX - x);
          }
        } else {
          intervalWidth = intervalWidth / zoom;
        }

        volumes.push({
          x: x + DEFAULT_INTERVAL_GAP,
          y,
          width: intervalWidth - DEFAULT_INTERVAL_GAP,
          height: absoluteVolumeHeight - relativeVolumeHeight
        });
        prevX = x;
      }

      return volumes;
    };

    const drawPolygon = (graphics, polygon, lineWidth, lineColor, lineAlpha, fillAlpha, fillColor) => {
      graphics.lineStyle(lineWidth, lineColor, lineAlpha);

      if (fillColor != null) {
        graphics.beginFill(fillColor, fillAlpha);
      }

      return graphics.drawPolygon(polygon).endFill();
    };

    const DEFAULT_LINE_WIDTH = 1;
    const DEFAULT_BAR_SIZE = 2;
    const DEFAULT_OFFSET = 2;

    const getAreaParams = (areaData, areaColor, y) => {
      const {
        color,
        alpha
      } = any2hex(areaColor);
      const data = [...areaData];
      data.unshift({
        x: data[0].x,
        y
      });
      data.unshift({
        x: data[data.length - 1].x,
        y
      });
      return {
        data,
        color,
        alpha
      };
    };

    class EverChartItemStage extends hd_componentsMultiApp.Graphics {
      constructor() {
        super(...arguments);
        this.colorCache = new Map();
        this.buffer = [];
      }

      get symbolWidth() {
        if (this._symbolWidth) {
          return this._symbolWidth;
        }

        return this._symbolWidth = hd_componentsMultiApp.computeSymbolWidth(hd_componentsCommon.robotoMonoRegular10);
      }

      setState(state, context, dispatch) {
        if (!this.pad || !this.item) {
          return;
        }

        this.root.clear();

        switch (this.item.type) {
          case exports.EverChartPadItem.LINE:
            this.drawLine(state, this.item);
            break;

          case exports.EverChartPadItem.RANGE_AREA:
            this.drawRangeArea(state, this.item);
            break;

          case exports.EverChartPadItem.INTERVAL:
            this.drawRangeInterval(state, this.item);
            break;

          case exports.EverChartPadItem.VOLUME:
            this.drawRangeVolumes(state, this.item);
            break;

          case exports.EverChartPadItem.SHAPE:
            this.drawShapes(state, this.item);
            break;

          case exports.EverChartPadItem.LABEL:
            this.drawLabels(state, this.item, context);
            break;

          case exports.EverChartPadItem.SHAPE_WITH_LABEL:
            this.drawShapesAndLabels(state, this.item, context);
            break;
        }

        hd_componentsMultiApp.setContainerIndex(this.stage, this.root, this.index);
      }

      destroy() {
        this.buffer.forEach(text => text.destroy());
        this.buffer = [];
        super.destroy();
      }

      setPad(pad, item) {
        this.pad = pad;
        this.item = item;
      }

      getColor(color) {
        if (this.colorCache.has(color)) {
          return this.colorCache.get(color);
        }

        const parsed = any2hex(color);
        this.colorCache.set(color, parsed);
        return parsed;
      }

      drawLine(state, item) {
        var _a;

        const lines = selectEverChartPoly(state, this.pad, item);
        const {
          height
        } = this.pad;

        for (let i = 0; i < lines.length; ++i) {
          if (!lines[i].length) {
            continue;
          }

          const areaColors = [];
          if (item.topAreaColor) areaColors.push({
            color: item.topAreaColor,
            y: 0
          });
          if (item.bottomAreaColor) areaColors.push({
            color: item.bottomAreaColor,
            y: height
          });

          if (areaColors.length) {
            for (let j = 0; j < areaColors.length; ++j) {
              if (!areaColors[j].color) {
                continue;
              }

              const {
                color: _color,
                alpha: _alpha,
                data
              } = getAreaParams(lines[i], areaColors[j].color, areaColors[j].y);

              const _polygon = new PIXI__namespace.Polygon(data);

              _polygon.closeStroke = false;
              drawPolygon(this.root, _polygon, void 0, void 0, void 0, _alpha, _color);
            }
          }

          const polygon = new PIXI__namespace.Polygon(lines[i]);
          const {
            color,
            alpha
          } = this.getColor(item.color);
          polygon.closeStroke = false;
          drawPolygon(this.root, polygon, (_a = item.lineWidth) !== null && _a !== void 0 ? _a : DEFAULT_LINE_WIDTH, color, alpha);
        }
      }

      drawRangeArea(state, item) {
        var _a;

        const lines = selectEverChartRangeAreaPoly(state, this.pad, item);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line.points.length) continue;
          const polygon = new PIXI__namespace.Polygon(line.points);
          polygon.closeStroke = false;
          const fill = line.isForward ? this.getColor(item.background1) : this.getColor(item.background2);
          const {
            alpha,
            color
          } = this.getColor(item.color);
          drawPolygon(this.root, polygon, (_a = item.lineWidth) !== null && _a !== void 0 ? _a : DEFAULT_LINE_WIDTH, color, alpha, fill === null || fill === void 0 ? void 0 : fill.alpha, fill === null || fill === void 0 ? void 0 : fill.color);
        }
      }

      drawRangeInterval(state, item) {
        const intervals = selectEverChartIntervals(state, this.pad, item);

        for (let i = 0; i < intervals.length; ++i) {
          const {
            open,
            close,
            high,
            low,
            x,
            color,
            alpha,
            intervalWidth
          } = intervals[i];
          const min = Math.min(open, close);
          const max = Math.max(open, close);

          switch (item.intervalType) {
            case exports.EverChartIntervalType.bar:
              {
                const minSize = Math.min(intervalWidth, DEFAULT_BAR_SIZE);
                this.root.beginFill(color, alpha).drawRect(x, low - minSize / 2, minSize, high - low);
                this.root.drawRect(x, open - minSize / 2, intervalWidth / 2 + minSize / 2 - DEFAULT_INTERVAL_GAP / 2, minSize);
                this.root.drawRect(x - intervalWidth / 2 + DEFAULT_INTERVAL_GAP / 2, close - minSize / 2, intervalWidth / 2 - minSize / 2, minSize);
                this.root.endFill();
                break;
              }

            default:
              {
                const minGap = intervalWidth < DEFAULT_INTERVAL_GAP ? intervalWidth + 1 : DEFAULT_INTERVAL_GAP;
                this.root.beginFill(color, alpha).lineStyle({
                  color,
                  alpha,
                  width: 1
                }).drawRect(x - intervalWidth / 2 + minGap / 2, min, intervalWidth - minGap, Math.max(max - min, 1)).drawPolygon([x, high, x, min]).drawPolygon([x, max, x, low]).endFill();
              }
          }
        }
      }

      drawRangeVolumes(state, item) {
        const volumes = selectEverChartVolumes(state, this.pad, item);
        const {
          alpha,
          color
        } = this.getColor(item.color);

        for (let i = 0; i < volumes.length; ++i) {
          const {
            x,
            y,
            height,
            width
          } = volumes[i];
          this.root.beginFill(color, alpha).drawRect(x, y, width, height).endFill();
        }
      }

      drawShapes(state, item) {
        const shapes = selectEverChartShapes(state, this.pad, item);
        this.drawShapesList(shapes);
      }

      drawShapesList(shapes) {
        for (let i = 0; i < shapes.length; ++i) {
          const {
            centerX,
            centerY,
            type,
            size,
            color: rawColor,
            points,
            lineWidth
          } = shapes[i];
          const {
            color,
            alpha
          } = this.getColor(rawColor);
          this.root.lineStyle({});

          switch (type) {
            case exports.EverChartShapeType.square:
              {
                this.root.beginFill(color, alpha).drawRect(centerX - size / 2, centerY - size / 2, size, size).endFill();
                break;
              }

            case exports.EverChartShapeType.cross:
              {
                this.root.beginFill(color, alpha).lineStyle({
                  width: lineWidth,
                  color,
                  alpha
                }).drawPolygon([{
                  x: centerX - size / 2,
                  y: centerY - size / 2
                }, {
                  x: centerX + size / 2,
                  y: centerY + size / 2
                }]).drawPolygon([{
                  x: centerX - size / 2,
                  y: centerY + size / 2
                }, {
                  x: centerX + size / 2,
                  y: centerY - size / 2
                }]).endFill();
                break;
              }

            case exports.EverChartShapeType.crossCircle:
              {
                const defaultCrossColor = 0xffffff;
                this.root.beginFill(color, alpha).drawCircle(centerX, centerY, size / 2).endFill().lineStyle({
                  width: lineWidth,
                  color: defaultCrossColor,
                  alpha
                }).drawPolygon([{
                  x: centerX - size / 4,
                  y: centerY - size / 4
                }, {
                  x: centerX + size / 4,
                  y: centerY + size / 4
                }]).drawPolygon([{
                  x: centerX - size / 4,
                  y: centerY + size / 4
                }, {
                  x: centerX + size / 4,
                  y: centerY - size / 4
                }]).lineStyle({});
                break;
              }

            case exports.EverChartShapeType.circle:
              {
                this.root.beginFill(color, alpha).drawCircle(centerX, centerY, size / 2).endFill();
                break;
              }

            default:
              {
                this.root.beginFill(color, alpha).lineStyle({
                  width: lineWidth,
                  color,
                  alpha
                }).drawPolygon(new PIXI__namespace.Polygon(points)).endFill().lineStyle({});
                break;
              }
          }
        }
      }

      drawLabels(state, item, context) {
        const labels = selectEverChartLabels(state, this.pad, item);

        for (let i = 0; i < labels.length; i++) {
          if (i >= this.buffer.length) {
            this.buffer.push(new hd_componentsMultiApp.Text(this.stage));
          }

          this.buffer[i].setState({
            text: labels[i].text,
            style: hd_componentsCommon.fontStyleCache(labels[i].textStyle, this.getColor(labels[i].color).color),
            x: labels[i].x,
            y: labels[i].y,
            height: 20,
            width: 20
          }, context, null);
        }

        while (this.buffer.length > labels.length) {
          const text = this.buffer.pop();
          text.destroy();
        }
      }

      drawShapesAndLabels(state, item, context) {
        const shapes = selectEverChartShapes(state, this.pad, item);
        const labels = selectEverChartLabels(state, this.pad, item);

        for (let i = 0; i < labels.length; i++) {
          if (i >= this.buffer.length) {
            this.buffer.push(new hd_componentsMultiApp.Text(this.stage));
          }

          const text = labels[i].text;
          const color = this.getColor(labels[i].color).color;
          this.buffer[i].setState({
            text,
            style: hd_componentsCommon.fontStyleCache(labels[i].textStyle, color),
            x: labels[i].x,
            y: labels[i].y + shapes[i].size / 2 + DEFAULT_OFFSET,
            height: 20,
            width: 20,
            verticalAlign: 'bottom'
          }, context, null);
        }

        while (this.buffer.length > labels.length) {
          const text = this.buffer.pop();
          text.destroy();
        }

        this.drawShapesList(shapes);
      }

    }

    class EverChartPadStage extends hd_componentsMultiApp.ComponentStage {
      constructor(stage, index) {
        super(stage);
        this.items = [];
        this.hitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
        this.isOver = false;
        this.x = 0;
        this.y = 0;

        this.onPointerover = () => {
          var _a;

          this.isOver = true;
          (_a = this.dispatch) === null || _a === void 0 ? void 0 : _a.call(this, everChartPointerOverAction(this.pad.id));
        };

        this.onPointerout = () => {
          var _a;

          this.isOver = false;
          (_a = this.dispatch) === null || _a === void 0 ? void 0 : _a.call(this, everChartPointerOutAction(this.pad.id));
        };

        this.onPointermove = event => {
          var _a;

          if (!this.isOver) {
            return;
          }

          const point = event.data.global;
          (_a = this.dispatch) === null || _a === void 0 ? void 0 : _a.call(this, everChartPointerMoveAction(this.pad.id, point.x - this.root.x - this.x, point.y - this.root.y - this.y));
        };

        this.containsPoint = ({
          x,
          y
        }) => this.hitArea.contains(x, y);

        this.root = new PIXI__namespace.Container();
        this.root.interactive = true;
        this.root.hitArea = this.hitArea;
        this.root.on('pointerover', this.onPointerover);
        this.root.on('pointerout', this.onPointerout);
        this.root.on('pointermove', this.onPointermove);
        this.root.scale.set(1, 1);
        this.horizontalGrid = new HorizontalGridStage(this.root, 0);
        hd_componentsMultiApp.appendContainer(this.stage, this.root, index);
        this.yCrosshair = new YCrosshairStage(this.root, 999);
        this.yAxis = new YAxisStage(this.root, 998);
      }

      setState(state, context, dispatch) {
        var _a, _b;

        this.dispatch = dispatch;
        this.horizontalGrid.setPad(this.pad);
        this.horizontalGrid.setState(state, context, dispatch);

        if (!((_b = (_a = this.pad) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.length)) {
          return;
        }

        const {
          x,
          y
        } = hd_componentsMultiApp.viewportSelector(state);
        this.x = x;
        this.y = y;

        for (let i = 0; i < this.pad.items.length; i++) {
          if (i >= this.items.length) {
            this.items.push(new EverChartItemStage(this.root, i + 1));
          }

          this.items[i].setPad(this.pad, this.pad.items[i]);
          this.items[i].setState(state, context, dispatch);
        }

        while (this.items.length > this.pad.items.length) {
          const item = this.items.pop();
          item.destroy();
        }

        this.yCrosshair.setPad(this.pad);
        this.yCrosshair.setState(state, context, dispatch);
        this.yAxis.setPad(this.pad);
        this.yAxis.setState(state, context, dispatch);
      }

      destroy() {
        this.yAxis.destroy();
        this.yCrosshair.destroy();
        this.dispatch = null;
        this.root.hitArea = null;
        this.horizontalGrid.destroy();
        this.items.forEach(item => item.destroy());
        this.stage.removeChild(this.root);
        this.root.destroy();
      }

      setYOffset(offset) {
        this.root.x = 0;
        this.root.y = offset;
      }

      setPad(pad) {
        this.pad = pad;
        this.hitArea.height = pad.height;
        this.hitArea.width = pad.width;
      }

    }

    const style = {
      fontSize: 40,
      fontFamily: ''
    };

    class EverChartAppStage extends hd_componentsMultiApp.ComponentStage {
      constructor(stage) {
        super(stage);
        this.pads = new Map();

        this.back = () => {
          this.dispatchAction(everChartScrollToTimeAction(Number.POSITIVE_INFINITY));
          this.dispatchAction(everChartLastTimeStubAction(Number.POSITIVE_INFINITY));
        };

        this.dispatchAction = action => {
          if (!this.dispatch) {
            return;
          }

          this.dispatch(Object.assign(Object.assign({}, action), {
            metadata: Object.assign(Object.assign({}, action.metadata), {
              multi: {
                appType: 'everChart',
                id: this.root['@@HIT_AREA'].id
              }
            })
          }));
        };

        this.root = new PIXI__namespace.Container();
        this.root['@@HIT_AREA'] = {
          type: 'everChart',
          id: null
        }; // TODO:

        stage.addChild(this.root);
        this.verticalGrid = new VerticalGridStage(this.root);
        this.xAxis = new XAxisStage(this.root);
        this.xCrosshair = new XCrosshairStage(this.root, 999);
      }

      setState(state, context, dispatch) {
        this.dispatch = dispatch;
        const appState = state.state;

        if (!(appState === null || appState === void 0 ? void 0 : appState.app)) {
          return;
        }

        this.verticalGrid.setState(appState, context, this.dispatchAction);
        const {
          x,
          y
        } = state.position;
        this.root.x = x;
        this.root.y = y;
        const padsObj = selectEverChartPads(appState);
        const pads = Object.entries(padsObj);
        const keys = new Set();
        let offset = 0;

        for (const [id, padState] of pads) {
          if (!this.pads.has(id)) {
            this.pads.set(id, new EverChartPadStage(this.root));
          }

          keys.add(id);
          const pad = this.pads.get(id);
          pad.setYOffset(offset);
          pad.setPad(padState);
          pad.setState(appState, context, this.dispatchAction);
          offset += padState.height;
        }

        this.pads.forEach((pad, key) => {
          if (!keys.has(key)) {
            pad.destroy();
            this.pads.delete(key);
          }
        });
        this.xAxis.setState(appState, context, this.dispatchAction);
        this.xCrosshair.setState(appState, context, this.dispatchAction);
        const width = hd_componentsMultiApp.widthSelector(appState);
        const height = hd_componentsMultiApp.heightSelector(appState);
        const color = context.theme.priceChart.focusOnPoint.color;

        if (!selectEverChartDisableBackButton(appState)) {
          if (!this.backButton) {
            this.backButton = new hd_componentsMultiApp.Text(this.root, 9999);
          }

          this.backButton.setState({
            text: '⌖',
            style: hd_componentsCommon.fontStyleCache(style, color),
            height: 40,
            width: 40,
            x: width / 2,
            y: height - 100,
            interactive: true,
            pointerdown: this.back
          }, context, this.dispatchAction);
        }
      }

      setId(id) {
        this.root['@@HIT_AREA'].id = id;
      }

      destroy() {
        var _a;

        this.dispatch = null;
        (_a = this.backButton) === null || _a === void 0 ? void 0 : _a.destroy();
        this.verticalGrid.destroy();
        this.xAxis.destroy();
        this.xCrosshair.destroy();
        this.pads.forEach(p => p.destroy());
        this.pads.clear();
        this.stage.removeChild(this.root);
        this.root.destroy();
      }

    }

    class EverChartStage extends hd_componentsMultiApp.ComponentStage {
      constructor() {
        super(...arguments);
        this.apps = new Map();
      }

      setState(state, context, dispatch) {
        var _a;

        const s = state.apps.everChart;

        if (!s) {
          return;
        }

        const charts = Object.entries(s);
        const keys = new Set();

        for (const [id] of charts) {
          const appState = (_a = state.apps.everChart) === null || _a === void 0 ? void 0 : _a[id];

          if (appState.containerState !== hd_componentsMultiApp.EEmbeddableAppState.initialized) {
            continue;
          }

          if (!this.apps.has(id)) {
            this.apps.set(id, new EverChartAppStage(this.stage));
          }

          keys.add(id);
          const app = this.apps.get(id);
          app.setId(id);
          app.setState(appState, context, dispatch);
        }

        this.apps.forEach((app, key) => {
          if (!keys.has(key)) {
            app.destroy();
            this.apps.delete(key);
          }
        });
      }

      destroy() {
        this.apps.forEach(app => app.destroy());
        this.apps.clear();
      }

    }

    class EverChartEmbeddableKernel extends hd_componentsMultiApp.AbstractEmbeddableKernel {
      constructor(params = everChartParameters) {
        super(params);
      }

      getApp() {
        return EverChartStage;
      }

      getAppType() {
        return 'everChart';
      }

      createReducerAndEpic(container, position, appId) {
        return __awaiter(this, void 0, void 0, function* () {
          const initialState = yield createEverChartInitialState(container, position, appId);
          const reducer = everChartReducer(initialState); // TODO:

          const epic = createEverChartEpic(container);
          yield container.get('resourceLoader').loadAll();
          return {
            epic,
            reducer
          };
        });
      }

    }

    exports.DEFAULT_INTERVAL_GAP = DEFAULT_INTERVAL_GAP;
    exports.EverChartEmbeddableKernel = EverChartEmbeddableKernel;
    exports.ZOOM = ZOOM;
    exports.bringingZoomToInterval = bringingZoomToInterval;
    exports.everChartChangeConfigurationAction = everChartChangeConfigurationAction;
    exports.everChartChangeViewportAction = everChartChangeViewportAction;
    exports.everChartChangeWindowTimeBorders = everChartChangeWindowTimeBorders;
    exports.everChartCrosshairAction = everChartCrosshairAction;
    exports.everChartDataAction = everChartDataAction;
    exports.everChartExtremumAction = everChartExtremumAction;
    exports.everChartHistoryDataAction = everChartHistoryDataAction;
    exports.everChartLastTimeAction = everChartLastTimeAction;
    exports.everChartLastTimeStubAction = everChartLastTimeStubAction;
    exports.everChartNewConfigurationAction = everChartNewConfigurationAction;
    exports.everChartNewIntervalAction = everChartNewIntervalAction;
    exports.everChartParameters = everChartParameters;
    exports.everChartPointerMoveAction = everChartPointerMoveAction;
    exports.everChartPointerOutAction = everChartPointerOutAction;
    exports.everChartPointerOverAction = everChartPointerOverAction;
    exports.everChartRequestHistoryAction = everChartRequestHistoryAction;
    exports.everChartScrollToTimeAction = everChartScrollToTimeAction;
    exports.everChartTickAction = everChartTickAction;
    exports.everChartZoomAction = everChartZoomAction;
    exports.fromZoom = fromZoom;
    exports.getClosestIntervalValue = getClosestIntervalValue;
    exports.intervalToZoom = intervalToZoom;
    exports.toZoom = toZoom;
    exports.zoomToInterval = zoomToInterval;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
