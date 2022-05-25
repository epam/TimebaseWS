(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react/jsx-runtime'), require('@deltix/hd.components-common'), require('@deltix/hd.components-multi-app'), require('@deltix/hd.components-order-book'), require('@deltix/hd.components-utils'), require('@inlet/react-pixi'), require('ramda'), require('react'), require('react-redux'), require('reselect'), require('@deltix/decimal-utils'), require('@deltix/hd.components-order-grid-common'), require('big.js'), require('fast-deep-equal'), require('pixi.js'), require('rxjs'), require('rxjs/operators'), require('@deltix/logger'), require('redux-observable')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react/jsx-runtime', '@deltix/hd.components-common', '@deltix/hd.components-multi-app', '@deltix/hd.components-order-book', '@deltix/hd.components-utils', '@inlet/react-pixi', 'ramda', 'react', 'react-redux', 'reselect', '@deltix/decimal-utils', '@deltix/hd.components-order-grid-common', 'big.js', 'fast-deep-equal', 'pixi.js', 'rxjs', 'rxjs/operators', '@deltix/logger', 'redux-observable'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.OrderGrid = {}, global.jsxRuntime, global.hd_componentsCommon, global.hd_componentsMultiApp, global.hd_componentsOrderBook, global.hd_componentsUtils, global.reactPixi, global.R, global.React, global.reactRedux, global.reselect, global.decimalUtils, global.hd_componentsOrderGridCommon, global.Big, global.deepEqual, global.PIXI, global.rxjs, global.operators, global.logger, global.reduxObservable));
})(this, (function (exports, jsxRuntime, hd_componentsCommon, hd_componentsMultiApp, hd_componentsOrderBook, hd_componentsUtils, reactPixi, R, React, reactRedux, reselect, decimalUtils, hd_componentsOrderGridCommon, Big, deepEqual, PIXI, rxjs, operators, logger, reduxObservable) { 'use strict';

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
  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
  var React__namespace = /*#__PURE__*/_interopNamespace(React);
  var Big__default = /*#__PURE__*/_interopDefaultLegacy(Big);
  var deepEqual__default = /*#__PURE__*/_interopDefaultLegacy(deepEqual);
  var PIXI__namespace = /*#__PURE__*/_interopNamespace(PIXI);

  const formatFunctionsSelector = state => state.app.formatFunctions;
  const showCumulativeQuantitySelector = state => state.app.aggregatingPrice;
  const gridSideSelector = side => state => state.app[side];
  const viewTypeSelector = state => state.app.parameters.splitView;
  const viewTypeInverseSelector = state => state.app.parameters.inverseSplitView;
  const abbreviationsSelector = state => state.app.parameters.abbreviations;

  const Hint = /*#__PURE__*/React__default["default"].memo(({
    hintHeight,
    hintText,
    hintWidth,
    hintX,
    hintY
  }) => {
    const [alpha, setAlpha] = React__default["default"].useState(0);
    const showTween = hd_componentsMultiApp.useTween(tween => {
      tween.duration(400).setEasing(hd_componentsMultiApp.Ease.inOutCubic).onUpdate(setAlpha).onComplete(() => setAlpha(1));
    });
    const timer = React__default["default"].useRef();
    React__default["default"].useEffect(() => {
      clearTimeout(timer.current);

      if (hintText) {
        timer.current = setTimeout(() => {
          if (hintText) {
            showTween.start();
          }
        }, 500);
      } else {
        showTween === null || showTween === void 0 ? void 0 : showTween.reset();
        setAlpha(0);
      }

      return () => {
        clearTimeout(timer.current);
      };
    }, [hintText]);

    if (!hintText) {
      return null;
    }

    return jsxRuntime.jsxs(reactPixi.Container, Object.assign({
      x: hintX,
      y: hintY,
      interactive: false,
      zIndex: 1,
      alpha: alpha
    }, {
      children: [jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
        width: hintWidth,
        height: hintHeight,
        color: 0x000,
        alpha: 1
      }, void 0), jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
        width: hintWidth,
        height: hintHeight,
        vertical: 'middle',
        horizontal: 'center',
        text: hintText,
        style: hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, 0xffffff)
      }, void 0)]
    }), void 0);
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

  const orderGridParameters = {
    default: {
      // name of extension
      resource: {
        resources: [...hd_componentsCommon.commonFonts]
      }
    }
  };
  const MARKET_PRICE_USER_EXCHANGE = [0.3, 0.2, 0.3, 0.2];
  const CUMULATIVE_MARKET_PRICE_USER = [0.25, 0.25, 0.25, 0.25];
  const MARKET_PRICE_USER = [0.4, 0.3, 0.3];
  const SPLITTED_VIEW = [0.2, 0.45, 0.35];
  const SPLITTED_VIEW_QTY = [0.3, 0.3, 0.4];
  const SPLITTED_VIEW_PRICE = [0.35, 0.35, 0.3];

  const getCumulativeQuantityWidth$1 = showCumulativeQuantity => showCumulativeQuantity ? CUMULATIVE_MARKET_PRICE_USER[0] : 0;
  const getMarketQuantityWidth = (showCumulativeQuantity, showUserQuantity, showExchange) => {
    if (showUserQuantity && showExchange) {
      return MARKET_PRICE_USER_EXCHANGE[0];
    }

    if (showCumulativeQuantity) {
      return CUMULATIVE_MARKET_PRICE_USER[1];
    } // if (showUserQuantity) {
    //   return MARKET_PRICE_USER[1];
    // }


    return MARKET_PRICE_USER[0];
  };
  const getPriceWidth$1 = (showCumulativeQuantity, showUserQuantity, showExchange) => {
    if (showUserQuantity && showExchange) {
      return MARKET_PRICE_USER_EXCHANGE[1];
    }

    if (showCumulativeQuantity && showUserQuantity) {
      return CUMULATIVE_MARKET_PRICE_USER[2];
    } // if (showUserQuantity) {
    //   return MARKET_PRICE_USER[1];
    // }


    return MARKET_PRICE_USER[1];
  };
  const getUserQuantityWidth = (showCumulativeQuantity, showUserQuantity, showExchange) => {
    if (!showUserQuantity) {
      return 0;
    }

    if (showCumulativeQuantity) {
      return CUMULATIVE_MARKET_PRICE_USER[3];
    }

    if (showExchange) {
      return MARKET_PRICE_USER_EXCHANGE[2];
    }

    return MARKET_PRICE_USER[2];
  };
  const getExchangeWidth = showExchangeId => showExchangeId ? MARKET_PRICE_USER_EXCHANGE[3] : 0;
  const getWorstPriceWith = (showCumulativeQuantity, showUserQuantity) => !showCumulativeQuantity && !showUserQuantity ? MARKET_PRICE_USER[2] : 0;

  const setRectangleDimensions = (rect, width, height) => {
    rect.width = width;
    rect.height = height;
  };

  const Container$1 = reactPixi.Container; // TODO: fix typing buf with containsPoint

  const mapStateToProps$2 = state => ({
    formatPrice: state.app.formatFunctions.price,
    formatQuantity: state.app.formatFunctions.quantity,
    highlightOrders: state.app.highlightOrders,
    aggregatingQuantity: state.app.aggregatingQuantity,
    showCumulativeQuantity: state.app.aggregatingPrice,
    showExchange: state.app.showExchange,
    showUserQuantity: !state.app.aggregatingQuantity,
    userOrdersMap: state.app.userOrdersMap
  });

  let OrderLineComp = class OrderLineComp extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.state = {
        hovered: false,
        grow: false,
        id: undefined,
        price: undefined,
        cumulativeQuantity: undefined,
        quantity: undefined,
        next: undefined,
        worstPrice: undefined
      };
      this.orderLineHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.cumulativeQuantityHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.marketQuantityHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.priceHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.exchangeHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.worstPriceHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.hideTween = this.props.createTween().duration(400).setEasing(hd_componentsMultiApp.Ease.inOutCubic).reverse().onUpdate(v => {
        this.rootRef.current.alpha = v;
      }).onComplete(() => {
        this.rootRef.current.alpha = 1;
        this.setState(Object.assign(Object.assign({}, this.state.next), {
          next: undefined
        }));
      });
      this.growTween = this.props.createTween().duration(400).onUpdate(v => {
        const {
          height,
          width,
          showCumulativeQuantity,
          showUserQuantity,
          showExchange
        } = this.props;
        this.growRef.current.visible = true;
        const blockWidth = width * getMarketQuantityWidth(showCumulativeQuantity, showUserQuantity, showExchange);
        this.growRef.current.clear().beginFill(this.props.color, v / 3).drawRect(0, 0, blockWidth, height);
      }).onComplete(() => {
        this.growRef.current.clear().visible = false;
        this.setState({
          grow: false
        });
      });
      this.growRef = /*#__PURE__*/React__namespace.createRef();
      this.rootRef = /*#__PURE__*/React__namespace.createRef();

      this.onSelectedExchange = () => this.props.onSelect(this.props.price, this.props.quantity, this.props.exchange, hd_componentsOrderBook.ELineType.exchange);

      this.onSelectedPrice = () => this.props.onSelect(this.props.price, this.props.quantity, this.props.exchange, hd_componentsOrderBook.ELineType.price);

      this.onSelectedQuantity = () => this.props.onSelect(this.props.price, this.props.quantity, this.props.exchange, hd_componentsOrderBook.ELineType.quantity);

      this.onSelectedWorstPrice = () => this.props.onSelect(this.props.worstPrice, this.props.quantity, this.props.exchange, hd_componentsOrderBook.ELineType.worst_price);

      this.toggleHover = () => {
        const next = !this.state.hovered;
        this.setState({
          hovered: next
        });

        if (next && !this.props.aggregatingQuantity) {
          this.props.onHover(this.props.price);
        }
      };

      this.showHint = event => {
        const container = event.target;
        const qty = this.props.showCumulativeQuantity ? this.props.cumulativeQuantity : this.props.quantity;
        const hintText = qty.toString();
        const hintWidth = hintText.length * 9.8;
        const hintHeight = this.props.height;
        const hintY = (this.props.side === hd_componentsOrderBook.L2MessageSide.sell ? this.props.index : this.props.index + 1) * this.props.height;
        this.setState(state => Object.assign(Object.assign({}, state), {
          hintText,
          hintHeight,
          hintWidth,
          hintContainerX: container.x,
          hintY
        }), () => {
          this.props.showHint(hintText, container.x + this.qtyContainerWidth() - hintWidth, hintY, hintWidth, hintHeight);
        });
      };

      this.qtyContainerWidth = () => (this.props.showCumulativeQuantity ? this.cumulativeQuantityHitArea : this.marketQuantityHitArea).width;

      this.hideHint = () => {
        this.setState(state => Object.assign(Object.assign({}, state), {
          hintText: void 0
        }));
        this.props.hideHint();
      };

      this.containsPoint = ({
        x,
        y
      }) => {
        return this.orderLineHitArea.contains(x, y);
      };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      if (prevState.price === undefined) {
        return Object.assign(Object.assign({}, prevState), {
          id: nextProps.id,
          price: nextProps.price,
          quantity: nextProps.quantity,
          cumulativeQuantity: nextProps.cumulativeQuantity,
          worstPrice: nextProps.worstPrice
        });
      } // price changed should run remove animation


      if (nextProps.deleted.includes(prevState.id)) {
        if (nextProps.price.eq(prevState.price)) ;

        return Object.assign(Object.assign({}, prevState), {
          grow: false,
          next: {
            id: nextProps.id,
            price: nextProps.price,
            quantity: nextProps.quantity,
            cumulativeQuantity: nextProps.cumulativeQuantity,
            worstPrice: nextProps.worstPrice
          }
        });
      }

      if (decimalUtils.equalDecimal(prevState.price, nextProps.price) && decimalUtils.equalDecimal(prevState.quantity, nextProps.quantity) && decimalUtils.equalDecimal(nextProps.cumulativeQuantity, prevState.cumulativeQuantity) && decimalUtils.equalDecimal(nextProps.worstPrice, prevState.worstPrice)) {
        return prevState;
      }

      return Object.assign(Object.assign({}, prevState), {
        id: nextProps.id,
        price: nextProps.price,
        quantity: nextProps.quantity,
        cumulativeQuantity: nextProps.cumulativeQuantity,
        worstPrice: nextProps.worstPrice,
        grow: !decimalUtils.equalDecimal(nextProps.quantity, prevState.quantity) && decimalUtils.equalDecimal(nextProps.price, prevState.price)
      });
    }

    shouldComponentUpdate(props, state) {
      return !deepEqual__default["default"](this.props, props) || !deepEqual__default["default"](this.state, state);
    }

    render() {
      const {
        price,
        quantity,
        cumulativeQuantity,
        next,
        hovered,
        worstPrice
      } = this.state;
      const {
        id,
        height,
        width,
        side,
        highlightOrders,
        quantityPrecision,
        pricePrecision,
        showUserQuantity,
        showExchange,
        formatPrice,
        formatQuantity,
        showCumulativeQuantity,
        abbreviations
      } = this.props;
      const {
        cumulativeQuantityWidth,
        marketQuantityWidth,
        priceWidth,
        userQuantityWidth,
        exchangeWidth,
        worstPriceWidth
      } = this.getBlockSizes();
      setRectangleDimensions(this.orderLineHitArea, width, height);
      setRectangleDimensions(this.cumulativeQuantityHitArea, cumulativeQuantityWidth, height);
      setRectangleDimensions(this.marketQuantityHitArea, marketQuantityWidth, height);
      setRectangleDimensions(this.priceHitArea, priceWidth, height);
      setRectangleDimensions(this.exchangeHitArea, exchangeWidth, height);
      setRectangleDimensions(this.worstPriceHitArea, worstPriceWidth, height);
      const highlighted = this.props.aggregatingQuantity ? hovered : id === highlightOrders[side];
      return jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
        children: ({
          orderGrid: {
            quantity: quantityColor,
            hovered: hoveredColor,
            highlighted: highlightedColor,
            price: priceColors,
            exchange
          }
        }) => {
          const priceStyle = hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, priceColors[side].color);
          const ceilPartStyle = hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, quantityColor[side].ceilPart.color);
          const zeroPartStyle = hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, quantityColor[side].zeroPart.color);
          const decimalPartStyle = hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, quantityColor[side].decimalPart.color);
          return jsxRuntime.jsxs(Container$1, Object.assign({
            ref: this.rootRef,
            pointerover: this.toggleHover,
            pointerout: this.toggleHover,
            interactive: true,
            // hitArea={this.orderLineHitArea}
            containsPoint: this.containsPoint
          }, {
            children: [!highlighted && next !== undefined && jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
              width: width,
              height: height,
              color: hoveredColor.color,
              alpha: hoveredColor.alpha
            }, void 0), highlighted && jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
              width: width,
              height: height,
              color: highlightedColor.color,
              alpha: highlightedColor.alpha
            }, void 0), showCumulativeQuantity && jsxRuntime.jsx(Container$1, Object.assign({
              x: 0,
              interactive: true,
              hitArea: this.cumulativeQuantityHitArea,
              buttonMode: true,
              pointertap: this.onSelectedQuantity,
              pointerover: this.showHint,
              pointerout: this.hideHint
            }, {
              children: jsxRuntime.jsx(hd_componentsMultiApp.MarketQuantity, {
                formatQuantity: formatQuantity,
                quantity: cumulativeQuantity,
                height: height,
                width: cumulativeQuantityWidth,
                precision: quantityPrecision,
                ceilPartStyle: ceilPartStyle,
                zeroPartStyle: zeroPartStyle,
                decimalPartStyle: decimalPartStyle,
                abbreviations: abbreviations
              }, void 0)
            }), void 0), jsxRuntime.jsxs(Container$1, Object.assign({
              x: cumulativeQuantityWidth,
              interactive: true,
              hitArea: this.marketQuantityHitArea,
              buttonMode: true,
              pointertap: this.onSelectedQuantity,
              pointerover: this.showHint,
              pointerout: this.hideHint
            }, {
              children: [jsxRuntime.jsx(reactPixi.Graphics, {
                ref: this.growRef
              }, void 0), jsxRuntime.jsx(hd_componentsMultiApp.MarketQuantity, {
                formatQuantity: formatQuantity,
                quantity: quantity,
                height: height,
                width: marketQuantityWidth,
                precision: quantityPrecision,
                ceilPartStyle: ceilPartStyle,
                zeroPartStyle: zeroPartStyle,
                decimalPartStyle: decimalPartStyle,
                abbreviations: abbreviations
              }, void 0)]
            }), void 0), jsxRuntime.jsx(Container$1, Object.assign({
              x: cumulativeQuantityWidth + marketQuantityWidth,
              interactive: true,
              buttonMode: true,
              hitArea: this.priceHitArea,
              pointertap: this.onSelectedPrice
            }, {
              children: jsxRuntime.jsx(hd_componentsMultiApp.Price, {
                formatPrice: formatPrice,
                price: price,
                height: height,
                width: priceWidth,
                style: priceStyle,
                decimalPart: pricePrecision
              }, void 0)
            }), void 0), worstPriceWidth > 0 && jsxRuntime.jsx(Container$1, Object.assign({
              x: cumulativeQuantityWidth + marketQuantityWidth + priceWidth,
              interactive: true,
              buttonMode: true,
              hitArea: this.worstPriceHitArea,
              pointertap: this.onSelectedWorstPrice
            }, {
              children: jsxRuntime.jsx(hd_componentsMultiApp.Price, {
                formatPrice: formatPrice,
                price: worstPrice,
                height: height,
                width: worstPriceWidth,
                style: priceStyle,
                decimalPart: pricePrecision
              }, void 0)
            }), void 0), showUserQuantity && jsxRuntime.jsx(Container$1, Object.assign({
              x: cumulativeQuantityWidth + marketQuantityWidth + priceWidth
            }, {
              children: this.renderMyQuantity(userQuantityWidth, id)
            }), void 0), showExchange && !showCumulativeQuantity && worstPriceWidth === 0 && jsxRuntime.jsx(Container$1, Object.assign({
              x: cumulativeQuantityWidth + marketQuantityWidth + priceWidth + userQuantityWidth,
              interactive: true,
              buttonMode: true,
              hitArea: this.exchangeHitArea,
              pointertap: this.onSelectedExchange
            }, {
              children: jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
                width: exchangeWidth,
                height: height,
                horizontal: this.props.exchange ? 'right' : 'center',
                vertical: 'middle',
                text: this.props.exchange || '-',
                style: hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, exchange.color)
              }, void 0)
            }), void 0)]
          }), void 0);
        }
      }, void 0);
    }

    componentDidUpdate() {
      if (this.state.hovered) {
        // FIXME dispatch only if new price and previous are different
        this.props.onHover(this.props.price);

        if (this.state.hintText) {
          const qty = this.props.showCumulativeQuantity ? this.props.cumulativeQuantity : this.props.quantity;
          const hintText = qty.toString();
          const hintWidth = hintText.length * 9.8;
          this.props.showHint(hintText, this.state.hintContainerX + this.qtyContainerWidth() - hintWidth, this.state.hintY, hintWidth, this.props.height);
        }
      }

      if (this.state.grow) {
        this.growTween.start();
      }

      if (this.state.next) {
        this.hideTween.start();
      }
    }

    getBlockSizes() {
      const {
        width,
        showCumulativeQuantity,
        showUserQuantity,
        showExchange
      } = this.props;
      const cumulativeQuantityWidth = width * getCumulativeQuantityWidth$1(showCumulativeQuantity);
      const marketQuantityWidth = width * getMarketQuantityWidth(showCumulativeQuantity, showUserQuantity, showExchange);
      const priceWidth = width * getPriceWidth$1(showCumulativeQuantity, showUserQuantity, showExchange);
      const userQuantityWidth = width * getUserQuantityWidth(showCumulativeQuantity, showUserQuantity, showExchange);
      const exchangeWidth = width * getExchangeWidth(showExchange);
      const worstPriceWidth = width * getWorstPriceWith(showCumulativeQuantity, showUserQuantity);
      return {
        cumulativeQuantityWidth,
        marketQuantityWidth,
        priceWidth,
        userQuantityWidth,
        exchangeWidth,
        worstPriceWidth
      };
    }

    renderMyQuantity(width, id) {
      var _a;

      const {
        height,
        userOrdersMap,
        formatQuantity,
        quantityPrecision,
        side,
        abbreviations
      } = this.props;
      const userQuantity = (_a = userOrdersMap[this.props.side][id]) !== null && _a !== void 0 ? _a : decimalUtils.ZERO;
      return jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
        children: ({
          orderGrid: {
            quantity: quantityColor,
            price: priceColors
          }
        }) => userQuantity.eq(decimalUtils.ZERO) ? jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
          width: width,
          height: height,
          horizontal: 'center',
          vertical: 'middle',
          text: '-',
          style: hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, priceColors[side].color)
        }, void 0) : jsxRuntime.jsx(hd_componentsMultiApp.MarketQuantity, {
          formatQuantity: formatQuantity,
          quantity: userQuantity,
          height: height,
          width: width,
          precision: quantityPrecision,
          limitPrecision: true,
          ceilPartStyle: hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, quantityColor[side].ceilPart.color),
          zeroPartStyle: hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, quantityColor[side].zeroPart.color),
          decimalPartStyle: hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, quantityColor[side].decimalPart.color),
          abbreviations: abbreviations
        }, void 0)
      }, void 0);
    }

  };
  OrderLineComp = __decorate([hd_componentsMultiApp.WithTween(), hd_componentsMultiApp.Pure()], OrderLineComp);
  const OrderLine = reactRedux.connect(mapStateToProps$2)(OrderLineComp);

  const Side = /*#__PURE__*/React__namespace.memo(({
    side,
    lineWidth,
    quantityPrecision,
    pricePrecision,
    countLines,
    lineHeight,
    sideHeight,
    showHint,
    hideHint,
    abbreviations
  }) => {
    const dispatch = reactRedux.useDispatch();
    const gridSide = reactRedux.useSelector(gridSideSelector(side));
    const onHover = React__namespace.useCallback(price => dispatch(hd_componentsOrderGridCommon.orderHoveredAction(side, {
      price
    })), // eslint-disable-next-line react-hooks/exhaustive-deps
    []);
    const onSelect = React__namespace.useCallback((price, quantity, exchange, type) => dispatch(hd_componentsOrderBook.lineSelectedAction(Big__default["default"](price), Big__default["default"](quantity), exchange, side, type)), // eslint-disable-next-line react-hooks/exhaustive-deps
    []);
    const onShowHint = React__namespace.useCallback((hintText, hintX, hintY, hintWidth, hintHeight) => {
      const y = side === hd_componentsOrderBook.L2MessageSide.sell ? sideHeight - hintY : sideHeight + hintY;
      showHint(hintText, hintX, y, hintWidth, hintHeight, side);
    }, [showHint, sideHeight, side]);
    const gridOrders = gridSide.orders;

    if (gridOrders.length === 0) {
      return null;
    }

    const deleted = gridSide.deleted;
    const sliced = gridOrders.slice(0, countLines);
    let currentCumulativeQuantity = decimalUtils.ZERO;
    return jsxRuntime.jsx(jsxRuntime.Fragment, {
      children: sliced.map(({
        id,
        price,
        quantity,
        exchange,
        worstPrice
      }, index) => {
        let cumulativeQuantity = decimalUtils.ZERO;
        cumulativeQuantity = currentCumulativeQuantity.add(quantity);
        currentCumulativeQuantity = currentCumulativeQuantity.add(quantity);
        return jsxRuntime.jsx(reactPixi.Container, Object.assign({
          y: side === hd_componentsOrderBook.L2MessageSide.sell ? sideHeight - index * lineHeight : index * lineHeight
        }, {
          children: jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
            children: ({
              orderGrid: {
                price: priceColors
              }
            }) => jsxRuntime.jsx(OrderLine, {
              id: id,
              color: priceColors[side].color,
              width: lineWidth,
              height: lineHeight,
              onSelect: onSelect,
              onHover: onHover,
              side: side,
              quantityPrecision: quantityPrecision,
              pricePrecision: pricePrecision,
              cumulativeQuantity: cumulativeQuantity,
              price: price,
              quantity: quantity,
              deleted: deleted,
              exchange: exchange,
              worstPrice: worstPrice,
              abbreviations: abbreviations,
              showHint: onShowHint,
              hideHint: hideHint,
              index: index
            }, void 0)
          }, void 0)
        }), index);
      })
    }, void 0);
  });

  const Container = reactPixi.Container; // TODO: fix typing buf with containsPoint

  const getQuantityWidth = (showCumulativeQuantity, showUserQuantity) => {
    if (showCumulativeQuantity) {
      return SPLITTED_VIEW_PRICE[1];
    }

    return showUserQuantity ? SPLITTED_VIEW[1] : SPLITTED_VIEW_QTY[2];
  };

  const getPriceWidth = (showCumulativeQuantity, showUserQuantity) => {
    if (showCumulativeQuantity) {
      return SPLITTED_VIEW_PRICE[2];
    }

    return showUserQuantity ? SPLITTED_VIEW[2] : SPLITTED_VIEW_QTY[1];
  };

  const getWorstPriceWidth = (showCumulativeQuantity, showUserQuantity) => {
    return showCumulativeQuantity || showUserQuantity ? 0 : SPLITTED_VIEW_QTY[0];
  };

  const getCumulativeQuantityWidth = (showCumulativeQuantity, showUserQuantity) => showCumulativeQuantity ? SPLITTED_VIEW_PRICE[0] : 0;

  const mapStateToProps$1 = state => ({
    formatPrice: state.app.formatFunctions.price,
    formatQuantity: state.app.formatFunctions.quantity,
    highlightOrders: state.app.highlightOrders,
    aggregatingQuantity: state.app.aggregatingQuantity,
    showCumulativeQuantity: state.app.aggregatingPrice,
    showExchange: state.app.showExchange,
    showUserQuantity: !state.app.aggregatingQuantity,
    userOrdersMap: state.app.userOrdersMap
  });

  let SplittedOrderLineComp = class SplittedOrderLineComp extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.state = {
        hovered: false,
        grow: false,
        id: undefined,
        price: undefined,
        cumulativeQuantity: undefined,
        quantity: undefined,
        next: undefined,
        worstPrice: undefined
      };
      this.orderLineHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.marketQuantityHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.cumulativeQuantityHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.priceHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.orderCountHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.worstPriceHitArea = new PIXI__namespace.Rectangle(0, 0, 0, 0);
      this.hideTween = this.props.createTween().duration(400).setEasing(hd_componentsMultiApp.Ease.inOutCubic).reverse().onUpdate(v => {
        this.rootRef.current.alpha = v;
      }).onComplete(() => {
        this.rootRef.current.alpha = 1;
        this.setState(Object.assign(Object.assign({}, this.state.next), {
          next: undefined
        }));
      });
      this.growTween = this.props.createTween().duration(400).onUpdate(v => {
        const {
          height,
          width,
          showCumulativeQuantity,
          showUserQuantity
        } = this.props;
        this.growRef.current.visible = true;
        const blockWidth = width * getQuantityWidth(showCumulativeQuantity, showUserQuantity);
        this.growRef.current.clear().beginFill(this.props.color, v / 3).drawRect(0, 0, blockWidth, height);
      }).onComplete(() => {
        this.growRef.current.clear().visible = false;
        this.setState({
          grow: false
        });
      });
      this.growRef = /*#__PURE__*/React__namespace.createRef();
      this.rootRef = /*#__PURE__*/React__namespace.createRef();

      this.renderNumberOfOrders = (xOffset, width, height, priceStyle) => {
        return jsxRuntime.jsx(Container, Object.assign({
          x: xOffset,
          interactive: true,
          hitArea: this.orderCountHitArea,
          buttonMode: true,
          pointertap: this.onSelectedQuantity
        }, {
          children: jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
            width: width,
            height: height,
            horizontal: 'center',
            vertical: 'middle',
            text: this.props.orderCount == null ? '' : this.props.orderCount + '',
            style: priceStyle
          }, void 0)
        }), void 0);
      };

      this.renderPrice = (xOffset, width, height, priceStyle, align) => {
        return jsxRuntime.jsx(Container, Object.assign({
          x: xOffset,
          interactive: true,
          buttonMode: true,
          hitArea: this.priceHitArea,
          pointertap: this.onSelectedPrice
        }, {
          children: jsxRuntime.jsx(hd_componentsMultiApp.Price, {
            formatPrice: this.props.formatPrice,
            price: this.props.price,
            height: height,
            align: align,
            width: width,
            style: priceStyle,
            decimalPart: this.props.pricePrecision
          }, void 0)
        }), void 0);
      };

      this.renderCumulativeQty = (xOffset, width, height, ceilPartStyle, zeroPartStyle, decimalPartStyle, align) => {
        return jsxRuntime.jsx(Container, Object.assign({
          x: xOffset,
          interactive: true,
          hitArea: this.cumulativeQuantityHitArea,
          buttonMode: true,
          pointertap: this.onSelectedQuantity,
          pointerover: this.showHint,
          pointerout: this.hideHint
        }, {
          children: jsxRuntime.jsx(hd_componentsMultiApp.MarketQuantity, {
            formatQuantity: this.props.formatQuantity,
            quantity: this.props.cumulativeQuantity,
            height: height,
            width: width,
            precision: this.props.quantityPrecision,
            ceilPartStyle: ceilPartStyle,
            zeroPartStyle: zeroPartStyle,
            decimalPartStyle: decimalPartStyle,
            align: align,
            abbreviations: this.props.abbreviations
          }, void 0)
        }), void 0);
      };

      this.renderWorstPrice = (xOffset, width, height, priceStyle, align) => {
        return jsxRuntime.jsx(Container, Object.assign({
          x: xOffset,
          interactive: true,
          buttonMode: true,
          hitArea: this.worstPriceHitArea,
          pointertap: this.onSelectedWorstPrice
        }, {
          children: jsxRuntime.jsx(hd_componentsMultiApp.Price, {
            formatPrice: this.props.formatPrice,
            price: this.props.worstPrice,
            height: height,
            align: align,
            width: width,
            style: priceStyle,
            decimalPart: this.props.pricePrecision
          }, void 0)
        }), void 0);
      };

      this.onSelectedPrice = () => this.props.onSelect(this.props.price, this.props.quantity, this.props.exchange, hd_componentsOrderBook.ELineType.price);

      this.onSelectedQuantity = () => this.props.onSelect(this.props.price, this.props.quantity, this.props.exchange, hd_componentsOrderBook.ELineType.quantity);

      this.onSelectedWorstPrice = () => this.props.onSelect(this.props.worstPrice, this.props.quantity, this.props.exchange, hd_componentsOrderBook.ELineType.worst_price);

      this.toggleHover = () => {
        const next = !this.state.hovered;
        this.setState({
          hovered: next
        });

        if (next && !this.props.aggregatingQuantity) {
          this.props.onHover(this.props.price);
        }
      };

      this.showHint = event => {
        const container = event.target;
        const qty = this.props.showCumulativeQuantity ? this.props.cumulativeQuantity : this.props.quantity;
        const hintText = qty.toString();
        const hintWidth = hintText.length * 9.8;
        const hintHeight = this.props.height;
        const hintY = (this.props.side === hd_componentsOrderBook.L2MessageSide.sell ? this.props.index : this.props.index + 1) * this.props.height;
        this.setState(state => Object.assign(Object.assign({}, state), {
          hintText,
          hintHeight,
          hintWidth,
          hintContainerX: container.x,
          hintY
        }), () => {
          this.props.showHint(hintText, container.x + this.qtyContainerWidth() - hintWidth, hintY, hintWidth, hintHeight);
        });
      };

      this.qtyContainerWidth = () => (this.props.showCumulativeQuantity ? this.cumulativeQuantityHitArea : this.marketQuantityHitArea).width;

      this.hideHint = () => {
        this.setState(state => Object.assign(Object.assign({}, state), {
          hintText: void 0
        }));
        this.props.hideHint();
      };

      this.containsPoint = ({
        x,
        y
      }) => {
        return this.orderLineHitArea.contains(x, y);
      };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      if (prevState.price === undefined) {
        return Object.assign(Object.assign({}, prevState), {
          id: nextProps.id,
          price: nextProps.price,
          quantity: nextProps.quantity,
          cumulativeQuantity: nextProps.cumulativeQuantity,
          worstPrice: nextProps.worstPrice
        });
      } // price changed should run remove animation


      if (nextProps.deleted.includes(prevState.id)) {
        if (decimalUtils.equalDecimal(nextProps.price, prevState.price)) ;

        return Object.assign(Object.assign({}, prevState), {
          grow: false,
          next: {
            id: nextProps.id,
            price: nextProps.price,
            quantity: nextProps.quantity,
            cumulativeQuantity: nextProps.cumulativeQuantity,
            worstPrice: nextProps.worstPrice
          }
        });
      }

      if (decimalUtils.equalDecimal(prevState.price, nextProps.price) && decimalUtils.equalDecimal(prevState.quantity, nextProps.quantity) && decimalUtils.equalDecimal(nextProps.cumulativeQuantity, prevState.cumulativeQuantity)) {
        return prevState;
      }

      return Object.assign(Object.assign({}, prevState), {
        id: nextProps.id,
        price: nextProps.price,
        quantity: nextProps.quantity,
        cumulativeQuantity: nextProps.cumulativeQuantity,
        grow: !decimalUtils.equalDecimal(nextProps.quantity, prevState.quantity) && decimalUtils.equalDecimal(nextProps.price, prevState.price)
      });
    }

    shouldComponentUpdate(props, state) {
      return !deepEqual__default["default"](this.props, props) || !deepEqual__default["default"](this.state, state);
    }

    render() {
      const {
        quantity,
        next,
        hovered
      } = this.state;
      const {
        id,
        height,
        width,
        side,
        highlightOrders,
        quantityPrecision,
        formatQuantity,
        showCumulativeQuantity,
        inverse,
        abbreviations
      } = this.props;
      const {
        marketQuantityWidth,
        priceWidth,
        orderCountWidth,
        worstPriceWidth,
        cumulativeQuantityWidth
      } = this.getBlockSizes();
      setRectangleDimensions(this.orderLineHitArea, width, height);
      setRectangleDimensions(this.marketQuantityHitArea, marketQuantityWidth, height);
      setRectangleDimensions(this.cumulativeQuantityHitArea, cumulativeQuantityWidth, height);
      setRectangleDimensions(this.priceHitArea, priceWidth, height);
      setRectangleDimensions(this.orderCountHitArea, orderCountWidth, height);
      setRectangleDimensions(this.worstPriceHitArea, worstPriceWidth, height);
      const highlighted = this.props.aggregatingQuantity ? hovered : id === highlightOrders[side];
      const isBuy = side === (inverse ? hd_componentsOrderBook.L2MessageSide.sell : hd_componentsOrderBook.L2MessageSide.buy);
      const xOffset = isBuy ? 0 : width / 2 + 5;
      let xNumberOffset = xOffset;
      let xPriceOffset = xOffset;
      let xQtyOffset = xOffset;
      let xCumulativeQtyOffset = xOffset;
      let xWorstPriceOffset = xOffset;

      if (showCumulativeQuantity) {
        if (isBuy) {
          xPriceOffset += cumulativeQuantityWidth + marketQuantityWidth;
          xQtyOffset += cumulativeQuantityWidth;
        } else {
          xQtyOffset += priceWidth;
          xCumulativeQtyOffset += priceWidth + marketQuantityWidth;
        }
      } else if (worstPriceWidth > 0) {
        if (isBuy) {
          xPriceOffset += worstPriceWidth;
          xQtyOffset += worstPriceWidth + priceWidth;
        } else {
          xPriceOffset += marketQuantityWidth;
          xWorstPriceOffset += marketQuantityWidth + priceWidth;
        }
      } else {
        if (isBuy) {
          xPriceOffset += orderCountWidth + marketQuantityWidth;
          xQtyOffset += orderCountWidth;
        } else {
          xQtyOffset += priceWidth;
          xNumberOffset += priceWidth + marketQuantityWidth;
        }
      }

      return jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
        children: ({
          orderGrid: {
            quantity: quantityColor,
            hovered: hoveredColor,
            highlighted: highlightedColor,
            price: priceColors
          }
        }) => {
          const priceStyle = hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, priceColors[side].color);
          const ceilPartStyle = hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, quantityColor[side].ceilPart.color);
          const zeroPartStyle = hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, quantityColor[side].zeroPart.color);
          const decimalPartStyle = hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, quantityColor[side].decimalPart.color);
          return jsxRuntime.jsxs(Container, Object.assign({
            ref: this.rootRef,
            pointerover: this.toggleHover,
            pointerout: this.toggleHover,
            interactive: true,
            // hitArea={this.orderLineHitArea}
            containsPoint: this.containsPoint
          }, {
            children: [!highlighted && next !== undefined && jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
              width: width,
              height: height,
              color: hoveredColor.color,
              alpha: hoveredColor.alpha
            }, void 0), highlighted && jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
              width: width,
              height: height,
              color: highlightedColor.color,
              alpha: highlightedColor.alpha
            }, void 0), this.renderPrice(xPriceOffset, priceWidth, height, priceStyle, 'right'), jsxRuntime.jsxs(Container, Object.assign({
              x: xQtyOffset,
              interactive: true,
              hitArea: this.marketQuantityHitArea,
              buttonMode: true,
              pointertap: this.onSelectedQuantity,
              pointerover: this.showHint,
              pointerout: this.hideHint
            }, {
              children: [jsxRuntime.jsx(reactPixi.Graphics, {
                ref: this.growRef
              }, void 0), jsxRuntime.jsx(hd_componentsMultiApp.MarketQuantity, {
                formatQuantity: formatQuantity,
                quantity: quantity,
                height: height,
                width: marketQuantityWidth,
                precision: quantityPrecision,
                // align={side === L2MessageSide.buy ? "right" : "left"}
                ceilPartStyle: ceilPartStyle,
                zeroPartStyle: zeroPartStyle,
                decimalPartStyle: decimalPartStyle,
                abbreviations: abbreviations
              }, void 0)]
            }), void 0), showCumulativeQuantity ? this.renderCumulativeQty(xCumulativeQtyOffset, cumulativeQuantityWidth, height, ceilPartStyle, zeroPartStyle, decimalPartStyle, 'right') : worstPriceWidth > 0 ? this.renderWorstPrice(xWorstPriceOffset, worstPriceWidth, height, priceStyle, 'right') : this.renderNumberOfOrders(xNumberOffset, orderCountWidth, height, priceStyle)]
          }), void 0);
        }
      }, void 0);
    }

    componentDidUpdate() {
      if (this.state.hovered) {
        // FIXME dispatch only if new price and previous are different
        this.props.onHover(this.props.price);

        if (this.state.hintText) {
          const qty = this.props.showCumulativeQuantity ? this.props.cumulativeQuantity : this.props.quantity;
          const hintText = qty.toString();
          const hintWidth = hintText.length * 9.8;
          this.props.showHint(hintText, this.state.hintContainerX + this.qtyContainerWidth() - hintWidth, this.state.hintY, hintWidth, this.props.height);
        }
      }

      if (this.state.grow) {
        this.growTween.start();
      }

      if (this.state.next) {
        this.hideTween.start();
      }
    }

    getBlockSizes() {
      const {
        width: w,
        showCumulativeQuantity,
        showUserQuantity
      } = this.props;
      const width = w / 2 - 5;
      const marketQuantityWidth = width * getQuantityWidth(showCumulativeQuantity, showUserQuantity);
      const priceWidth = width * getPriceWidth(showCumulativeQuantity, showUserQuantity);
      const orderCountWidth = width * SPLITTED_VIEW[0];
      return {
        orderCountWidth,
        marketQuantityWidth,
        priceWidth,
        worstPriceWidth: width * getWorstPriceWidth(showCumulativeQuantity, showUserQuantity),
        cumulativeQuantityWidth: width * getCumulativeQuantityWidth(showCumulativeQuantity)
      };
    }

  };
  SplittedOrderLineComp = __decorate([hd_componentsMultiApp.WithTween(), hd_componentsMultiApp.Pure()], SplittedOrderLineComp);
  const SplittedOrderLine = reactRedux.connect(mapStateToProps$1)(SplittedOrderLineComp);

  const SplittedSide = /*#__PURE__*/React__namespace.memo(({
    side,
    lineWidth,
    quantityPrecision,
    pricePrecision,
    countLines,
    lineHeight,
    sideHeight,
    abbreviations,
    showHint,
    hideHint
  }) => {
    const dispatch = reactRedux.useDispatch();
    const gridSide = reactRedux.useSelector(gridSideSelector(side));
    const inverse = reactRedux.useSelector(viewTypeInverseSelector);
    const onHover = React__namespace.useCallback(price => dispatch(hd_componentsOrderGridCommon.orderHoveredAction(side, {
      price
    })), []);
    const onSelect = React__namespace.useCallback((price, quantity, exchange, type) => dispatch(hd_componentsOrderBook.lineSelectedAction(Big__default["default"](price), Big__default["default"](quantity), exchange, side, type)), []);
    const onShowHint = React__namespace.useCallback((hintText, hintX, hintY, hintWidth, hintHeight) => {
      const y = side === hd_componentsOrderBook.L2MessageSide.sell ? sideHeight - hintY : sideHeight + hintY;
      showHint(hintText, hintX, y, hintWidth, hintHeight, side);
    }, [showHint, sideHeight, side]);
    const gridOrders = gridSide.orders;

    if (gridOrders.length === 0) {
      return null;
    }

    const deleted = gridSide.deleted;
    const sliced = gridOrders.slice(0, countLines);
    let currentCumulativeQuantity = decimalUtils.ZERO;
    return jsxRuntime.jsx(jsxRuntime.Fragment, {
      children: sliced.map(({
        id,
        price,
        quantity,
        exchange,
        orderCount,
        worstPrice
      }, index) => {
        let cumulativeQuantity = decimalUtils.ZERO;
        cumulativeQuantity = currentCumulativeQuantity.add(quantity);
        currentCumulativeQuantity = currentCumulativeQuantity.add(quantity);
        return jsxRuntime.jsx(reactPixi.Container, Object.assign({
          y: side === hd_componentsOrderBook.L2MessageSide.sell ? sideHeight - index * lineHeight : index * lineHeight
        }, {
          children: jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
            children: ({
              orderGrid: {
                price: priceColors
              }
            }) => jsxRuntime.jsx(SplittedOrderLine, {
              id: id,
              color: priceColors[side].color,
              width: lineWidth,
              height: lineHeight,
              onSelect: onSelect,
              onHover: onHover,
              side: side,
              quantityPrecision: quantityPrecision,
              pricePrecision: pricePrecision,
              cumulativeQuantity: cumulativeQuantity,
              price: price,
              quantity: quantity,
              deleted: deleted,
              exchange: exchange,
              orderCount: orderCount,
              worstPrice: worstPrice,
              inverse: inverse,
              abbreviations: abbreviations,
              showHint: onShowHint,
              hideHint: hideHint,
              index: index
            }, void 0)
          }, void 0)
        }), index);
      })
    }, void 0);
  });

  const Borders = /*#__PURE__*/React__namespace.memo(({
    width,
    height
  }) => jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
    children: ({
      orderGrid: {
        spreadLine: {
          border: {
            color,
            alpha
          }
        }
      }
    }) => jsxRuntime.jsxs(reactPixi.Container, {
      children: [jsxRuntime.jsx(reactPixi.Container, {
        children: jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
          width: width,
          color: color,
          height: 2,
          alpha: alpha
        }, void 0)
      }, void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
        y: height - 2
      }, {
        children: jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
          width: width,
          color: color,
          height: 2,
          alpha: alpha
        }, void 0)
      }), void 0)]
    }, void 0)
  }, void 0));
  const SpreadLine = /*#__PURE__*/React__namespace.memo(({
    height,
    spread,
    code,
    width,
    padding,
    showUserQuantity,
    showExchangeId,
    spreadPrecision
  }) => {
    const innerWidth = width - padding * 2;
    const {
      spread: formatSpread
    } = reactRedux.useSelector(formatFunctionsSelector);
    const showCumulativeQuantity = reactRedux.useSelector(showCumulativeQuantitySelector);
    const textPadding = innerWidth * getCumulativeQuantityWidth$1(showCumulativeQuantity);
    const textWidth = innerWidth * getMarketQuantityWidth(showCumulativeQuantity, showUserQuantity, showExchangeId);
    const spreadWidth = innerWidth * getPriceWidth$1(showCumulativeQuantity, showUserQuantity, showExchangeId);
    return jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
      children: ({
        orderGrid: {
          spreadLine: {
            background,
            text
          }
        }
      }) => {
        const style = hd_componentsCommon.fontStyleCache(hd_componentsCommon.robotoMonoRegular10, text.color);
        return jsxRuntime.jsxs(reactPixi.Container, {
          children: [jsxRuntime.jsx(hd_componentsMultiApp.Rectangle, {
            width: width,
            color: background.color,
            height: height,
            alpha: 1
          }, void 0), jsxRuntime.jsx(Borders, {
            width: width,
            height: height
          }, void 0), jsxRuntime.jsxs(reactPixi.Container, Object.assign({
            x: padding + textPadding
          }, {
            children: [jsxRuntime.jsx(hd_componentsMultiApp.AlignText, {
              text: `${code} SPREAD`,
              style: style,
              horizontal: 'right',
              vertical: 'middle',
              width: textWidth,
              height: height
            }, void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
              x: textWidth
            }, {
              children: jsxRuntime.jsx(hd_componentsMultiApp.Price, {
                formatPrice: formatSpread,
                price: spread,
                height: height,
                width: spreadWidth,
                decimalPart: spreadPrecision,
                style: style
              }, void 0)
            }), void 0)]
          }), void 0)]
        }, void 0);
      }
    }, void 0);
  });

  const padding = 5;
  const countLines = 50;
  const lineHeight = 15;
  const spreadLineHeight = 20;
  const blockHeight = countLines * lineHeight;
  const sideHeight = blockHeight - lineHeight;

  const getSpreadCenter = height => height / 2 - spreadLineHeight / 2;

  const getMaxPrecision = (field, maxWidth, maxPrecision, sellOrders, buyOrders, symbolWidth) => {
    const allOrders = [...sellOrders, ...buyOrders];

    if (allOrders.length === 0) {
      allOrders.push({
        [field]: 0.1
      });
    }

    const realPrecisions = allOrders.map(i => hd_componentsUtils.getRealPrecision(i[field], maxPrecision, symbolWidth, maxWidth));
    return Math.min(...realPrecisions);
  };

  const getSellScrollLimit = (height, sellOrdersCount) => {
    const offset = getSpreadCenter(height);
    const buyHeight = Math.min(countLines, sellOrdersCount) * lineHeight;
    const buyOverflow = Math.abs(Math.min(0, height - buyHeight));
    const buyMaxScroll = buyOverflow === 0 ? 0 : +buyOverflow;
    return buyMaxScroll + offset + (buyOverflow !== 0 ? spreadLineHeight : 0);
  };

  const getBuyScrollLimit = (height, buyOrdersCount) => {
    const offset = getSpreadCenter(height);
    const buyHeight = Math.min(countLines, buyOrdersCount) * lineHeight;
    const buyOverflow = Math.abs(Math.min(0, height - buyHeight));
    const buyMaxScroll = buyOverflow === 0 ? 0 : -buyOverflow;
    return buyMaxScroll - offset - (buyOverflow !== 0 ? spreadLineHeight : 0);
  };

  class Root extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.spreadContainer = /*#__PURE__*/React__namespace.createRef();
      this.currentScroll = 0;
      this.symbolWidth = hd_componentsMultiApp.computeSymbolWidth(hd_componentsCommon.robotoMonoRegular10);

      this.computeScroll = (direction, current) => {
        const nextScroll = hd_componentsUtils.boundaryFor(getSellScrollLimit(this.props.height, this.props.sell.orders.length), getBuyScrollLimit(this.props.height, this.props.buy.orders.length), current + 50 * direction);
        this.spreadContainer.current.y = hd_componentsUtils.boundaryFor(this.props.height - spreadLineHeight, 0, getSpreadCenter(this.props.height) + nextScroll);
        return this.currentScroll = nextScroll;
      };

      this.hideHint = () => this.setState(state => Object.assign(Object.assign({}, state), {
        hintText: void 0
      }));

      this.showHint = (hintText, hintX, hintY, hintWidth, hintHeight, side) => {
        let y = hintY + this.currentScroll + this.props.height / 2 - blockHeight + (side === hd_componentsOrderBook.L2MessageSide.buy ? spreadLineHeight / 2 : -spreadLineHeight / 2) - hintHeight;

        if (y < 0) {
          y += hintHeight * 2;
        }

        this.setState(state => Object.assign(Object.assign({}, state), {
          hintText,
          hintX: hintX + padding,
          hintY: y,
          hintWidth,
          hintHeight
        }));
      };
    }

    componentDidMount() {
      this.spreadContainer.current.y = getSpreadCenter(this.props.height);
    }

    componentDidUpdate({
      height
    }) {
      if (this.props.height === height) {
        return;
      }

      this.spreadContainer.current.y = hd_componentsUtils.boundaryFor(this.props.height - spreadLineHeight, 0, getSpreadCenter(this.props.height) + this.currentScroll);
    }

    render() {
      const {
        height,
        spread,
        width,
        termCode,
        showUserQuantity,
        showExchange,
        quantityPrecision,
        sell,
        buy,
        pricePrecision,
        splitView,
        abbreviations,
        x,
        y
      } = this.props;
      const lineWidth = width - padding * 2;
      const maxQuantityWidth = width - padding * 2 * getMarketQuantityWidth(true, showUserQuantity, showExchange);
      const maxPriceWidth = width - padding * 2 * Math.max(getPriceWidth$1(true, showUserQuantity, showExchange), getWorstPriceWith(true, showUserQuantity));
      const maxPrecisionForQuantity = getMaxPrecision('quantity', maxQuantityWidth, quantityPrecision, sell.orders, buy.orders, this.symbolWidth);
      const maxPrecisionForPrice = getMaxPrecision('price', maxPriceWidth, pricePrecision, sell.orders, buy.orders, this.symbolWidth);
      const SideComp = splitView ? SplittedSide : Side;
      return jsxRuntime.jsx(hd_componentsMultiApp.Styled, {
        children: ({
          orderGrid: {
            background
          }
        }) => {
          var _a, _b, _c, _d, _e;

          return jsxRuntime.jsxs(jsxRuntime.Fragment, {
            children: [jsxRuntime.jsx(hd_componentsMultiApp.Background, {
              width: width,
              height: height,
              color: background.color,
              alpha: 1
            }, void 0), jsxRuntime.jsx(hd_componentsMultiApp.ScrolledList, Object.assign({
              height: height,
              width: width,
              x: x,
              y: y,
              computeScroll: this.computeScroll
            }, {
              children: jsxRuntime.jsxs(reactPixi.Container, Object.assign({
                x: padding
              }, {
                children: [jsxRuntime.jsx(reactPixi.Container, Object.assign({
                  y: height / 2 - blockHeight - spreadLineHeight / 2
                }, {
                  children: jsxRuntime.jsx(SideComp, {
                    height: height,
                    scrollPosition: this.currentScroll,
                    side: hd_componentsOrderBook.L2MessageSide.sell,
                    lineWidth: lineWidth,
                    quantityPrecision: maxPrecisionForQuantity,
                    pricePrecision: maxPrecisionForPrice,
                    countLines: countLines,
                    lineHeight: lineHeight,
                    sideHeight: sideHeight,
                    abbreviations: abbreviations,
                    hideHint: this.hideHint,
                    showHint: this.showHint
                  }, void 0)
                }), void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
                  y: height / 2 + spreadLineHeight / 2
                }, {
                  children: jsxRuntime.jsx(SideComp, {
                    height: height,
                    scrollPosition: this.currentScroll,
                    side: hd_componentsOrderBook.L2MessageSide.buy,
                    lineWidth: lineWidth,
                    quantityPrecision: maxPrecisionForQuantity,
                    pricePrecision: maxPrecisionForPrice,
                    countLines: countLines,
                    lineHeight: lineHeight,
                    sideHeight: sideHeight,
                    abbreviations: abbreviations,
                    hideHint: this.hideHint,
                    showHint: this.showHint
                  }, void 0)
                }), void 0)]
              }), void 0)
            }), void 0), jsxRuntime.jsx(reactPixi.Container, Object.assign({
              ref: this.spreadContainer
            }, {
              children: jsxRuntime.jsx(SpreadLine, {
                height: spreadLineHeight,
                spread: spread,
                code: termCode,
                width: width,
                spreadPrecision: maxPrecisionForPrice,
                padding: padding,
                showUserQuantity: showUserQuantity,
                showExchangeId: showExchange
              }, void 0)
            }), void 0), abbreviations && jsxRuntime.jsx(Hint, {
              hintHeight: (_a = this.state) === null || _a === void 0 ? void 0 : _a.hintHeight,
              hintText: (_b = this.state) === null || _b === void 0 ? void 0 : _b.hintText,
              hintWidth: (_c = this.state) === null || _c === void 0 ? void 0 : _c.hintWidth,
              hintX: (_d = this.state) === null || _d === void 0 ? void 0 : _d.hintX,
              hintY: (_e = this.state) === null || _e === void 0 ? void 0 : _e.hintY
            }, void 0)]
          }, void 0);
        }
      }, void 0);
    }

  }

  const mapStateToProps = reselect.createSelector(hd_componentsMultiApp.viewportSelector, R__namespace.path(['app']), viewTypeSelector, abbreviationsSelector, (viewport, orderGrid, splitView, abbreviations) => Object.assign(Object.assign(Object.assign({}, viewport), orderGrid), {
    showExchange: orderGrid.showExchange && !orderGrid.aggregatingPrice && !orderGrid.aggregatingQuantity,
    showUserQuantity: !orderGrid.aggregatingQuantity,
    splitView,
    abbreviations
  }));
  const ConnectedRoot = reactRedux.connect(mapStateToProps)(Root);

  const aggregatingPrice = aggregationType => aggregationType === hd_componentsCommon.EAggregationTypes.price;

  const aggregatingQuantity = aggregationType => aggregationType === hd_componentsCommon.EAggregationTypes.quantityAveragePrice || aggregationType === hd_componentsCommon.EAggregationTypes.quantityTotalPrice;

  const getNormalizedParameters = parameters => {
    if (!parameters.aggregation) {
      return parameters;
    }

    const aggregationType = Object.keys(parameters.aggregation)[0];

    if (aggregatingQuantity(aggregationType)) {
      const normalizedParameters = Object.assign(Object.assign({}, parameters), {
        aggregation: {
          [hd_componentsCommon.EAggregationTypes.quantity]: parameters.aggregation[aggregationType]
        }
      });
      delete normalizedParameters.aggregation[aggregationType];
      return normalizedParameters;
    }

    if (aggregatingPrice(aggregationType)) {
      return parameters;
    }

    const message = `Unknown aggregation type  - "${aggregationType}"`;
    logger.namespace('orderGrid').error(message);
    throw new Error(message);
  };

  const createOrderGridEpic = (orderBook, symbol, parameters, channel, appId) => (action$, state$) => rxjs.merge(orderBook.subscribe(symbol, getNormalizedParameters(parameters), channel, hd_componentsOrderGridCommon.orderGridEpicType, appId), action$.pipe(hd_componentsUtils.isCreator(hd_componentsMultiApp.changeOnCanvasAction), operators.filter(action => !action.payload.onCanvas), operators.tap(() => {
    orderBook.sendActionToOrderBookWorker(hd_componentsOrderBook.noHoveredRecordsAction(parameters.groupId));
  }), operators.ignoreElements()), action$.pipe(hd_componentsUtils.isCreator(hd_componentsOrderGridCommon.updateParametersAction), operators.tap(({
    payload: {
      parameters
    }
  }) => {
    const normalizedParameters = getNormalizedParameters(parameters);
    orderBook.sendActionToOrderBookWorker(hd_componentsOrderBook.updateChannelParametersAction(symbol, channel, normalizedParameters));
  }), operators.map(() => hd_componentsOrderBook.dataHandledAction(symbol))), action$.pipe(hd_componentsUtils.isCreator(hd_componentsOrderGridCommon.orderHoveredAction), operators.tap(({
    payload: {
      side,
      entity
    }
  }) => {
    const aggregatingQuantity = state$.value.app.aggregatingQuantity;

    if (!aggregatingQuantity) {
      orderBook.sendActionToOrderBookWorker(hd_componentsOrderBook.recordHoveredAction(parameters.groupId, side, entity));
    }
  }), operators.ignoreElements()));

  const getAggregations = aggregation => {
    if (!aggregation) {
      return [false, false];
    }

    const aggregatingPrice = aggregation[hd_componentsCommon.EAggregationTypes.price];
    const aggregatingQuantity = aggregation[hd_componentsCommon.EAggregationTypes.quantityTotalPrice] || aggregation[hd_componentsCommon.EAggregationTypes.quantityAveragePrice];
    return [!!aggregatingPrice, !!aggregatingQuantity];
  };

  const getSell = (orders, price) => orders.find((o, i) => o.price.gte(price) || i === orders.length - 1);

  const getBuy = (orders, price) => {
    let lastOrder;

    for (const order of orders) {
      if (order.price.eq(price)) {
        return order;
      }

      if (order.price.lt(price)) {
        return lastOrder || order;
      }

      lastOrder = order;
    }

    return lastOrder;
  };

  const getSellOrder = (sellOrders, buyOrders, price, side) => {
    var _a, _b, _c;

    if (side !== hd_componentsOrderBook.L2MessageSide.sell) {
      price = (((_a = sellOrders[0]) === null || _a === void 0 ? void 0 : _a.price) || decimalUtils.ZERO).add((((_b = buyOrders[0]) === null || _b === void 0 ? void 0 : _b.price) || decimalUtils.ZERO).minus(((_c = getBuy(buyOrders, price)) === null || _c === void 0 ? void 0 : _c.price) || decimalUtils.ZERO));
    }

    return getSell(sellOrders, price);
  };

  const getBuyOrder = (sellOrders, buyOrders, price, side) => {
    var _a, _b, _c;

    if (side !== hd_componentsOrderBook.L2MessageSide.buy) {
      price = (((_a = buyOrders[0]) === null || _a === void 0 ? void 0 : _a.price) || decimalUtils.ZERO).add((((_b = sellOrders[0]) === null || _b === void 0 ? void 0 : _b.price) || decimalUtils.ZERO).minus(((_c = getSell(sellOrders, price)) === null || _c === void 0 ? void 0 : _c.price) || decimalUtils.ZERO));
    }

    return getBuy(buyOrders, price);
  };

  const highlightOrderReducer = (state, action) => {
    const {
      payload: {
        groupId,
        side,
        entity
      }
    } = action;

    if (state.app.aggregatingQuantity) {
      return state;
    }

    if (state.app.parameters.groupId !== groupId) {
      return state;
    }

    const sellOrders = state.app.sell.orders;
    const buyOrders = state.app.buy.orders;

    if (buyOrders.length === 0 || buyOrders.length === 0) {
      return state;
    }

    const sellOrder = getSellOrder(sellOrders, buyOrders, entity.price, side);
    const buyOrder = getBuyOrder(sellOrders, buyOrders, entity.price, side);
    return Object.assign(Object.assign({}, state), {
      app: Object.assign(Object.assign({}, state.app), {
        highlightOrders: {
          sell: sellOrder === null || sellOrder === void 0 ? void 0 : sellOrder.id,
          buy: buyOrder === null || buyOrder === void 0 ? void 0 : buyOrder.id
        }
      })
    });
  };

  const noOrderToHighlightReducer = (state, action) => {
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
        highlightOrders: {
          buy: null,
          sell: null
        }
      })
    });
  };

  const getAggregationTypeAndValue = parameters => {
    if (!parameters.aggregation) {
      return [undefined, undefined];
    }

    return Object.entries(parameters.aggregation)[0];
  };

  const getSuitableRecordIndexesGrouping = (side, records, userOrder, groupingPrice) => {
    const result = [];
    records.forEach((record, index) => {
      const aggregationPrice = hd_componentsOrderBook.getAggregationPrice(side, userOrder.price, groupingPrice);

      if (decimalUtils.equalDecimal(record.price, aggregationPrice)) {
        result.push(index);
      }
    });
    return result;
  };

  const getSuitableRecordIndexes = (records, userOrder) => {
    const result = [];
    records.forEach((record, index) => {
      if (decimalUtils.equalDecimal(record.price, userOrder.price)) {
        result.push(index);
      }
    });
    return result;
  };

  const insertUserOrderQuantity = (mapSide, indexes, records, userOrder, aggregationPrice, suitableIndexes) => {
    const userOrderQuantity = userOrder.quantity;
    const currentRecordIndex = indexes[0];
    const currentRecord = records[currentRecordIndex];
    const currentRecordId = aggregationPrice ? hd_componentsOrderBook.getAggregatedPriceRecordId(currentRecord.price) : hd_componentsOrderBook.getOrderId(currentRecord.exchange, currentRecord.level);

    if (indexes.length === 1) {
      if ((mapSide[currentRecordId] || decimalUtils.ZERO).add(userOrderQuantity).gt(currentRecord.quantity)) {
        if (suitableIndexes.length > 0) {
          const firstSuitableRecord = records[suitableIndexes[suitableIndexes.length - 1]];
          const firstSuitableRecordId = aggregationPrice ? hd_componentsOrderBook.getAggregatedPriceRecordId(firstSuitableRecord.price) : hd_componentsOrderBook.getOrderId(firstSuitableRecord.exchange, firstSuitableRecord.level);
          mapSide[firstSuitableRecordId] = (mapSide[firstSuitableRecordId] || decimalUtils.ZERO).add(userOrderQuantity);
        } else {
          mapSide[currentRecordId] = (mapSide[currentRecordId] || decimalUtils.ZERO).add(userOrderQuantity);
        }
      } else {
        mapSide[currentRecordId] = (mapSide[currentRecordId] || decimalUtils.ZERO).add(userOrderQuantity);
      }
    } else {
      if ((mapSide[currentRecordId] || decimalUtils.ZERO).add(userOrderQuantity).gt(currentRecord.quantity)) {
        insertUserOrderQuantity(mapSide, indexes.slice(1), records, userOrder, aggregationPrice, suitableIndexes);
      } else {
        insertUserOrderQuantity(mapSide, indexes.slice(1), records, userOrder, aggregationPrice, [...suitableIndexes, currentRecordIndex]);
      }
    }
  };

  const getUserOrdersMapSide = (mapExchangeCode, side, records, aggregationPrice, userOrders) => {
    const userOrdersMapSide = {};
    const filteredUserOrders = userOrders.filter(userOrder => userOrder.side === side);

    for (const userOrder of filteredUserOrders) {
      if (aggregationPrice) {
        const suitableRecordIndexes = getSuitableRecordIndexesGrouping(side, records, userOrder, aggregationPrice);

        if (suitableRecordIndexes.length === 0) {
          continue;
        }

        insertUserOrderQuantity(userOrdersMapSide, suitableRecordIndexes, records, userOrder, true, []);
      } else {
        const suitableRecordIndexes = getSuitableRecordIndexes(records, userOrder);

        if (suitableRecordIndexes.length === 0) {
          continue;
        }

        if (mapExchangeCode) {
          const filteredSuitableRecordIndexes = suitableRecordIndexes.filter(suitableRecordIndex => records[suitableRecordIndex].exchange === userOrder.exchange);

          if (filteredSuitableRecordIndexes.length === 0) {
            continue;
          } else {
            insertUserOrderQuantity(userOrdersMapSide, filteredSuitableRecordIndexes, records, userOrder, false, []);
            continue;
          }
        }

        insertUserOrderQuantity(userOrdersMapSide, suitableRecordIndexes, records, userOrder, false, []);
      }
    }

    return userOrdersMapSide;
  };

  const getUserOrdersMap = (mapExchangeCode, sellRecords, buyRecords, aggregationPrice, userOrders) => {
    const sell = getUserOrdersMapSide(mapExchangeCode, hd_componentsOrderBook.L2MessageSide.sell, sellRecords, aggregationPrice, userOrders);
    const buy = getUserOrdersMapSide(mapExchangeCode, hd_componentsOrderBook.L2MessageSide.buy, buyRecords, aggregationPrice, userOrders);
    return {
      sell,
      buy
    };
  };

  const EMPTY = {
    orders: [],
    deleted: []
  };

  const getAggregatedByPrice = (records, aggregationType, aggregationValue) => {
    const priceAggregation = records[hd_componentsCommon.EAggregationTypes.price];
    const aggregatedByPrice = priceAggregation && priceAggregation[aggregationValue];
    return aggregatedByPrice ? aggregatedByPrice : EMPTY;
  };

  const getAggregatedByQuantity = (records, aggregationType, aggregationValue) => {
    const quantityAggregation = records[hd_componentsCommon.EAggregationTypes.quantity];
    const aggregated = quantityAggregation && quantityAggregation[aggregationValue];

    if (!aggregated) {
      return EMPTY;
    }

    if (aggregationType === hd_componentsCommon.EAggregationTypes.quantityTotalPrice) {
      return aggregated;
    }

    if (aggregationType === hd_componentsCommon.EAggregationTypes.quantityAveragePrice) {
      const recalculatedOrders = aggregated.orders.map(order => {
        const price = decimalUtils.toDecimal(order.price);
        const quantity = decimalUtils.toDecimal(order.quantity);
        return Object.assign(Object.assign({}, order), {
          quantity,
          price: price.eq(decimalUtils.ZERO) ? decimalUtils.ZERO : price.div(quantity)
        });
      });
      return Object.assign(Object.assign({}, aggregated), {
        orders: recalculatedOrders
      });
    }
  };

  const getAggregated = (records, aggregationType, aggregationValue) => {
    if (aggregatingPrice(aggregationType)) {
      return getAggregatedByPrice(records, aggregationType, aggregationValue);
    }

    if (aggregatingQuantity(aggregationType)) {
      return getAggregatedByQuantity(records, aggregationType, aggregationValue);
    } // FIXME this is impossible (there are only price and quantity aggregation)


    return EMPTY;
  };
  /**
   * mutate
   * @param data
   * @returns
   */


  const castGridData = data => {
    data.orders = data.orders.map(item => Object.assign(Object.assign({}, item), {
      price: decimalUtils.toDecimal(item.price),
      quantity: decimalUtils.toDecimal(item.quantity),
      worstPrice: decimalUtils.toDecimal(item.worstPrice)
    }));
    return data;
  };

  const getGridData = (records, aggregationValue, aggregationType) => {
    if (aggregationValue) {
      return castGridData(getAggregated(records.aggregated, aggregationType, aggregationValue));
    }

    return castGridData(records.aggregated.price.equal);
  };

  const updateGridReducer = (state, action) => {
    const {
      payload: {
        sell: rawSell,
        buy: rawBuy,
        spread
      }
    } = action;
    const app = state.app;
    const [aggregationType, aggregationValue] = getAggregationTypeAndValue(app.parameters);
    const sell = getGridData(rawSell, aggregationValue, aggregationType);
    const buy = getGridData(rawBuy, aggregationValue, aggregationType);
    const userOrdersMap = aggregatingQuantity(aggregationType) ? {
      sell: {},
      buy: {}
    } : getUserOrdersMap(app.mapExchangeCode, app.sell.orders, app.buy.orders, aggregatingPrice(aggregationType) && aggregationValue, app.userOrders);
    return Object.assign(Object.assign({}, state), {
      app: Object.assign(Object.assign({}, state.app), {
        sell,
        buy,
        spread: decimalUtils.toDecimal(spread),
        userOrdersMap
      })
    });
  };

  const getUpdatedParameters = (currentParameters, parameters) => {
    if (!parameters) {
      logger.namespace('orderGrid').error(`Expected "parameters" to be an object. Got - ${parameters}`);
      return currentParameters;
    }

    if (!parameters.aggregation) {
      const updatedParameters = Object.assign({}, currentParameters);
      delete updatedParameters.aggregation;
      return updatedParameters;
    }

    const aggregationParameters = Object.values(parameters.aggregation);

    if (aggregationParameters.length > 1 || aggregationParameters.length === 0) {
      logger.namespace('orderGrid').error(`Expected one aggregation parameter. Got - ${JSON.stringify(parameters.aggregation)}`);
      return currentParameters;
    }

    const aggregationParameter = aggregationParameters[0];

    if (isNaN(aggregationParameters[0])) {
      logger.namespace('orderGrid').error(`Expected aggregation parameter to be a number. Got - ${aggregationParameter}`);
      return currentParameters;
    }

    if (aggregationParameters[0] <= 0) {
      logger.namespace('orderGrid').error(`Expected aggregation parameter to be greater than 0. Got - ${aggregationParameter}`);
      return currentParameters;
    }

    return Object.assign(Object.assign({}, currentParameters), {
      aggregation: Object.assign({}, parameters.aggregation)
    });
  };

  const updateParametersReducer = (state, action) => {
    const {
      payload: {
        parameters
      }
    } = action;
    const updatedParameters = getUpdatedParameters(state.app.parameters, parameters);
    const [aggregatingPrice, aggregatingQuantity] = getAggregations(updatedParameters.aggregation);
    return Object.assign(Object.assign({}, state), {
      app: Object.assign(Object.assign({}, state.app), {
        parameters: updatedParameters,
        aggregatingPrice,
        aggregatingQuantity,
        sell: {
          orders: [],
          deleted: []
        },
        buy: {
          orders: [],
          deleted: []
        }
      })
    });
  };

  const userOrderSymbolFits = (userOrder, appSymbol) => {
    if (userOrder.symbol !== appSymbol) {
      logger.namespace('orderBook').warn(`Invalid userOrder symbol. Required "${appSymbol}". Got "${userOrder.symbol}"`);
      return false;
    }

    return true;
  };

  const updateUserOrdersReducer = (state, action) => {
    const {
      payload: {
        userOrders
      }
    } = action;
    const app = state.app;
    const normalizedUserOrders = [...userOrders.filter(userOrder => userOrderSymbolFits(userOrder, app.symbol)).sort((a, b) => decimalUtils.compareDecimals(b.quantity, a.quantity))];
    const [aggregationType, aggregationValue] = getAggregationTypeAndValue(app.parameters);
    const userOrdersMap = aggregatingQuantity(aggregationType) ? {
      sell: {},
      buy: {}
    } : getUserOrdersMap(app.mapExchangeCode, app.sell.orders, app.buy.orders, aggregatingPrice(aggregationType) && aggregationValue, app.userOrders);
    return Object.assign(Object.assign({}, state), {
      app: Object.assign(Object.assign({}, app), {
        userOrders: normalizedUserOrders,
        userOrdersMap
      })
    });
  };

  const orderGridRootReducer = parameters => {
    const [aggregatingPrice, aggregatingQuantity] = getAggregations(parameters.parameters.aggregation);
    return hd_componentsUtils.createRootReducer([[updateGridReducer, hd_componentsOrderGridCommon.updateGridAction], [updateUserOrdersReducer, hd_componentsOrderGridCommon.updateUserOrdersAction], [updateParametersReducer, hd_componentsOrderGridCommon.updateParametersAction], [highlightOrderReducer, hd_componentsOrderGridCommon.highlightOrderAction], [noOrderToHighlightReducer, hd_componentsOrderGridCommon.noOrderToHighlightAction]], Object.assign(Object.assign({
      buy: {
        orders: [],
        deleted: []
      },
      sell: {
        orders: [],
        deleted: []
      },
      spread: decimalUtils.ZERO,
      userOrdersMap: {
        buy: {},
        sell: {}
      },
      userOrders: [],
      highlightOrders: {
        buy: null,
        sell: null
      }
    }, parameters), {
      aggregatingPrice,
      aggregatingQuantity
    }));
  };

  class OrderGridEmbeddableKernel extends hd_componentsMultiApp.AbstractEmbeddableKernel {
    getAppRoot() {
      return ConnectedRoot;
    }

    getAppType() {
      return 'orderGrid';
    }

    createReducerAndEpic(container, _, appId) {
      return __awaiter(this, void 0, void 0, function* () {
        const channel = `${Math.random()}`;

        const createOrderGridEmbeddableEpic = container => {
          const orderBook = container.get('orderBook');
          const symbol = container.getParameter('symbol');
          const parameters = container.getParameter('parameters');
          const orderGridEpic = createOrderGridEpic(orderBook, symbol, parameters, channel, appId);
          return reduxObservable.combineEpics(orderGridEpic, () => rxjs.of(hd_componentsMultiApp.appInitializedAction()));
        };

        const createOrderGridEmbeddableReducer = container => {
          const symbol = container.getParameter('symbol');
          const quantityPrecision = container.getParameter('quantityPrecision');
          const pricePrecision = container.getParameter('pricePrecision');
          const termCode = container.getParameter('termCode');
          const showExchange = container.getParameter('showExchangeId');
          const mapExchangeCode = container.getParameter('mapExchangeCode');
          const parameters = container.getParameter('parameters');
          const rawFormatFunctions = container.getParameter('formatFunctions');
          const formatFunctions = {
            price: rawFormatFunctions.price || hd_componentsCommon.noopFormatFunction,
            quantity: rawFormatFunctions.quantity || hd_componentsCommon.noopFormatFunction,
            spread: rawFormatFunctions.spread || hd_componentsCommon.noopFormatFunction
          };
          return orderGridRootReducer({
            symbol,
            quantityPrecision,
            pricePrecision,
            termCode,
            showExchange,
            mapExchangeCode,
            parameters,
            formatFunctions
          });
        };

        yield container.get('resourceLoader').loadAll();
        return {
          reducer: createOrderGridEmbeddableReducer(container),
          epic: createOrderGridEmbeddableEpic(container)
        };
      });
    }

  }

  exports.CUMULATIVE_MARKET_PRICE_USER = CUMULATIVE_MARKET_PRICE_USER;
  exports.ConnectedRoot = ConnectedRoot;
  exports.MARKET_PRICE_USER = MARKET_PRICE_USER;
  exports.MARKET_PRICE_USER_EXCHANGE = MARKET_PRICE_USER_EXCHANGE;
  exports.OrderGridEmbeddableKernel = OrderGridEmbeddableKernel;
  exports.SPLITTED_VIEW = SPLITTED_VIEW;
  exports.SPLITTED_VIEW_PRICE = SPLITTED_VIEW_PRICE;
  exports.SPLITTED_VIEW_QTY = SPLITTED_VIEW_QTY;
  exports.createOrderGridEpic = createOrderGridEpic;
  exports.orderGridParameters = orderGridParameters;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
