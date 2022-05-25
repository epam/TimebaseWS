(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react/jsx-runtime'), require('@deltix/hd.components-common'), require('@deltix/hd.components-di'), require('@deltix/hd.components-utils'), require('@deltix/logger'), require('@inlet/react-pixi'), require('@pixi/unsafe-eval'), require('pixi.js'), require('ramda'), require('react'), require('react-redux'), require('reselect'), require('rxjs'), require('rxjs/operators'), require('fontfaceobserver'), require('redux'), require('redux-observable'), require('normalize-wheel'), require('fast-deep-equal'), require('@deltix/decimal-utils'), require('big.js'), require('lodash')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react/jsx-runtime', '@deltix/hd.components-common', '@deltix/hd.components-di', '@deltix/hd.components-utils', '@deltix/logger', '@inlet/react-pixi', '@pixi/unsafe-eval', 'pixi.js', 'ramda', 'react', 'react-redux', 'reselect', 'rxjs', 'rxjs/operators', 'fontfaceobserver', 'redux', 'redux-observable', 'normalize-wheel', 'fast-deep-equal', '@deltix/decimal-utils', 'big.js', 'lodash'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MultiApp = {}, global.jsxRuntime, global.hd_componentsCommon, global.hd_componentsDi, global.hd_componentsUtils, global.logger, global.reactPixi, global.unsafeEval, global.PIXI, global.R, global.React, global.reactRedux, global.reselect, global.rxjs, global.operators, global.FontFaceObserver, global.redux, global.reduxObservable, global.normalizeWheel, global.deepEqual, global.decimalUtils, global.big_js, global.lodash));
})(this, (function (exports, jsxRuntime, hd_componentsCommon, hd_componentsDi, hd_componentsUtils, logger, reactPixi, unsafeEval, PIXI, R, React, reactRedux, reselect, rxjs, operators, FontFaceObserver, redux, reduxObservable, normalizeWheel, deepEqual, decimalUtils, big_js, lodash) { 'use strict';

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

  var PIXI__namespace = /*#__PURE__*/_interopNamespace(PIXI);
  var R__namespace = /*#__PURE__*/_interopNamespace(R);
  var React__namespace = /*#__PURE__*/_interopNamespace(React);
  var FontFaceObserver__default = /*#__PURE__*/_interopDefaultLegacy(FontFaceObserver);
  var normalizeWheel__default = /*#__PURE__*/_interopDefaultLegacy(normalizeWheel);
  var deepEqual__default = /*#__PURE__*/_interopDefaultLegacy(deepEqual);

  const ContainerContext = /*#__PURE__*/React__namespace.createContext(null);

  /**
   * Provide Root components of embeddable applications.
   */

  const EmbeddableRootsContext = /*#__PURE__*/React__namespace.createContext(null);

  const RendererContext = /*#__PURE__*/React__namespace.createContext(null);

  const TweenRegistryContext = /*#__PURE__*/React__namespace.createContext(null);
  const WithTween = () => BaseComponent => class extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.tweens = [];

      this.createTween = () => {
        const tween = this.registry.create();
        this.tweens.push(tween);
        return tween;
      };
    }

    componentWillUnmount() {
      this.registry.remove(...this.tweens);
    }

    render() {
      return jsxRuntime.jsx(TweenRegistryContext.Consumer, {
        children: registry => {
          this.registry = registry;
          return jsxRuntime.jsx(BaseComponent, Object.assign({
            createTween: this.createTween
          }, this.props), void 0);
        }
      }, void 0);
    }

  };
  function useTween(callback) {
    const context = React__namespace.useContext(TweenRegistryContext);
    const ref = React__namespace.useRef();
    React__namespace.useEffect(() => {
      const t = context.create();
      callback(t);
      ref.current = t;
      return () => {
        ref.current = null;
        context.remove(t);
      };
    }, []);
    return ref.current;
  }

  class FontLoader {
    constructor() {
      this.fonts = [];
    }

    addFont(fontFamily, path, nonce) {
      const key = `${fontFamily}:${path}`;

      if (-1 !== this.fonts.findIndex(record => record.key === key)) {
        return;
      }

      this.addFontFace(fontFamily, path, nonce);
      const observer = new FontFaceObserver__default["default"](fontFamily);
      this.fonts.push({
        observer,
        fontFamily,
        key
      });
    }

    loadAll() {
      return Promise.all(this.fonts.map(({
        observer
      }) => observer.load(null, 5000)));
    }

    addFontFace(fontFamily, source, nonce) {
      const newStyle = document.createElement("style");

      if (nonce) {
        newStyle.setAttribute("nonce", nonce);
      }

      newStyle.id = this.createId(fontFamily);
      const fontFace = `@font-face { font-family: "${fontFamily}"; src: url("${source}"); }`;
      newStyle.appendChild(document.createTextNode(fontFace));
      document.head.appendChild(newStyle);
    }

    createId(fontFamily) {
      return `${fontFamily.replace(" ", "_")}__deltixFont`;
    }

  }

  class ResourceLoader {
    constructor(resolveResourceCallback, nonce) {
      this.resolveResourceCallback = resolveResourceCallback;
      this.nonce = nonce;
      this.loader = PIXI__namespace.Loader.shared;
      this.fontLoader = new FontLoader();
      this.urlRegExp = new RegExp('^(?:[a-z]+:)?//', 'i');
    }

    addResource(name, path) {
      if (this.loader.resources.hasOwnProperty(name)) {
        return;
      }

      if (this.loader.resources.hasOwnProperty(name)) {
        return;
      }

      path = this.tryResolve(name, path);

      if (this.loader.loading) {
        this.loader.onComplete.add(() => {
          if (this.loader.resources.hasOwnProperty(name)) {
            return;
          }

          this.loader.add(name, this.resolveAbsoluteUrl(path));
        });
      } else {
        this.loader.add(name, this.resolveAbsoluteUrl(path));
      }
    }

    addFont(fontFamily, path) {
      path = this.tryResolve(fontFamily, path);
      this.fontLoader.addFont(fontFamily, this.resolveAbsoluteUrl(path), this.nonce);
    }

    loadAll() {
      return Promise.all([this.loadImages(), this.fontLoader.loadAll()]);
    }

    getResources() {
      return this.loader.resources;
    }

    loadImages() {
      return new Promise(resolve => this.loader.load(resolve));
    }

    resolveAbsoluteUrl(url) {
      if (this.isAbsoluteUrl(url)) {
        return url;
      }

      const {
        protocol,
        host
      } = window.location;
      return `${protocol}//${host}${url}`;
    }

    isAbsoluteUrl(url) {
      return this.urlRegExp.test(url);
    }

    tryResolve(name, path) {
      if (typeof this.resolveResourceCallback !== 'function') {
        return path;
      }

      const t = this.resolveResourceCallback(name, path);
      return t == null ? path : t;
    }

  }

  const selectEmbeddedApp = (appType, appId) => state => R__namespace.path(["apps", appType, appId], state);
  const selectEmbeddedAppState = (appType, appId) => state => selectEmbeddedApp(appType, appId)(state).state;
  const selectEmbeddedAppInitializationSate = (appType, appId) => state => selectEmbeddedApp(appType, appId)(state).containerState;

  class MultiAppStage {
    constructor(renderer, stage, store) {
      this.renderer = renderer;
      this.stage = stage;
      this.store = store;
      this.children = [];

      this.notify = () => {
        if (!this.children.length) {
          return;
        }

        const state = this.store.getState();
        this.context.actualTheme = state.theme;

        for (const c of this.children) {
          c.setState(state, this.context, this.dispatch);
        }
      };

      this.dispatch = action => {
        this.store.dispatch(action);
      };

      this.emitter = new rxjs.Subject();
      this.emitter.pipe(operators.throttleTime(1000 / 20, void 0, {
        trailing: true,
        leading: true
      })).subscribe(this.notify);
      this.subscription = store.subscribe(() => this.emitter.next(Date.now()));
    }

    setContext(context) {
      this.context = context;
    }

    append(comp) {
      this.children.push(new comp(this.stage));
    }

    destroy() {
      var _a;

      this.emitter.complete();
      (_a = this.subscription) === null || _a === void 0 ? void 0 : _a.call(this);
      this.children = [];
    }

  }

  class StageContext {
    constructor(themes) {
      this.themes = themes;
    }

    get theme() {
      return this.themes[this.actualTheme];
    }

  }

  const initialInputState = {
    x: -1,
    y: -1,
    magnet: true,
    drag: false,
    onCanvas: false
  };

  const initAction = {
    type: '@MULTI_APP/INIT'
  };
  const getInitialState = (reducer, {
    width,
    height,
    x,
    y
  }) => {
    // call reducer with init action to receive initial state
    const state = reducer(undefined, initAction); // add to initial state "viewport" and "input" and move application state to app branch

    return {
      app: state,
      viewport: {
        width,
        height,
        x,
        y
      },
      input: Object.assign({}, initialInputState)
    };
  };

  // request on creation embeddable application
  const createEmbeddableAppAction = (appType, appId, position, createParams) => ({
    type: '@MULTI_APP/CREATE_EMBEDDABLE_APP',
    payload: {
      appType,
      appId,
      position,
      createParams
    }
  }); // embeddable application start initialization

  const embeddableAppInitializingAction = (appType, appId, position) => ({
    type: '@MULTI_APP/EMBEDDABLE_APP_INITIALIZING',
    payload: {
      appType,
      appId,
      position
    }
  }); // this action type should dispatch app epic when app fully initialized

  const appInitializedAction = () => ({
    type: '@MULTI_APP/APP_INITIALIZED'
  }); // embeddable application initialized

  const embeddableAppInitializedAction = (appType, appId) => ({
    type: '@MULTI_APP/EMBEDDABLE_APP_INITIALIZED',
    payload: {
      appType,
      appId
    }
  }); // dispatch initial state when kernel created

  const embeddableAppKernelCreatedAction = (appType, appId, position, state) => ({
    type: '@MULTI_APP/EMBEDDABLE_APP_KERNEL_CREATED',
    payload: {
      appType,
      appId,
      state,
      position
    }
  });
  /**
   * API
   */

  const embeddableAppUpdatePositionAction = (appType, appId, newPosition) => {
    // embeddableAppUpdatePositionValidator(appType, appId, newPosition);
    return {
      type: '@MULTI_APP/EMBEDDABLE_APP_UPDATE_POSITION',
      payload: {
        appType,
        appId,
        newPosition
      }
    };
  };
  const embeddableAppFailedAction = (appType, appId, error) => ({
    type: '@MULTI_APP/EMBEDDABLE_APP_FAILED',
    payload: {
      appType,
      appId,
      error
    }
  }); // this action must be dispatched by application

  const noDataAction = () => ({
    type: '@MULTI_APP/NO_DATA'
  });
  const embeddableAppNoDataAction = (appType, appId) => ({
    type: '@MULTI_APP/EMBEDDABLE_APP_NO_DATA',
    payload: {
      appType,
      appId
    }
  });
  /**
   * API
   */
  // request on destroy embeddable application

  const destroyEmbeddableAppAction = (appType, appId) => {
    // destroyEmbeddableAppValidator(appType, appId);
    return {
      type: '@MULTI_APP/DESTROY_EMBEDDABLE_APP',
      payload: {
        appType,
        appId
      }
    };
  };
  const terminateMultiAppAction = () => ({
    type: '@MULTI_APP/TERMINATE'
  });
  /**
   * API
   */

  const changeThemeAction = theme => {
    // changeThemeValidator(theme);
    return {
      type: 'MULTI_APP/CHANGE_THEME',
      payload: {
        theme
      }
    };
  };

  exports.EEmbeddableAppState = void 0;

  (function (EEmbeddableAppState) {
    // start initialization of app
    // from this state app may came to INITIALIZED, FAILED, NO_DATA_WAIT or NO_DATA state
    EEmbeddableAppState["initializing"] = "initializing"; // [!] it's finite state.

    EEmbeddableAppState["initialized"] = "initialized"; // in this state MULTI_APP perform attempts to restart app

    EEmbeddableAppState["failed"] = "failed"; // this state indicate that app don't receive data in limited time rage.
    // APPLICATION may retry or wait when data will be send.

    EEmbeddableAppState["no_data_wait"] = "no_data_wait"; // this state indicate that app don't receive data and don't attempt or wait when data is come.
    // [!] it's finite state.

    EEmbeddableAppState["no_data"] = "no_data";
  })(exports.EEmbeddableAppState || (exports.EEmbeddableAppState = {}));

  const multiAppInitialState = {
    apps: {},
    theme: hd_componentsCommon.EThemes.cryptoCortexDark
  };

  const getContainerState = (state, {
    appType,
    id
  }) => R__namespace.path(['apps', appType, id, 'containerState'], state);

  const getAppState = (state, {
    appType,
    id
  }) => R__namespace.path(['apps', appType, id, 'state'], state);
  const isAppAction$1 = action => action.hasOwnProperty('metadata') && action.metadata.hasOwnProperty('multi'); // delegate action to embeddable applications

  const createRoutedReducer = reducerMap => (state, action) => {
    if (!isAppAction$1(action)) {
      return state;
    }

    const route = action.metadata.multi;
    const appState = getAppState(state, route);

    if (appState === undefined) {
      if (getContainerState(state, route) === exports.EEmbeddableAppState.initialized) {
        console.warn('Look like bug. Embeddable state not found.', action);
      }

      return state;
    }

    const reducer = R__namespace.path([route.appType, route.id], reducerMap);

    if (undefined === reducer) {
      if (getContainerState(state, route) === exports.EEmbeddableAppState.initialized) {
        console.warn(`Look like bug. Embeddable reducer not found.`, action);
      }

      return state;
    }

    const nextAppState = reducer(appState, action);

    if (appState === nextAppState) {
      return state;
    } // [!] mutate root state


    state.apps[route.appType][route.id].state = nextAppState;
    return state;
  };

  /**
   * Add router metadata to action.
   */

  const ActionEnhancer = (appType, id) => action => Object.assign(Object.assign({}, action), {
    metadata: Object.assign(Object.assign({}, action.metadata), {
      multi: {
        appType,
        id
      }
    })
  });
  const IsActionOf = (appType, id) => action => isAppAction$1(action) && action.metadata.multi.id === id && action.metadata.multi.appType === appType;

  class FixedStateObservable extends rxjs.Observable {
    constructor(stateSubject, initialState, appType, appId) {
      super(subscriber => {
        const subscription = this.__notifier.subscribe(subscriber);

        if (subscription && !subscription.closed) {
          subscriber.next(this.value);
        }

        return subscription;
      });
      this.__path = R.path(['apps', appType, appId, 'state']);
      this.__value = initialState;
      this.__notifier = new rxjs.Subject();
      this.__subscription = stateSubject.subscribe(value => {
        // We only want to update state$ if it has actually changed since
        // redux requires reducers use immutability patterns.
        // This is basically what distinctUntilChanged() does but it's so simple
        // we don't need to pull that code in
        if (value !== this.__value) {
          this.__value = value;

          this.__notifier.next(value);
        }
      });
    }

    get value() {
      return this.__path(this.__value);
    }

  }

  /**
   * Emmit value when destroy app action received.
   */

  const CreateDestroySource = action$ => (appId, appType) => action$.pipe(hd_componentsUtils.isCreator(destroyEmbeddableAppAction, embeddableAppFailedAction), // is request on destroy current application
  operators.filter(({
    payload: {
      appType: actionAppType,
      appId: actionAppId
    }
  }) => actionAppId === appId && actionAppType === appType), operators.take(1));
  /**
   * Run embeddableEpic with wrapped (EmbeddableStore) store.
   */


  const RunEmbeddableEpicWithPatch = (action$, store$) => (appType, appId, epic) => {
    const filterAction = IsActionOf(appType, appId);
    const internal$ = action$.pipe(operators.filter(filterAction));
    return epic(internal$, new FixedStateObservable(store$, {}, appType, appId), {});
  };
  /**
   * Run EmbeddableEpic.
   */


  const RunEmbeddableEpic = (createInput, runEmbeddableEpicWithPatch) => ({
    payload: {
      appId,
      appType,
      position
    }
  }, epic) => {
    const input$ = createInput(position, appType, appId);
    return rxjs.merge(input$, runEmbeddableEpicWithPatch(appType, appId, epic)).pipe(operators.map(ActionEnhancer(appType, appId)), // add router specific metadata
    operators.finalize(() => logger.namespace('multiApp').info('Embeddable app destroyed')));
  };

  const failOnError = (appType, appId) => rxjs.pipe(operators.catchError(e => {
    logger.namespace('multiApp').error(e);
    return rxjs.of(embeddableAppFailedAction(appType, appId, e));
  }));
  /**
   * Initialize new embeddable application. Run epic with enhanced reducer and action stream.
   */


  const CreateEmbeddableApp = (createBundle, shared, runEmbeddableEpic, createDestroySource) => action => {
    const {
      payload: {
        appType,
        appId,
        position
      }
    } = action;
    const destroy$ = createDestroySource(appId, appType);
    const appInitializeType = hd_componentsUtils.getType(appInitializedAction);
    const noDataType = hd_componentsUtils.getType(noDataAction);
    return rxjs.concat(rxjs.of(embeddableAppInitializingAction(appType, appId, position)), // dispatch start initialization
    rxjs.from(createBundle(action)).pipe(operators.tap(({
      reducer,
      container
    }) => shared.save(container, reducer, appType, appId)), // [!] add to reducer map new reducer
    operators.mergeMap(({
      epic,
      reducer
    }) => rxjs.concat(rxjs.of(embeddableAppKernelCreatedAction(appType, appId, position, getInitialState(reducer, position))), // dispatch initial state
    runEmbeddableEpic(action, epic) // run epic
    .pipe(operators.map(action => action.type === appInitializeType // redispatch initialized action
    ? embeddableAppInitializedAction(appType, appId) : action), operators.map(action => action.type === noDataType // redispatch application no data action to internal action
    ? embeddableAppNoDataAction(appType, appId) : action)))), operators.takeUntil(destroy$), failOnError(appType, appId), operators.finalize(() => shared.remove(appType, appId))));
  };

  const HasWithId = store$ => (id, type) => undefined !== R__namespace.path(['apps', type, id], store$.value); // prevent creation app with same id.


  const FilterSameAppId = hasWithId => ({
    payload: {
      appId,
      appType
    }
  }) => {
    const has = hasWithId(appId, appType);

    if (has) {
      logger.namespace('multiApp').warn(`App with id "${appId}" and type "${appType}" already exists.`);
    }

    return !has;
  };
  /**
   * Listen "createEmbeddableAppAction" and run "sub" epic for requested application.
   *
   * This epic emmit embeddableAppCreatedAction when new application created.
   */


  const multiAppEpic = (shared, createInput, createBundle) => (action$, store$) => {
    const runEmbeddableEpic = RunEmbeddableEpic(createInput(action$, store$), RunEmbeddableEpicWithPatch(action$, store$));
    const createEmbeddableApp = CreateEmbeddableApp(createBundle, shared, runEmbeddableEpic, CreateDestroySource(action$));
    const hasWithId = HasWithId(store$);
    const filterSameAppId = FilterSameAppId(hasWithId);
    return action$.pipe(hd_componentsUtils.isCreator(createEmbeddableAppAction), operators.filter(filterSameAppId), operators.mergeMap(createEmbeddableApp));
  };

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

  function __rest(s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
          t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
          for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
              if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                  t[p[i]] = s[p[i]];
          }
      return t;
  }

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

  class InteractionManager {
    constructor(stage, params, renderer, subject) {
      this.stage = stage;
      this.params = params;
      this.renderer = renderer;
      this.subject = subject;
      this.dragging = false;
      this.touchDistance = 0;

      this.onWheel = event => {
        const {
          top: canvasTop,
          left: canvasLeft
        } = event.target.getBoundingClientRect();
        const {
          x: subjectX,
          y: subjectY
        } = this.subject.getGlobalPosition();
        const x = event.clientX - canvasLeft - subjectX;
        const y = event.clientY - canvasTop - subjectY;

        if (!this.params.hitArea.contains(x, y)) {
          return;
        }

        event.preventDefault();
        this.params.onWheel({
          delta: normalizeWheel__default["default"](event).pixelY,
          x,
          y
        });
      };

      this.onDragStart = event => {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data;
        this.dragging = true;
        const position = event.data.getLocalPosition(this.subject);
        this.x = position.x;
        this.y = position.y;
        this.handlePointEvent(event, 'onDragStart');
      };

      this.onDragEnd = event => {
        this.stopDragging();
        this.handlePointEvent(event, 'onDragEnd');
      };

      this.onDragMove = () => {
        if (this.dragging) {
          const newPosition = this.data.getLocalPosition(this.subject);
          const dragX = newPosition.x - this.x;
          const dragY = newPosition.y - this.y;
          const x = this.x = newPosition.x;
          const y = this.y = newPosition.y;
          const {
            left: hitAreaLeft,
            top: hitAreaTop
          } = this.params.hitArea;
          this.params.onDragMove({
            x: x - hitAreaLeft,
            y: y - hitAreaTop,
            dragX,
            dragY
          });
        }
      };

      this.onMove = event => this.handlePointEvent(event, 'onMove');

      this.onPointerDown = event => {
        const {
          x,
          y
        } = event.data.getLocalPosition(this.subject);
        this.startX = x;
        this.startY = y;
        return this.handlePointEvent(event, 'onPointerDown');
      };

      this.onPointerUp = event => {
        this.onClick(event);
        this.startX = null;
        this.startY = null;
        return this.handlePointEvent(event, 'onPointerUp');
      };

      this.onClick = event => {
        if (!this.params.onClick) {
          return;
        }

        const {
          x,
          y
        } = event.data.getLocalPosition(this.subject);

        if (this.startX === x && this.startY === y) {
          this.params.onClick({
            x,
            y
          });
        }
      };

      this.onPointerOut = event => {
        if (this.dragging) {
          this.onDragEnd(event);
        }

        this.call({}, 'onPointerOut');
      };

      this.onTouchMove = event => this.handleTouchEvent(event, false);

      this.onTouchEnd = event => {
        if (this.inTouch) {
          this.inTouch = false;
          this.handleTouchEvent(event, false);
        }
      };

      this.onTouchCancel = event => {
        this.inTouch = false;
      };

      this.onTouchStart = event => {
        if (event.touches.length === 2) {
          this.inTouch = true;
          this.handleTouchEvent(event, true);
        }
      };

      subject.interactive = true;
      subject.hitArea = params.hitArea;

      if (params.onMove) {
        subject.on('pointermove', this.onMove);
      }

      if (params.onPointerDown) {
        subject.on('pointerdown', this.onPointerDown);
      }

      if (params.onPointerUp) {
        subject.on('pointerup', this.onPointerUp);
      }

      if (params.onDragStart || params.onDragMove) {
        subject.on('pointerdown', this.onDragStart);
      }

      if (params.onDragMove) {
        subject.on('pointermove', this.onDragMove);
      }

      if (params.onDragEnd || params.onDragMove) {
        subject.on('pointerup', this.onDragEnd);
      }

      if (params.onPointerOver) {
        subject.on('pointerover', params.onPointerOver);
      }

      subject.on('pointerout', this.onPointerOut);

      if (params.onWheel) {
        renderer.view.addEventListener('wheel', this.onWheel);
        renderer.view.addEventListener('touchstart', this.onTouchStart);
        renderer.view.addEventListener('touchend', this.onTouchEnd);
        renderer.view.addEventListener('touchmove', this.onTouchMove);
        renderer.view.addEventListener('touchcancel', this.onTouchCancel);
      }
    }

    destroy() {
      logger.namespace('multiApp').info('Destroy InteractionManager');
      this.renderer.view.removeEventListener('wheel', this.onWheel);
      this.renderer.view.removeEventListener('touchstart', this.onTouchStart);
      this.renderer.view.removeEventListener('touchend', this.onTouchEnd);
      this.renderer.view.removeEventListener('touchmove', this.onTouchMove);
      this.renderer.view.removeEventListener('touchcancel', this.onTouchCancel);
      const subject = this.subject;
      const params = this.params;

      if (params.onMove) {
        subject.off('pointermove', this.onMove);
      }

      if (params.onPointerDown) {
        subject.off('pointerdown', this.onPointerDown);
      }

      if (params.onPointerUp) {
        subject.off('pointerup', this.onPointerUp);
      }

      if (params.onDragStart || params.onDragMove) {
        subject.off('pointerdown', this.onDragStart);
      }

      if (params.onDragMove) {
        subject.off('pointermove', this.onDragMove);
      }

      if (params.onDragEnd || params.onDragMove) {
        subject.off('pointerup', this.onDragEnd);
      }

      if (params.onPointerOver) {
        subject.off('pointerover', params.onPointerOver);
      }

      subject.off('pointerout', this.onPointerOut);
    }

    stopDragging() {
      this.dragging = false;
      this.data = null;
    }

    handlePointEvent(event, listenerForCall) {
      const cursorPosition = event.data.getLocalPosition(this.subject);
      const {
        left: hitAreaLeft,
        top: hitAreaTop
      } = this.params.hitArea;
      const relativeToHitArea = {
        x: cursorPosition.x - hitAreaLeft,
        y: cursorPosition.y - hitAreaTop
      };

      if (this.isOutCanvas(relativeToHitArea)) {
        return;
      }

      this.call(relativeToHitArea, listenerForCall);
    }

    call(data, listenerForCall) {
      if (this.params.hasOwnProperty(listenerForCall)) {
        this.params[listenerForCall](data);
      }
    }

    isOutCanvas({
      x,
      y
    }) {
      const {
        width,
        height
      } = this.params.hitArea;
      return x > width || x < 0 || y > height || y < 0;
    }

    handleTouchEvent(event, initial) {
      if (event.touches.length === 2) {
        event.preventDefault();
        const {
          clientX: x1,
          clientY: y1
        } = event.touches.item(0);
        const {
          clientX: x2,
          clientY: y2
        } = event.touches.item(1);
        const {
          top: canvasTop,
          left: canvasLeft
        } = event.target.getBoundingClientRect();
        const {
          x: subjectX,
          y: subjectY
        } = this.subject.getGlobalPosition();
        const x = (x1 + x2) / 2 - canvasLeft - subjectX;
        const y = (y1 + y2) / 2 - canvasTop - subjectY;

        if (!this.params.hitArea.contains(x, y)) {
          return;
        }

        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

        if (!initial) {
          if (Math.abs(this.touchDistance - distance) > 1) {
            this.params.onWheel({
              delta: distance - this.touchDistance,
              x,
              y,
              isTouch: true
            });
            this.touchDistance = distance;
          }
        } else {
          this.touchDistance = distance;
        }
      }
    }

  }

  const changePositionAction = point => ({
    type: '@INPUT/CHANGE_INPUT',
    payload: point
  });
  const changeDragAction = drag => ({
    type: '@INPUT/CHANGE_DRAG',
    payload: {
      drag
    }
  });
  const changeOnCanvasAction = onCanvas => ({
    type: '@INPUT/ON_CANVAS',
    payload: {
      onCanvas
    }
  });
  const pointDownAction = point => ({
    type: '@INPUT/POINTER_DOWN',
    payload: point
  });
  const pointUpAction = point => ({
    type: '@INPUT/POINTER_UP',
    payload: point
  });
  /**
   * API
   */

  const clickAction = point => {
    // clickValidator(point);
    return {
      type: '@INPUT/CLICK',
      payload: point
    };
  };
  const changeMagnetAction = magnet => ({
    type: '@INPUT/CHANGE_MAGNET',
    payload: {
      magnet
    }
  });
  const wheelAction = (x, delta, forceDelta = false, isTouch = false) => ({
    type: '@INPUT/WHEEL',
    payload: {
      x,
      delta,
      forceDelta,
      isTouch
    }
  });
  const dragMoveAction = delta => ({
    type: '@INPUT/DRAG_MOVE',
    payload: {
      delta
    }
  });

  const findSubject = (stage, type, id) => {
    /* tslint:disable-next-line */
    for (let i = 0; i < stage.children.length; i++) {
      const child = stage.children[i];

      if (child['@@HIT_AREA'] && child['@@HIT_AREA'].type === type && child['@@HIT_AREA'].id === id) {
        return child;
      }

      if (child.children) {
        const inner = findSubject(child, type, id);

        if (inner) {
          return inner;
        }
      }
    }

    return null;
  };

  const waitSubject = (stage, type, id) => __awaiter(void 0, void 0, void 0, function* () {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const subject = findSubject(stage, type, id);

      if (subject) {
        return subject;
      }

      yield hd_componentsUtils.delay(10);
    }
  });

  const inputEpic = (stage, renderer) => (position, type, id) => {
    const hitArea = new PIXI__namespace.Rectangle(0, 0, position.width, position.height);

    const inputEpic = () => rxjs.from(waitSubject(stage, type, id)).pipe(operators.mergeMap(container => {
      const subject = new rxjs.Subject();
      const manager = new InteractionManager(stage, {
        buttonMode: false,
        hitArea,
        onDragMove: e => subject.next(dragMoveAction(e.dragX)),
        onDragStart: () => subject.next(changeDragAction(true)),
        onWheel: e => subject.next(wheelAction(e.x, e.delta, e.forceDelta, e.isTouch)),
        onDragEnd: () => subject.next(changeDragAction(false)),
        onMove: e => subject.next(changePositionAction(e)),
        onPointerDown: e => subject.next(pointDownAction(e)),
        onPointerUp: e => subject.next(pointUpAction(e)),
        onClick: e => subject.next(clickAction(e)),
        onPointerOut: () => subject.next(changeOnCanvasAction(false)),
        onPointerOver: () => subject.next(changeOnCanvasAction(true))
      }, renderer, container);
      return subject.pipe(operators.finalize(() => {
        console.info(`Destroy inputEpic for ${type} ${id}.`);
        manager.destroy();
      }));
    }));

    const updateHitArea = action$ => action$.pipe(hd_componentsUtils.isCreator(embeddableAppUpdatePositionAction), operators.filter(({
      payload: {
        appId,
        appType
      }
    }) => appType === type && appId === id), operators.tap(({
      payload: {
        newPosition: {
          width,
          height
        }
      }
    }) => {
      hitArea.width = width;
      hitArea.height = height;
    }), operators.ignoreElements());

    return reduxObservable.combineEpics(inputEpic, updateHitArea);
  };

  const createInputSource = (stage, renderer) => (action$, store$) => (position, type, id) => inputEpic(stage, renderer)(position, type, id)(action$).pipe(operators.skipWhile(() => // don't emit input action while app not initialized
  selectEmbeddedAppInitializationSate(type, id)(store$.value) !== exports.EEmbeddableAppState.initialized));

  const composeReducers = (...reducers) => (state, action) => reducers.reduce((nextState, reducer) => reducer(nextState, action), state);

  const changeDragReducer = (state, {
    payload: {
      drag
    }
  }) => Object.assign(Object.assign({}, state), {
    drag
  });

  // todo remove
  const changeMagnetReducer = (state, {
    payload: {
      magnet
    }
  }) => Object.assign(Object.assign({}, state), {
    magnet
  });

  const changeOnCanvasReducer = (state, {
    payload: {
      onCanvas
    }
  }) => Object.assign(Object.assign({}, state), {
    onCanvas
  });

  const changePositionReducer = (state, {
    payload: {
      x,
      y
    }
  }) => Object.assign(Object.assign({}, state), {
    x,
    y
  });

  const inputReducer = hd_componentsUtils.createRootReducer([[changePositionReducer, changePositionAction], [changeDragReducer, changeDragAction], [changeOnCanvasReducer, changeOnCanvasAction], [changeMagnetReducer, changeMagnetAction]], initialInputState);

  const updateViewportAction = (width, height, x, y) => ({
    type: '@VIEWPORT/UPDATE',
    payload: {
      width,
      height,
      x,
      y
    }
  });
  const multiAppUpdateViewportAction = (width, height) => ({
    type: '@VIEWPORT/MULTI_APP_UPDATE',
    payload: {
      width,
      height
    }
  });

  const initialViewportState = {
    width: null,
    height: null,
    x: null,
    y: null
  };

  const updateViewportReducer = (state, {
    payload
  }) => payload;

  const viewportReducer = hd_componentsUtils.createRootReducer([[updateViewportReducer, updateViewportAction]], initialViewportState);

  const enhanceReducer = (part, reducer) => (state, action) => {
    const next = reducer(state[part], action);

    if (next === state[part]) {
      return state;
    }

    return R__namespace.assocPath([part], next, state);
  }; // [!] mutate object


  const AddReducerToMap = reducerMap => (reducer, appType, appId) => {
    if (!reducerMap.hasOwnProperty(appType)) {
      reducerMap[appType] = {};
    }

    reducerMap[appType][appId] = composeReducers(reducer, enhanceReducer("input", inputReducer), enhanceReducer("viewport", viewportReducer));
  }; // [!] mutate object


  const RemoveReducerFromMap = reducerMap => (appType, appId) => R__namespace.dissocPath([appType, appId], reducerMap);

  const AddContainerToMap = containerMap => (container, appType, appId) => {
    if (!containerMap.hasOwnProperty(appType)) {
      containerMap[appType] = {};
    }

    containerMap[appType][appId] = container;
  };

  const RemoveContainerFromMap = containerMap => (appType, appId) => R__namespace.dissocPath([appType, appId], containerMap);

  const saveShared = (addContainerToMap, addReducerToMap) => (container, reducer, appType, appId) => {
    addContainerToMap(container, appType, appId);
    addReducerToMap(reducer, appType, appId);
  };

  const removeShared = (removeContainerToMap, removeReducerToMap) => (appType, appId) => {
    removeContainerToMap(appType, appId);
    removeReducerToMap(appType, appId);
  };

  const sharedResources = (containerMap, reducerMap) => ({
    save: saveShared(AddContainerToMap(containerMap), AddReducerToMap(reducerMap)),
    remove: removeShared(RemoveContainerFromMap(containerMap), RemoveReducerFromMap(reducerMap))
  });

  const embeddableAppInitializedReducer = (state, {
    payload: {
      appId,
      appType
    }
  }) => R__namespace.assocPath(['apps', appType, appId, 'containerState'], exports.EEmbeddableAppState.initialized, state);
  const embeddableAppKernelCreatedReducer = (state, {
    payload: {
      appId,
      appType,
      state: embeddableState,
      position
    }
  }) => R__namespace.assocPath(['apps', appType, appId], {
    state: embeddableState,
    position,
    containerState: exports.EEmbeddableAppState.initializing
  }, state);
  const embeddableAppInitializingReducer = (state, {
    payload: {
      appId,
      appType,
      position
    }
  }) => R__namespace.assocPath(['apps', appType, appId], {
    state: {},
    position,
    containerState: exports.EEmbeddableAppState.initializing
  }, state);
  const embeddableAppUpdatePositionReducer = (state, {
    payload: {
      appId,
      appType,
      newPosition
    }
  }) => R__namespace.assocPath(['apps', appType, appId, 'position'], newPosition, state);
  const embeddableAppFailedReducer = (state, {
    payload: {
      appId,
      appType
    }
  }) => R__namespace.assocPath(['apps', appType, appId, 'containerState'], exports.EEmbeddableAppState.failed, state);
  const embeddableAppNoDataReducer = (state, {
    payload: {
      appId,
      appType
    }
  }) => R__namespace.assocPath(['apps', appType, appId, 'containerState'], exports.EEmbeddableAppState.no_data, state);
  const destroyEmbeddableAppReducer = (state, {
    payload: {
      appType,
      appId
    }
  }) => R__namespace.dissocPath(['apps', appType, appId], state);
  const changeThemeReducer = (state, {
    payload: {
      theme
    }
  }) => {
    if (undefined === hd_componentsCommon.multiAppThemes[theme]) {
      // tslint:disable-next-line: no-console
      console.warn(`Change theme failed. Theme with name: "${theme}" not found`);
      return state;
    }

    return R__namespace.assoc('theme', theme, state);
  };

  const rootReducerMap = [[embeddableAppInitializedReducer, embeddableAppInitializedAction], [destroyEmbeddableAppReducer, destroyEmbeddableAppAction], [embeddableAppInitializingReducer, embeddableAppInitializingAction], [embeddableAppKernelCreatedReducer, embeddableAppKernelCreatedAction], [embeddableAppFailedReducer, embeddableAppFailedAction], [embeddableAppNoDataReducer, embeddableAppNoDataAction], [embeddableAppUpdatePositionReducer, embeddableAppUpdatePositionAction], [changeThemeReducer, changeThemeAction]];
  const MultiAppRootReducer = (routedReducer, initialState) => {
    const rootReducer = hd_componentsUtils.createRootReducer(rootReducerMap, initialState);
    return (state, action) => {
      const nextState = routedReducer(state, action);
      return rootReducer(nextState, action);
    };
  };

  /**
   * Return kernel by appType
   */

  const GetKernelForType = (kernels, appType) => kernels.find(kernel => kernel.getAppType() === appType);

  const CreateBundle = (kernels, globalParams) => ({
    payload: {
      createParams,
      appType,
      position,
      appId
    }
  }) => __awaiter(void 0, void 0, void 0, function* () {
    const kernel = GetKernelForType(kernels, appType);
    Object.assign(kernel.parameters, globalParams);
    return kernel.boot(createParams, position, appId);
  });

  let current = window.devicePixelRatio;
  const devicePixelRatio$ = rxjs.of(0, rxjs.animationFrameScheduler).pipe(operators.repeat(), operators.filter(() => current !== window.devicePixelRatio), operators.tap(() => current = window.devicePixelRatio), operators.map(() => window.devicePixelRatio), operators.startWith(window.devicePixelRatio));

  const resizeRender = (resolution, width, height, renderer) => {
    const w2 = Math.round(width * resolution);
    const h2 = Math.round(height * resolution);
    renderer.view.style.width = width + "px";
    renderer.view.style.height = height + "px";
    renderer.resize(w2, h2);
  };

  const resizeEpic = renderer => action$ => rxjs.combineLatest(devicePixelRatio$, action$.pipe(hd_componentsUtils.isCreator(multiAppUpdateViewportAction), operators.map(({
    payload: {
      width,
      height
    }
  }) => ({
    width,
    height
  })))).pipe(operators.tap(([resolution, {
    width,
    height
  }]) => resizeRender(resolution, width, height, renderer)), operators.ignoreElements());

  const updateAppEpic = action$ => action$.pipe(hd_componentsUtils.isCreator(embeddableAppUpdatePositionAction), operators.map(({
    payload: {
      appType,
      appId,
      newPosition: {
        width,
        height,
        x,
        y
      }
    }
  }) => ActionEnhancer(appType, appId)(updateViewportAction(width, height, x, y))));

  const updateEpic = mountNode => {
    const current = {
      height: null,
      width: null
    };
    return () => rxjs.of(0, rxjs.animationFrameScheduler).pipe(operators.repeat(), operators.filter(_ => {
      const {
        clientHeight,
        clientWidth
      } = mountNode;

      if (clientHeight !== current.height || clientWidth !== current.width) {
        current.height = clientHeight;
        current.width = clientWidth;
        return true;
      }

      return false;
    }), operators.map(_ => multiAppUpdateViewportAction(mountNode.clientWidth, mountNode.clientHeight)), operators.startWith(multiAppUpdateViewportAction(mountNode.clientWidth, mountNode.clientHeight)));
  };

  const viewportEpic = (mountNode, renderer) => reduxObservable.combineEpics(updateEpic(mountNode), resizeEpic(renderer), updateAppEpic);

  const actionsBlacklist = ['RENDER_APP', '@HD_CHART/STREAM_ACTION', '@INPUT', '@EC/DATA', '@EC/TICK', '@EC/POINTER_MOVE', '@EC/CROSSHAIR', '@EC/SCROLL', '@EC/POINTER_OVER', '@EC/POINTER_OUT'];

  const createComposeEnhancers = () => typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
    actionsBlacklist,
    maxAge: 10000,
    name: 'hd'
  }) : redux.compose;

  const createMultiAppStore = (kernels, container, containerMap) => {
    const reducerMap = {}; // [!] mutable object

    const routedReducer = createRoutedReducer(reducerMap);
    const multiAppReducer = MultiAppRootReducer(routedReducer, multiAppInitialState);
    const stage = container.get('stage');
    const renderer = container.get('renderer');
    const mountNode = container.get('mountNode');
    const epicMiddleware = reduxObservable.createEpicMiddleware();
    const actionStream$ = new rxjs.Subject();

    const eventStreamMiddleware = store => next => action => {
      const result = next(action);
      actionStream$.next(action);
      return result;
    };

    const middleware = createComposeEnhancers()(redux.applyMiddleware(epicMiddleware, eventStreamMiddleware));
    const store = redux.createStore(multiAppReducer, multiAppInitialState, middleware);
    const globalParams = {
      resolveResource: container.get('resolveResource'),
      nonce: container.get('nonce')
    };
    const multiApp = reduxObservable.combineEpics(multiAppEpic(sharedResources(containerMap, reducerMap), createInputSource(stage, renderer), CreateBundle(kernels, globalParams)), viewportEpic(mountNode, renderer));

    const rootEpic = (action$, store$, deps) => multiApp(action$, store$, deps).pipe(operators.takeUntil(action$.pipe(hd_componentsUtils.isCreator(terminateMultiAppAction))));

    epicMiddleware.run(rootEpic);
    return {
      store,
      actionStream$
    };
  };

  const ThemeContext = /*#__PURE__*/React__namespace.createContext(null);
  const {
    Provider: ThemeProvider,
    Consumer: Styled
  } = ThemeContext;

  /**
   * @internal
   */
  class Liner {
    constructor() {
      this.compute = x => {
        return this.doCompute(this.domain(), this.range(), x);
      };

      this.computeReverse = x => {
        return this.doCompute(this.range(), this.domain(), x);
      };

      this.setRange = (from, to) => {
        this.range = () => ({
          from,
          to
        });

        return this;
      };

      this.setDomain = (from, to) => {
        this.domain = () => ({
          from,
          to
        });

        return this;
      };

      this.setDomainFn = fn => {
        this.domain = fn;
        return this;
      };

      this.setRangeFn = fn => {
        this.range = fn;
        return this;
      };

      this.getRange = () => {
        return this.range;
      };

      this.getDomain = () => {
        return this.domain;
      };

      this.range = () => ({
        from: 0,
        to: 0
      });

      this.domain = () => ({
        from: 0,
        to: 0
      });
    }

    createReverse() {
      const range = this.range();
      const domain = this.domain();
      return new Liner().setDomain(range.from, range.to).setRange(domain.from, domain.to);
    }

    getFirstValue() {
      const domain = this.getDomain()();
      return this.compute(domain.from);
    }

    getLastValue() {
      const domain = this.getDomain()();
      return this.compute(domain.to);
    }

    clone() {
      const clone = new Liner();
      clone.range = this.range;
      clone.domain = this.domain;
      return clone;
    }

    doCompute(domain, range, x) {
      const rise = range.from - range.to;
      const run = domain.from - domain.to;
      const slope = rise / run;
      const intercept = range.from - slope * domain.from;
      return slope * x + intercept;
    }

  }

  /**
   * Needed for sync server time and browser time.
   */
  // todo remove singleton
  class SyncTime {
    constructor() {
      this.offset = 0;
      this.freezeTime = NaN;
      /**
       * @returns Return current timestamp with server offset.
       */

      this.now = () => {
        if (!isNaN(this.freezeTime)) {
          return this.freezeTime;
        }

        return Date.now() - this.offset;
      };
    }
    /**
     * @param serverTime Current time on server.
     */


    sync(serverTime) {
      this.offset = Date.now() - serverTime;
    }

    freeze(freezeTime = 0) {
      this.freezeTime = freezeTime;
    }

  }
  const ServerTime = new SyncTime();

  const performanceNow = hd_componentsUtils.isUndefined(window.performance) ? ServerTime.now : () => window.performance.now();

  class Clock {
    constructor() {
      this.startedAt = -1;
      this.pausedAt = -1;
      this.pauseDuration = 0;
    }

    start(at = performanceNow()) {
      this.reset();
      this.startedAt = at;
    }

    startAt() {
      return this.startedAt;
    }

    isStarted() {
      return -1 !== this.startedAt;
    }

    pause(at = performanceNow()) {
      if (!this.isPaused()) {
        this.pausedAt = at;
      }
    }

    isRunning() {
      return this.isStarted() && !this.isPaused();
    }

    resume(at = performanceNow()) {
      if (this.isPaused()) {
        this.pauseDuration += at - this.pausedAt;
        this.pausedAt = -1;
      }
    }

    isPaused() {
      return -1 !== this.pausedAt;
    }

    left(now = performanceNow()) {
      return now - this.startedAt - this.getPauseDuration(now);
    }

    reset() {
      this.pausedAt = -1;
      this.startedAt = -1;
      this.pauseDuration = 0;
    }

    getPauseDuration(now = performanceNow()) {
      return this.pauseDuration + (this.isPaused() ? now - this.pausedAt : 0);
    }

  }

  class Ease {}

  Ease.linear = t => t;

  Ease.inQuad = t => t * t;

  Ease.outQuad = t => t * (2 - t);

  Ease.inOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  Ease.inCubic = t => t * t * t;

  Ease.outCubic = t => --t * t * t + 1;

  Ease.inOutCubic = t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

  Ease.inQuart = t => t * t * t * t;

  Ease.outQuart = t => 1 - --t * t * t * t;

  Ease.inOutQuart = t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;

  Ease.inQuint = t => t * t * t * t * t;

  Ease.outQuint = t => 1 + --t * t * t * t * t;

  Ease.inOutQuint = t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;

  class Tween {
    constructor() {
      this.lastV = 0;
      this.prolongation = 0;
      this.clock = new Clock();
      this.onUpdateCallbacks = [];
      this.onCompleteCallbacks = [];
      this.onForceCompleteCallbacks = [];
      this.onCompleteOnceCallbacks = [];
      this.onStartCallbacks = [];
      this.easing = Ease.linear;
      this.liner = new Liner().setRange(0, 1).setDomainFn(() => ({
        from: 0,
        to: this.getFullDuration()
      }));

      this.durationThunk = () => 200;

      this.directionFunctor = () => 0;

      this.compute = at => {
        const now = this.clock.left(at);
        let v = this.liner.compute(now);
        v = this.easing(v);
        v = Math.max(0, Math.min(1, v));
        return Math.abs(this.directionFunctor() - v);
      };
    }

    setEasing(easing) {
      this.easing = easing;
      return this;
    }

    getLastV() {
      return this.lastV;
    }

    getEasing() {
      return this.easing;
    }

    prolong(at = performanceNow()) {
      if (this.isRunning()) {
        // update liner
        this.liner.setRange(this.liner.compute(this.clock.left(at)), 1).setDomainFn(() => ({
          from: this.clock.left(at),
          to: this.getFullDuration()
        }));
        this.prolongation = this.clock.left(at);
      }

      return this;
    }

    startOrProlong() {
      return !this.isRunning() ? this.start() : this.prolong();
    }

    reverseLoop() {
      this.onComplete(t => t.reverse().reset().start());
      return this;
    }

    loop() {
      this.onComplete(t => t.reset().start());
      return this;
    }

    duration(duration) {
      this.durationThunk = hd_componentsUtils.createThunk(duration);
      return this;
    }

    getDuration() {
      return this.durationThunk;
    }

    getFullDuration() {
      return this.durationThunk() + this.prolongation;
    }

    onUpdate(callback) {
      this.onUpdateCallbacks.push(callback);
      return this;
    }

    onComplete(callback) {
      this.onCompleteCallbacks.push(callback);
      return this;
    }

    onForceComplete(callback) {
      this.onForceCompleteCallbacks.push(callback);
      return this;
    }

    onCompleteOnce(callback) {
      this.onCompleteOnceCallbacks.push(callback);
      return this;
    }

    onStart(callback) {
      this.onStartCallbacks.push(callback);
      return this;
    }

    start(at = performanceNow()) {
      // animation already started do noting
      if (this.clock.isStarted()) {
        return this;
      }

      this.clock.start(at);
      this.onStartCallbacks.forEach(callback => callback(this));
      return this;
    }

    reverse() {
      this.directionFunctor = this.directionFunctor() ? () => 0 : () => 1;
      return this;
    }

    pause() {
      this.clock.pause();
      return this;
    }

    isPaused() {
      return this.clock.isPaused();
    }

    resume() {
      this.clock.resume();
      return this;
    }
    /**
     * Update animation.
     */


    update(now = performanceNow()) {
      if (!this.isRunning()) {
        return this;
      }

      this.lastV = this.compute(now);
      this.onUpdateCallbacks.forEach(callback => callback(this.lastV));

      if (this.directionFunctor() === 0 && this.lastV === 1 || this.directionFunctor() === 1 && this.lastV === 0) {
        this.doComplete(true);
      }

      return this;
    }
    /**
     * Return true if animation is completed. Animated is completed if she is not started.
     */


    isCompleted() {
      return !this.isRunning();
    }
    /**
     * Complete animation and call update callback.
     */


    complete() {
      return this.doComplete(false);
    }
    /**
     * Complete animation without call on update callback.
     */


    forceComplete() {
      if (!this.isCompleted()) {
        this.doComplete(true);
        this.onForceCompleteCallbacks.forEach(callback => callback(this));
      }

      return this;
    }
    /**
     * Reset animation to initial state.
     */


    reset() {
      this.clock.reset();
      this.prolongation = 0;
      this.liner.setRange(0, 1).setDomainFn(() => ({
        from: 0,
        to: this.getFullDuration()
      }));
      return this;
    }

    isStarted() {
      return this.clock.isStarted();
    }

    isRunning() {
      return this.clock.isRunning();
    }

    doComplete(force) {
      if (!this.isCompleted()) {
        this.reset();

        if (!force) {
          this.onUpdateCallbacks.forEach(callback => callback(1));
        }

        this.onCompleteCallbacks.forEach(callback => callback(this));
        this.onCompleteOnceCallbacks.forEach(callback => callback(this));
        this.onCompleteOnceCallbacks = [];
      }

      return this;
    }

  }

  class TweenRegistry {
    constructor() {
      this.tweens = [];
    }

    create() {
      const tween = new Tween();
      this.add(tween);
      return tween;
    }

    add(tween) {
      this.tweens.push(tween);
    }

    remove(...tweens) {
      this.tweens = this.tweens.filter(tween => -1 === tweens.indexOf(tween));
    }

    update(time) {
      this.tweens.forEach(tween => tween.update(time));
    }

    getAll() {
      return this.tweens;
    }

    forceCompleteAll() {
      this.tweens.forEach(tween => tween.forceComplete());
    }

    completeAll() {
      this.tweens.forEach(tween => tween.complete());
    }

    removeAll() {
      this.forceCompleteAll();
      this.tweens = [];
    }

  }

  class OverflowHidden extends React__namespace.PureComponent {
    constructor() {
      super(...arguments);
      this.ref = /*#__PURE__*/React__namespace.createRef();
      this.mask = new PIXI__namespace.Graphics();
    }

    componentDidMount() {
      this.ref.current.addChild(this.mask);
      this.ref.current.mask = this.mask;
    }

    componentWillUnmount() {
      this.ref.current.removeChild(this.mask);
    }

    render() {
      // todo it's break input
      this.mask.clear().beginFill(0xFF) // it's hack
      .drawRect(0, 0, this.props.width, this.props.height);
      return jsxRuntime.jsx(reactPixi.Container, Object.assign({
        ref: this.ref
      }, {
        children: this.props.children
      }), void 0);
    }

  }

  const Pure = () => WrappedComponent => {
    var _a;

    return _a = class ShallowEqualEnhancer extends WrappedComponent {
      shouldComponentUpdate(nextProps, nextState) {
        let shouldUpdate = false;

        if (!super.shouldComponentUpdate || super.shouldComponentUpdate(nextProps, nextState)) {
          shouldUpdate = shallowEqual(this.props, nextProps, this.state, nextState);
        }

        return shouldUpdate;
      }

    }, _a.displayName = `ShallowEqualEnhanced${WrappedComponent.displayName || WrappedComponent.name || "Component"}`, _a;
  };
  /**
   * @param {Object} thisProps
   * @param {Object} nextProps
   * @param {Object} thisState
   * @param {Object} nextState
   */

  function shallowEqual(thisProps, nextProps, thisState, nextState) {
    return !shallowEqualState(thisState, nextState) || !shallowEqualWithoutReactElements(thisProps, nextProps);
  }
  /**
   * @param {Object} thisState
   * @param {Object} nextState
   * @returns {Boolean}
   */

  function shallowEqualState(thisState, nextState) {
    return thisState === nextState;
  }
  /**
   * Perform a shallow equal to every prop that is not a React Element
   * This will return true for unchanged props (where the only changes are the react elements props like 'children')
   * @param {Object} thisProps
   * @param {Object} nextProps
   * @returns {Boolean}
   */

  function shallowEqualWithoutReactElements(thisProps, nextProps) {
    if (thisProps === nextProps) {
      return true;
    } else if (typeof thisProps === "object" && typeof nextProps === "object") {
      const propNames = hd_componentsUtils.uniqueArray(Object.keys(thisProps), Object.keys(nextProps));

      for (const propName of propNames) {
        if (thisProps[propName] !== nextProps[propName] && !isReactElement(thisProps[propName])) {
          // No need to check nextProps[propName] as well, as we know they are not equal
          return false;
        }
      }

      return true;
    }

    return false;
  }
  /**
   * If the provided argument is a valid react element or an array that contains at least
   * one valid react element in it
   * @param {*} suspectedElement
   * @returns {Boolean}
   */

  function isReactElement(suspectedElement) {
    let isElem = false;

    if ( /*#__PURE__*/React__namespace.isValidElement(suspectedElement)) {
      isElem = true;
    } else if (Array.isArray(suspectedElement)) {
      for (let i = 0, l = suspectedElement.length; i < l; i++) {
        if ( /*#__PURE__*/React__namespace.isValidElement(suspectedElement[i])) {
          isElem = true;
          break;
        }
      }
    }

    return isElem;
  }

  const noop = () => {
    return;
  };

  const WithResources = () => BaseComponent => {
    return class extends React__namespace.Component {
      constructor() {
        super(...arguments);

        this.getResource = name => {
          return this.resourceLoader.getResources()[name];
        };
      }

      render() {
        return jsxRuntime.jsx(ContainerContext.Consumer, {
          children: container => {
            if (!container.has("resourceLoader")) {
              return jsxRuntime.jsx(BaseComponent, Object.assign({}, {
                getResource: noop
              }, this.props), void 0);
            }

            this.resourceLoader = container.get("resourceLoader");
            return jsxRuntime.jsx(BaseComponent, Object.assign({}, {
              getResource: this.getResource
            }, this.props), void 0);
          }
        }, void 0);
      }

    };
  };

  exports.Gradient = class Gradient extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.ref = /*#__PURE__*/React__namespace.createRef();
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.sprite = PIXI__namespace.Sprite.from(this.canvas);
    }

    render() {
      return jsxRuntime.jsx(reactPixi.Container, {
        ref: this.ref
      }, void 0);
    }

    componentDidMount() {
      this.ref.current.addChild(this.sprite);
      this.renderCanvas();
    }

    componentDidUpdate() {
      this.renderCanvas();
    }

    renderCanvas() {
      this.ctx.clearRect(0, 0, this.props.width, this.props.height);
      const gradient = this.props.direction === hd_componentsUtils.EGradientDirection.horizontal ? this.ctx.createLinearGradient(0, 0, 0, this.props.height) : this.ctx.createLinearGradient(0, 0, this.props.width, 0);
      this.props.colors.forEach(([offset, color]) => {
        gradient.addColorStop(offset, color);
      });
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.props.width, this.props.height);
      this.sprite.width = this.props.width;
      this.sprite.height = this.props.height;

      if (this.props.mask) {
        this.sprite.mask = this.props.mask;
      }

      this.sprite.texture.update();
    }

  };
  exports.Gradient = __decorate([Pure()], exports.Gradient);

  const Polygon = reactPixi.PixiComponent("Polygon", {
    create: props => {
      return new PIXI__namespace.Graphics();
    },
    applyProps: (instance, oldProps, newProps) => {
      const {
        color,
        alpha,
        path
      } = newProps;
      instance.clear();
      instance.beginFill(color, alpha);
      instance.drawPolygon(path);
      instance.endFill();
    }
  });

  const Rectangle = ({
    color,
    alpha,
    height,
    width
  }) => {
    const path = [0, 0, width, 0, width, height, 0, height];
    return jsxRuntime.jsx(Polygon, {
      color: color,
      alpha: alpha,
      path: path
    }, void 0);
  };

  exports.Background = class Background extends React__namespace.Component {
    render() {
      return jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [this.props.color ? jsxRuntime.jsx(Rectangle, Object.assign({}, this.props), void 0) : null, this.props.image ? this.renderImage() : null, this.props.gradient ? jsxRuntime.jsx(exports.Gradient, Object.assign({}, this.props.gradient, {
          width: this.props.width,
          height: this.props.height
        }), void 0) : null]
      }, void 0);
    }

    renderImage() {
      const {
        width,
        height
      } = this.props;
      const texture = this.props.getResource(this.props.image).texture;
      const scale = width / texture.width;
      return jsxRuntime.jsx(reactPixi.Sprite, {
        cacheAsBitmap: true,
        texture: texture,
        scale: [scale, scale],
        position: [width / 2 - texture.width * scale / 2, height / 2 - texture.height * scale / 2]
      }, void 0);
    }

  };
  exports.Background = __decorate([Pure(), WithResources()], exports.Background);

  const NotUpdate = /*#__PURE__*/React__namespace.memo(({
    children
  }) => jsxRuntime.jsx(jsxRuntime.Fragment, {
    children: children
  }, void 0), () => true);

  const CHILDREN = "children"; // List of props that should be handled in a specific way

  const RESERVED_PROPS = {
    [CHILDREN]: true // special handling in React

  }; // List of default values for DisplayObject members

  const DEFAULT_PROPS = {
    alpha: 1,
    buttonMode: false,
    cacheAsBitmap: false,
    cursor: "auto",
    filterArea: null,
    filters: null,
    hitArea: null,
    interactive: false,
    // localTransform  // readonly
    mask: null,
    // TODO move parent to RESERVED_PROPS?
    // parent  // readonly
    pivot: 0,
    position: 0,
    renderable: true,
    rotation: 0,
    scale: 1,
    skew: 0,
    transform: null,
    visible: true,
    // worldAlpha  // readonly
    // worldTransform  // readonly
    // worldVisible  // readonly
    x: 0,
    y: 0
  };

  /* tslint:disable */
  /* Helper Methods */

  /* Concrete Helper Methods */

  const includingReservedProps = key => key in RESERVED_PROPS;
  /* PIXI related Methods */
  // Converts value to an array of coordinates

  function parsePoint(value) {
    let arr = [];

    if (typeof value === "undefined") {
      return arr;
    } else if (typeof value === "string") {
      arr = value.split(",");
    } else if (typeof value === "number") {
      arr = [value];
    } else if (Array.isArray(value)) {
      // shallow copy the array
      arr = value.slice();
    } else if (typeof value.x !== "undefined" && typeof value.y !== "undefined") {
      arr = [value.x, value.y];
    }

    return arr.map(Number);
  }
  function isPointType(value) {
    return value instanceof PIXI__namespace.Point || value instanceof PIXI__namespace.ObservablePoint;
  } // Set props on a DisplayObject by checking the type. If a PIXI.Point or
  // a PIXI.ObservablePoint is having its value set, then either a comma-separated
  // string with in the form of "x,y" or a size 2 array with index 0 being the x
  // coordinate and index 1 being the y coordinate.
  // See: https://github.com/Izzimach/react-pixi/blob/a25196251a13ed9bb116a8576d93e9fceac2a14c/src/ReactPIXI.js#L114

  function setPixiValue(instance, propName, value) {
    const prevIsPoint = isPointType(instance[propName]);

    if (prevIsPoint && isPointType(value)) {
      // Just copy the data if a Point type is being assigned to a Point type
      instance[propName].copy(value);
    } else if (prevIsPoint) {
      // Parse value if a non-Point type is being assigned to a Point type
      const coordinateData = parsePoint(value); // invariant(
      //   typeof coordinateData !== "undefined" && coordinateData.length > 0 && coordinateData.length < 3,
      //   "The property `%s` is a PIXI.Point or PIXI.ObservablePoint and must be set to a comma-separated string of " +
      //   "either 1 or 2 coordinates, a 1 or 2 element array containing coordinates, or a PIXI Point/ObservablePoint. " +
      //   "If only one coordinate is given then X and Y will be set to the provided value. Received: `%s` of type `%s`.",
      //   propName,
      //   JSON.stringify(value),
      //   typeof value
      // );

      instance[propName].set(coordinateData.shift(), coordinateData.shift());
    } else {
      // Just assign the value directly if a non-Point type is being assigned to a non-Point type
      instance[propName] = value;
    }
  }

  function defaultApplyProps(instance, oldProps, newProps) {
    for (const propName in newProps) {
      if (!newProps.hasOwnProperty(propName) || includingReservedProps(propName)) {
        continue;
      }

      const value = newProps[propName];

      if (instance instanceof PIXI.Text) {
        if (propName === "anchor" || propName === "style" && oldProps) {
          // extra case for text
          if (deepEqual__default["default"](oldProps[propName], newProps[propName])) {
            continue;
          }
        }

        setPixiValue(instance, propName, value);
        continue;
      } // Set value if defined


      if (typeof value !== "undefined") {
        setPixiValue(instance, propName, value);
      } else if (typeof instance[propName] !== "undefined" && typeof DEFAULT_PROPS[propName] !== "undefined") {
        // Reset to default value (if it is defined) when display object had prop set and no longer has
        console.warn(`setting default value: ${propName} was ${instance[propName]} is ${value} for`, instance);
        setPixiValue(instance, propName, DEFAULT_PROPS[propName]);
      } else {
        console.warn(`ignoring prop: ${propName} was ${instance[propName]} is ${value} for`, instance);
      }
    }
  }

  const DEFAULT_ANCHOR = [0, 0];
  const alignHorizontal = (container, boxWidth, contentWidth, align) => {
    switch (align) {
      case 'left':
        {
          container.x = 0;
          break;
        }

      case 'right':
        {
          container.x = Math.max(0, boxWidth - contentWidth);
          break;
        }

      case 'center':
        {
          container.x = boxWidth / 2 - contentWidth / 2;
          break;
        }
    }
  };
  class AlignText extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.textRef = /*#__PURE__*/React__namespace.createRef();
      this.containerRef = /*#__PURE__*/React__namespace.createRef();
    }

    shouldComponentUpdate(nextProps, nextState) {
      return !deepEqual__default["default"](this.props, nextProps);
    }

    render() {
      return jsxRuntime.jsx(NotUpdate, {
        children: jsxRuntime.jsx(reactPixi.Container, Object.assign({
          ref: this.containerRef
        }, {
          children: hd_componentsCommon.isTTF(this.props.style) ? jsxRuntime.jsx(reactPixi.Text, {
            ref: this.textRef,
            style: this.props.style,
            text: this.props.text,
            anchor: this.props.anchor || DEFAULT_ANCHOR
          }, void 0) : jsxRuntime.jsx(reactPixi.BitmapText, {
            ref: this.textRef,
            style: this.props.style,
            text: this.props.text,
            letterSpacing: this.props.style.letterSpacing,
            anchor: this.props.anchor || DEFAULT_ANCHOR
          }, void 0)
        }), void 0)
      }, void 0);
    }

    componentDidMount() {
      this.update({});
    }

    componentDidUpdate(prevProps) {
      this.update(prevProps);
    }

    update(prevProps) {
      if (deepEqual__default["default"](prevProps, this.props)) {
        return;
      }

      defaultApplyProps(this.textRef.current, {
        text: prevProps.text
      }, {
        text: this.props.text
      });
      alignHorizontal(this.containerRef.current, this.props.width, this.width(), this.props.horizontal);

      if (hd_componentsCommon.isTTF(this.props.style)) {
        const inst = this.textRef.current;
        inst.style.fill = hd_componentsCommon.getFillColor(this.props.style);
      } else {
        const inst = this.textRef.current;
        inst.tint = hd_componentsCommon.getFillColor(this.props.style);
      }

      switch (this.props.vertical) {
        case 'middle':
          {
            this.containerRef.current.y = (this.props.height - this.getLetterMeasure().height) / 2;
            break;
          }

        case 'bottom':
          {
            this.containerRef.current.y = this.props.height - this.getLetterMeasure().height;
            break;
          }

        case 'top':
          {
            this.containerRef.current.y = 0;
            break;
          }
      }
    }

    width() {
      if (!this.props.hints) {
        return this.computeWidth();
      } // hit !


      if (undefined !== this.fullWidthCached) {
        return this.fullWidthCached;
      }

      if (this.props.hints.monoSpace) {
        return this.fullWidthCached = this.computeWidth();
      }

      if (this.props.hints.monoSpace) {
        return this.getLetterMeasure().width * this.props.text.length;
      }
    }

    getLetterMeasure() {
      if (undefined !== this.letterMeasureCached) {
        return this.letterMeasureCached;
      }

      const {
        width,
        height
      } = hd_componentsCommon.isTTF(this.props.style) ? new PIXI__namespace.Text('0', this.props.style) : new PIXI__namespace.BitmapText('0', this.props.style);
      return this.letterMeasureCached = {
        width,
        height
      };
    }

    computeWidth() {
      return this.textRef.current.width;
    }

  }

  const mapDispatch = {
    onError: embeddableAppFailedAction
  };
  const mapProps = reselect.createSelector(state => state.theme, theme => ({
    theme
  }));
  let EmbeddableContainer = class EmbeddableContainer extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.store = Object.assign(Object.assign({}, this.props.store), {
        dispatch: action => this.props.store.dispatch(ActionEnhancer(this.props.type, this.props.id)(action)),
        getState: () => R__namespace.path(['apps', this.props.type, this.props.id, 'state'], this.props.store.getState())
      });

      this.setRef = ref => {
        if (null !== ref) {
          ref['@@HIT_AREA'] = {
            type: this.props.type,
            id: this.props.id
          };
        }
      };
    }

    static getDerivedStateFromError(error) {
      console.error(error);
      return {
        hasError: true
      };
    }

    componentDidCatch(error) {
      this.props.onError(this.props.type, this.props.id, error);
    }

    render() {
      const {
        position: {
          width,
          height,
          x,
          y
        }
      } = this.props;

      if (this.props.state !== exports.EEmbeddableAppState.initialized) {
        return jsxRuntime.jsxs(reactPixi.Container, Object.assign({
          x: x,
          y: y
        }, {
          children: [jsxRuntime.jsx(exports.Background, {
            width: width,
            height: height,
            color: this.props.theme === hd_componentsCommon.EThemes.cryptoCortexWhite ? 0xf7f8fa : 0x1f2735,
            alpha: 1
          }, void 0), jsxRuntime.jsx(AlignText, {
            width: width,
            height: height,
            text: this.getTextForState(),
            style: Object.assign(Object.assign({}, hd_componentsCommon.ttfRobotoCondensed_regular_10), {
              fontSize: 26,
              fill: 0x000000
            }),
            horizontal: 'center',
            vertical: 'middle'
          }, void 0)]
        }), void 0);
      }

      return jsxRuntime.jsx(reactPixi.Container, Object.assign({
        x: x,
        y: y,
        ref: this.setRef
      }, {
        children: jsxRuntime.jsx(reactRedux.Provider, Object.assign({
          store: this.store
        }, {
          children: jsxRuntime.jsx(OverflowHidden, Object.assign({
            width: width,
            height: height
          }, {
            children: jsxRuntime.jsx(ContainerContext.Provider, Object.assign({
              value: this.props.container
            }, {
              children: /*#__PURE__*/React__namespace.createElement(this.props.root)
            }), void 0)
          }), void 0)
        }), void 0)
      }), void 0);
    }

    getTextForState() {
      return {
        [exports.EEmbeddableAppState.failed]: 'Failed',
        [exports.EEmbeddableAppState.initializing]: 'Initializing',
        [exports.EEmbeddableAppState.no_data]: 'No Data'
      }[this.props.state];
    }

  };
  EmbeddableContainer = __decorate([reactRedux.connect(mapProps, mapDispatch)], EmbeddableContainer);

  const MultiAppRoot = () => {
    const {
      roots,
      apps,
      containers
    } = React__namespace.useContext(EmbeddableRootsContext);
    const store = React__namespace.useContext(StoreContext);
    return jsxRuntime.jsx(jsxRuntime.Fragment, {
      children: Object.entries(apps).reduce((embeddableApps, [type, appsById]) => [...embeddableApps, ...Object.entries(appsById).map(([id, {
        position,
        containerState
      }]) => {
        var _a;

        return roots[type] ? jsxRuntime.jsx(EmbeddableContainer, {
          id: id,
          type: type,
          position: position,
          state: containerState,
          root: roots[type],
          container: (_a = containers === null || containers === void 0 ? void 0 : containers[type]) === null || _a === void 0 ? void 0 : _a[id],
          store: store
        }, `${type}:${id}`) : null;
      })], [])
    }, void 0);
  };
  MultiAppRoot.displayName = 'MultiAppRoot';

  const StoreContext = /*#__PURE__*/React__namespace.createContext(null);
  unsafeEval.install(PIXI__namespace);
  PIXI__namespace.utils.skipHello();
  PIXI__namespace.settings.ROUND_PIXELS = true;

  const getRootMap = xs => {
    var _a;

    const react = {};
    const apps = [];

    for (const kernel of xs) {
      const app = (_a = kernel.getApp) === null || _a === void 0 ? void 0 : _a.call(kernel);

      if (app) {
        apps.push(app);
      } else {
        react[kernel.getAppType()] = kernel.getAppRoot();
      }
    }

    return [react, apps];
  };

  const isAppAction = (appId, appType) => operators.filter(({
    payload: {
      appId: createdId,
      appType: createdType
    }
  }) => createdId === appId && createdType === appType);

  const createPipe = (creator, state) => (appId, appType) => rxjs.pipe(hd_componentsUtils.isCreator(creator), isAppAction(appId, appType), operators.map(() => state), operators.take(1));

  const setGlobalDebugMode = mode => {
    if (window) {
      window.__debugMode = mode;
    } else {
      self.__debugMode = mode;
    }
  };

  const appInitialized = createPipe(embeddableAppInitializedAction, exports.EEmbeddableAppState.initialized);
  const appFailed = createPipe(embeddableAppFailedAction, exports.EEmbeddableAppState.failed);
  const appNoData = createPipe(embeddableAppNoDataAction, exports.EEmbeddableAppState.no_data);
  const appInitializing = createPipe(embeddableAppInitializingAction, exports.EEmbeddableAppState.initializing);
  class MultiAppFacade {
    constructor(kernels, mountNode, debugMode = false, themes = {}, params) {
      this.kernels = kernels;
      this.themes = themes;
      this.stage = new PIXI__namespace.Container();
      this.container = new hd_componentsDi.Container();
      this.tweenRegistry = new TweenRegistry();
      this.containerMap = {};
      this.destroyed = false;
      this.ticker = new PIXI__namespace.Ticker();
      this.gTick = 40; // 1000/40 = 25 frames per second, 1000/62.5 = 16

      this.gTime = 0;
      this.renderer = new PIXI__namespace.Renderer({
        antialias: true,
        // roundPixels: true,
        // forceFXAA: true,
        autoDensity: true,
        backgroundAlpha: 0 // resolution: window.devicePixelRatio,

      });

      this.onTick = () => {
        const timeNow = Date.now();
        const timeDiff = timeNow - this.gTime;

        if (timeDiff < this.gTick) {
          return;
        }

        this.gTime = timeNow;
        this.tweenRegistry.update();
        this.renderer.render(this.stage);
      };

      let resolveResource = {}; // workaround for container

      if (params && typeof params.resolveResource === 'function') {
        resolveResource = params.resolveResource;
      }

      const nonce = params === null || params === void 0 ? void 0 : params.nonce;
      this.resourceFontLoader = new ResourceLoader(resolveResource, nonce);
      setGlobalDebugMode(debugMode);
      mountNode.appendChild(this.renderer.view);
      this.container.set('tweenRegistry', this.tweenRegistry);
      this.container.set('mountNode', mountNode);
      this.container.set('renderer', this.renderer);
      this.container.set('stage', this.stage);
      this.container.set('resolveResource', resolveResource);
      this.container.set('nonce', nonce);

      if (params) {
        if (typeof params.tick === 'number') {
          this.gTick = params.tick;
        }
      }

      const {
        store,
        actionStream$
      } = createMultiAppStore(this.kernels, this.container, this.containerMap);
      this.store = store;
      this.actionStream$ = actionStream$;
      this.renderStage();
      this.startLoop();
      this.resourceFontLoader.addFont('RobotoCondensed_regular', '/Assets/fonts/TTF/RobotoCondensed_regular.ttf');
    }

    createApp(appType, appId, position, createParams) {
      this.assertNotDestroyed(); // todo shouldn't stop state stream. no one of states is finite state

      return rxjs.concat(rxjs.from(this.resourceFontLoader.loadAll()).pipe(operators.catchError(er => {
        logger.namespace('multiApp').info('Load fonts', er);
        return rxjs.EMPTY;
      }), operators.ignoreElements()), rxjs.merge(rxjs.merge(this.getActionStream().pipe(appInitializing(appId, appType)), this.getActionStream().pipe(appInitialized(appId, appType)), this.getActionStream().pipe(appNoData(appId, appType)), this.getActionStream().pipe(appFailed(appId, appType))).pipe(hd_componentsUtils.takeWhileInclusive(state => state === exports.EEmbeddableAppState.initializing)), rxjs.of(null).pipe(operators.tap(() => {
        // on subscribe dispatch create
        this.dispatch(createEmbeddableAppAction(appType, appId, position, createParams));
      }), operators.ignoreElements())));
    }

    destroyApp(appType, appId) {
      this.assertNotDestroyed();
      this.dispatch(destroyEmbeddableAppAction(appType, appId));
    }

    dispatch(action) {
      this.assertNotDestroyed();
      this.store.dispatch(action);
    }

    dispatchTo(action, appType, appId) {
      this.assertNotDestroyed();
      this.store.dispatch(ActionEnhancer(appType, appId)(action));
    }

    getStateStream() {
      this.assertNotDestroyed();
      return rxjs.Observable.create(observer => {
        this.store.subscribe(() => {
          observer.next(this.store.getState());
        });
      });
    }

    getStateStreamFor(appType, appId) {
      this.assertNotDestroyed();
      return this.getStateStream().pipe(operators.map(selectEmbeddedAppState(appType, appId)), operators.distinctUntilChanged());
    }

    getSate() {
      return this.store.getState();
    }

    getStateFor(appType, appId) {
      this.assertNotDestroyed();
      return selectEmbeddedAppState(appType, appId)(this.getSate());
    }

    getActionStream() {
      this.assertNotDestroyed();
      return this.actionStream$.asObservable();
    }

    getActionStreamFor(appType, appId) {
      return this.getActionStream().pipe(operators.filter(action => {
        if (!action.hasOwnProperty('metadata')) {
          return false;
        }

        if (!action.metadata.hasOwnProperty('multi')) {
          return false;
        }

        const {
          metadata: {
            multi: {
              appType: currentType,
              id
            }
          }
        } = action;
        return currentType === appType && id === appId;
      }));
    }

    destroy() {
      this.multiAppStage.destroy();
      this.assertNotDestroyed();
      this.dispatch(terminateMultiAppAction());
      this.stopLoop();
      this.tweenRegistry.removeAll();
      this.destroyed = true;
      this.actionStream$.complete();
      Promise.resolve().then(() => {
        reactPixi.render(null, this.stage);
        this.renderer.destroy(true);
      });
    }

    renderStage() {
      const mapSateToProps = reselect.createSelector(R__namespace.path(['apps']), R__namespace.path(['theme']), (apps, theme) => ({
        apps,
        theme
      }));
      const themes = R__namespace.mergeDeepRight(hd_componentsCommon.multiAppThemes, this.themes);
      const [roots, apps] = getRootMap(this.kernels);
      this.multiAppStage = new MultiAppStage(this.renderer, this.stage, this.store);
      this.multiAppStage.setContext(new StageContext(themes));

      for (const app of apps) {
        this.multiAppStage.append(app);
      }

      const rendererContext = {
        renderer: this.renderer,
        stage: this.stage
      };
      const Root = reactRedux.connect(mapSateToProps)(({
        apps,
        theme
      }) => jsxRuntime.jsx(ThemeProvider, Object.assign({
        value: themes[theme]
      }, {
        children: jsxRuntime.jsx(StoreContext.Provider, Object.assign({
          value: this.store
        }, {
          children: jsxRuntime.jsx(EmbeddableRootsContext.Provider, Object.assign({
            value: {
              roots,
              apps,
              containers: this.containerMap
            }
          }, {
            children: jsxRuntime.jsx(ContainerContext.Provider, Object.assign({
              value: this.container
            }, {
              children: jsxRuntime.jsx(RendererContext.Provider, Object.assign({
                value: rendererContext
              }, {
                children: jsxRuntime.jsx(TweenRegistryContext.Provider, Object.assign({
                  value: this.tweenRegistry
                }, {
                  children: jsxRuntime.jsx(MultiAppRoot, {}, void 0)
                }), void 0)
              }), void 0)
            }), void 0)
          }), void 0)
        }), void 0)
      }), void 0));
      reactPixi.render(jsxRuntime.jsx(reactRedux.Provider, Object.assign({
        store: this.store
      }, {
        children: jsxRuntime.jsx(Root, {}, void 0)
      }), void 0), this.stage);
    }

    startLoop() {
      this.ticker.speed = 0.5;
      this.ticker.add(this.onTick);
      this.ticker.start();
    }

    stopLoop() {
      this.ticker.destroy();
    }

    assertNotDestroyed() {
      if (this.destroyed) {
        throw new Error('MultiAppFacade destroyed try create new instance.');
      }
    }

  }

  class ResourceLoaderPass {
    process(containerBuilder, parameters) {
      return __awaiter(this, void 0, void 0, function* () {
        if (hd_componentsUtils.isUndefined(parameters.resources)) {
          return;
        }

        const loaderDefinition = containerBuilder.findDefinition("resourceLoader");

        if (hd_componentsUtils.isUndefined(loaderDefinition)) {
          throw new Error("Service with id: \"resourceLoader\" not found.");
        }

        parameters.resources.forEach(({
          path,
          type,
          name
        }) => {
          if (type === hd_componentsUtils.EResourceType.image || type === hd_componentsUtils.EResourceType.bitmap) {
            loaderDefinition.addMethodCalls(new hd_componentsDi.MethodCall("addResource", [name, path]));
          }

          if (type === hd_componentsUtils.EResourceType.font) {
            loaderDefinition.addMethodCalls(new hd_componentsDi.MethodCall("addFont", [name, path]));
          }
        });
      });
    }

  }

  class ResourceExtension {
    processGlobal(containerBuilder) {
      return;
    }

    processApp(containerBuilder, parameters) {
      containerBuilder.getCompiler().addPass(new ResourceLoaderPass(), this.getName());
      containerBuilder.addDefinitions(new hd_componentsDi.Definition().setId('resourceLoader').setClass(ResourceLoader).addArguments(containerBuilder.getParameter('resolveResource')).addArguments(containerBuilder.getOptionalParameter('nonce')));
    }

    getName() {
      return 'resource';
    }

  }

  class AbstractEmbeddableKernel {
    constructor(parameters = {}) {
      this.extensionRecords = [];
      this.globalBooted = false;
      this.parameters = {};
      Object.keys(parameters).forEach(envName => {
        const env = parameters[envName];

        if (typeof env !== 'object') {
          return;
        }

        if (!env.hasOwnProperty('@@parameters')) {
          env['@@parameters'] = {};
        }

        env['@@parameters'] = Object.assign(Object.assign({}, this.getDefaultParams()), env['@@parameters']);
      });
      this.parameters = parameters;
      this.globalContainerBuilder = new hd_componentsDi.ContainerBuilder(new hd_componentsDi.Compiler(), this.parameters, 'default');
      this.getExtensions().forEach(({
        extension,
        priority
      }) => this.addExtension(extension, priority));
    }

    boot(params, position, appId) {
      return __awaiter(this, void 0, void 0, function* () {
        const container = yield this.createContainer(params, 'default');
        const {
          epic,
          reducer
        } = yield this.createReducerAndEpic(container, position, appId);
        return {
          epic,
          reducer,
          container
        };
      });
    }

    addExtension(extension, priority = 1000) {
      this.extensionRecords.push({
        extension,
        priority
      });
    }

    createContainer(params, env) {
      return __awaiter(this, void 0, void 0, function* () {
        if (!this.globalBooted) {
          yield this.bootGlobal();
        }

        const containerParameters = this.resolveParameters(params, env);
        const appContainerBuilder = new hd_componentsDi.ContainerBuilder(new hd_componentsDi.Compiler(), containerParameters, env);
        appContainerBuilder.merge(this.globalContainerBuilder);
        const definitions = Object.values(this.getAppDefinitions()).map(definition => definition.clone());
        appContainerBuilder.addDefinitions(...definitions);
        this.getSortedExtensions().forEach(extension => {
          extension.processApp(appContainerBuilder, appContainerBuilder.getParametersFor(extension.getName()));
        });
        return appContainerBuilder.build();
      });
    }

    getDefaultParams() {
      return {};
    }

    getAppDefinitions() {
      return {};
    }

    getGlobalDefinitions() {
      return {};
    }

    getExtensions() {
      return [{
        extension: new ResourceExtension(),
        priority: 1000
      }];
    }

    bootGlobal() {
      return __awaiter(this, void 0, void 0, function* () {
        this.globalContainerBuilder.addDefinitions(...Object.values(this.getGlobalDefinitions()));
        this.getSortedExtensions().forEach(extension => extension.processGlobal(this.globalContainerBuilder));
        this.globalContainer = yield this.globalContainerBuilder.build(); // initialize all services in global container

        for (const id of this.globalContainer.getIds()) {
          yield this.globalContainer.get(id);
        }

        this.globalBooted = true;
      });
    }

    getSortedExtensions() {
      return this.extensionRecords.sort((a, b) => b.priority - a.priority).map(({
        extension
      }) => extension);
    }

    resolveParameters(parameters, env) {
      return R__namespace.mergeDeepLeft(this.parameters, {
        [env]: {
          '@@parameters': parameters
        }
      });
    }

  }

  const fLiner = (domain, range, x) => {
    const rise = range.from - range.to;
    const run = domain.from - domain.to;

    if (rise === 0 || run === 0) {
      return 0;
    }

    const slope = rise / run;
    const intercept = range.from - slope * domain.from;
    return slope * x + intercept;
  };
  const fLinerDecimal = (domain, range, x) => {
    const rise = range.from.minus(range.to);
    const run = domain.from.minus(domain.to);

    if (rise.eq(decimalUtils.ZERO) || run.eq(decimalUtils.ZERO)) {
      return decimalUtils.ZERO;
    }

    const slope = rise.div(run);
    const intercept = range.from.minus(slope.times(domain.from));
    return slope.times(x).add(intercept);
  };

  const viewportSelector = state => state.viewport;
  const widthSelector = state => viewportSelector(state).width;
  const heightSelector = state => viewportSelector(state).height;

  const skipRender = "@@SKIP";
  const SkipRenderProps = {
    [skipRender]: true
  };
  class SkipRender extends React__namespace.Component {
    render() {
      if (this.props.hasOwnProperty(skipRender)) {
        return null;
      }

      return this.props.render(this.props);
    }

  }
  const connectWithSkip = (selector, Component, staticProps = {}) => reactRedux.connect(selector)(props => jsxRuntime.jsx(SkipRender, Object.assign({}, props, {
    render: props => jsxRuntime.jsx(Component, Object.assign({}, props, staticProps), void 0)
  }), void 0));

  const Circle = reactPixi.PixiComponent("Circle", {
    create: props => {
      return new PIXI__namespace.Graphics();
    },
    applyProps: (instance, oldProps, newProps) => {
      const {
        color,
        x,
        y,
        radius,
        alpha
      } = newProps;
      instance.clear();
      instance.beginFill(color, alpha);
      instance.drawCircle(x, y, radius);
      instance.endFill();
    }
  });

  const Line = reactPixi.PixiComponent("Line", {
    create: props => {
      return new PIXI__namespace.Graphics();
    },
    applyProps: (instance, oldProps, newProps) => {
      const {
        color,
        lineWidth,
        alpha,
        lines,
        mask
      } = newProps;
      instance.clear().lineStyle(lineWidth, color, alpha);
      instance.mask = mask;
      lines.forEach(([from, to]) => {
        const [x1, y1] = from;
        const [x2, y2] = to;
        instance.moveTo(x1, y1).lineTo(x2, y2);
      });
      instance.endFill();
    }
  });

  const getNormalizedText = text => {
    switch (typeof text) {
      case 'string':
        return text;

      case 'number':
        return Number.isNaN(text) ? '' : text.toString();

      default:
        return '';
    }
  };

  exports.Label = class Label extends React__namespace.Component {
    render() {
      const {
        formatFunction,
        text,
        x,
        y,
        children,
        style,
        align,
        width,
        height
      } = this.props;
      const formatted = formatFunction(getNormalizedText(text));
      return jsxRuntime.jsx(reactPixi.Container, Object.assign({
        x: x,
        y: y
      }, {
        children: jsxRuntime.jsxs(jsxRuntime.Fragment, {
          children: [children, jsxRuntime.jsx(AlignText, {
            text: hd_componentsCommon.getFormattedNumber(formatted),
            style: style,
            vertical: 'middle',
            horizontal: align,
            width: width,
            height: height
          }, void 0)]
        }, void 0)
      }), void 0);
    }

  };
  exports.Label = __decorate([Pure()], exports.Label);
  /* tslint:disable-next-line*/

  class XAxisLabel extends React__namespace.Component {
    render() {
      return jsxRuntime.jsx(exports.Label, Object.assign({}, XAxisLabel.defaultProps, this.props, {
        x: this.props.x - this.props.width / 2,
        y: this.props.position === 'top' ? 0 : this.props.y - this.props.height
      }), void 0);
    }

  }
  XAxisLabel.defaultProps = {
    align: 'center'
  };
  /* tslint:disable-next-line*/

  class XAxisLabelWithBackground extends React__namespace.Component {
    render() {
      return jsxRuntime.jsx(XAxisLabel, Object.assign({}, this.props, {
        children: jsxRuntime.jsx(Rectangle, {
          color: this.props.color,
          alpha: this.props.alpha,
          width: this.props.width,
          height: this.props.height
        }, void 0)
      }), void 0);
    }

  }
  /* tslint:disable-next-line*/

  exports.YAxisLabel = class YAxisLabel extends React__namespace.Component {
    render() {
      return jsxRuntime.jsx(exports.Label, Object.assign({}, this.props, {
        align: this.props.position,
        x: this.props.position === 'left' ? 0 : this.props.x - this.props.width,
        y: this.props.y - this.props.height / 2
      }), void 0);
    }

  };
  exports.YAxisLabel = __decorate([Pure()], exports.YAxisLabel);

  const buildTriangleLabelPath = (width, height, position) => {
    return position === 'right' ? [height / 2, 0, 0, height / 2, height / 2, height, width, height, width, 0, -height / 2, 0] : [0, 0, width - height / 2, 0, width, height / 2, width - height / 2, height, 0, height, 0, 0];
  };

  const TriangleLabel = ({
    color,
    alpha,
    width,
    height,
    position
  }) => jsxRuntime.jsx(Polygon, {
    color: color,
    alpha: alpha,
    path: buildTriangleLabelPath(width, height, position)
  }, void 0);
  /* tslint:disable-next-line*/

  const TriangleYAxisLabelWithBackground = props => jsxRuntime.jsx(exports.YAxisLabel, Object.assign({}, props, {
    children: jsxRuntime.jsx(TriangleLabel, Object.assign({}, props), void 0)
  }), void 0);
  /* tslint:disable-next-line*/

  exports.ColoredRateLabel = class ColoredRateLabel extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.state = {
        prevRate: this.props.nextRate,
        nextRate: this.props.nextRate
      };
      this.symbolWidth = hd_componentsCommon.isTTF(this.props.style) ? new PIXI__namespace.Text('0', this.props.style).width : new PIXI__namespace.BitmapText('0', this.props.style).width;
    }

    static getDerivedStateFromProps(props, state) {
      return {
        prevRate: props.nextRate !== state.nextRate ? state.nextRate : state.prevRate,
        nextRate: props.nextRate
      };
    }

    render() {
      const {
        text: originalText,
        nextRate,
        formatFunction
      } = this.props;
      const text = typeof originalText !== 'string' ? originalText + '' : originalText;
      const coloredPart = hd_componentsUtils.stringDifferentPart(text, nextRate !== null && nextRate !== void 0 ? nextRate : '');
      const regularText = coloredPart === 0 ? text : text.slice(0, -coloredPart);
      const coloredText = text.replace(regularText, '');
      const formattedColored = formatFunction(coloredText);
      const formattedRegular = formatFunction(regularText);
      const colored = hd_componentsCommon.getFormattedNumber(formattedColored);
      const regularPostfix = !formattedRegular.fractionalPart && formattedColored && !formattedColored.fractionalPart ? formattedRegular.decimalSeparator : '';
      const regular = `${hd_componentsCommon.getFormattedNumber(formattedRegular)}${regularPostfix}`;
      const coloredPartWidth = this.getColoredPartWidth(colored);
      const color = this.getTintColor();
      const coloredStyle = Object.assign(Object.assign({}, this.props.style), {
        fill: color,
        tint: color
      });
      return jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [jsxRuntime.jsx(reactPixi.Container, Object.assign({
          x: this.props.x - this.props.width,
          y: this.props.y - this.props.height / 2
        }, {
          children: jsxRuntime.jsx(TriangleLabel, Object.assign({}, this.props), void 0)
        }), void 0), jsxRuntime.jsx(exports.YAxisLabel, Object.assign({}, this.props, {
          formatFunction: hd_componentsCommon.noopFormatFunction,
          text: regular,
          x: this.props.x - coloredPartWidth
        }), void 0), jsxRuntime.jsx(exports.YAxisLabel, Object.assign({}, this.props, {
          formatFunction: hd_componentsCommon.noopFormatFunction,
          text: colored,
          style: coloredStyle
        }), void 0)]
      }, void 0);
    }

    getColoredPartWidth(coloredText) {
      return this.symbolWidth * coloredText.length;
    }

    getTintColor() {
      return this.state.prevRate === this.state.nextRate ? hd_componentsCommon.getFillColor(this.props.style) : this.state.nextRate > this.state.prevRate ? this.props.coloredPart.up.color : this.props.coloredPart.down.color;
    }

  };
  exports.ColoredRateLabel = __decorate([Pure()], exports.ColoredRateLabel);

  const computeSymbolWidth = style => {
    if (hd_componentsCommon.isTTF(style) || !style.fontName) {
      return new PIXI.Text('0', style).width;
    }

    return new PIXI.BitmapText('0', style).width + (style.letterSpacing || 0) * 0.8;
  };

  class SeparatedNumber extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.textRefs = [];
      this.containerRef = /*#__PURE__*/React__namespace.createRef();

      this.setRef = ref => this.textRefs.push(ref);

      this.getLetterHeight = () => {
        // if (this.props.parts[0] && !isTTF(this.props.parts[0].style)) {
        //   return ((this.props.parts[0].style as IBitmapTextStyle).font as any).size as number;
        // }
        return this.textRefs[0].height;
      };
    }

    render() {
      return jsxRuntime.jsx(NotUpdate, {
        children: jsxRuntime.jsx(reactPixi.Container, Object.assign({
          ref: this.containerRef
        }, {
          children: this.props.parts.map((part, i) => hd_componentsCommon.isTTF(part.style) ? jsxRuntime.jsx(reactPixi.Text, {
            ref: this.setRef,
            style: part.style
          }, i) : jsxRuntime.jsx(reactPixi.BitmapText, {
            ref: this.setRef,
            style: part.style,
            text: '',
            letterSpacing: part.style.letterSpacing
          }, i))
        }), void 0)
      }, void 0);
    }

    shouldComponentUpdate(nextProps, nextState) {
      return !deepEqual__default["default"](this.props, nextProps);
    }

    componentDidMount() {
      this.update(this.props);
    }

    componentDidUpdate(prevProps) {
      this.update(prevProps);
    }

    update(prevProps) {
      let offset = 0;
      this.props.parts.forEach(({
        part,
        style
      }, i) => {
        if (!deepEqual__default["default"](prevProps.parts[i].style, style)) {
          if (hd_componentsCommon.isTTF(style)) {
            const inst = this.textRefs[i];
            inst.style.fill = hd_componentsCommon.getFillColor(style);
          } else {
            const inst = this.textRefs[i];
            inst.tint = hd_componentsCommon.getFillColor(style);
          }
        }

        this.textRefs[i].text = part;
        this.textRefs[i].x = offset;
        let letterSpacing = 0;

        if (this.props.parts[0]) {
          letterSpacing = this.props.parts[0].style.letterSpacing || 0;
        }

        offset += this.textRefs[i].text === ' ' || this.textRefs[i].text === '' ? 0 : this.textRefs[i].width + letterSpacing / 2;
      });
      this.containerRef.current.x = this.props.width - offset;
      this.containerRef.current.y = (this.props.height - this.getLetterHeight()) / 2;

      if (this.props.align) {
        alignHorizontal(this.containerRef.current, this.props.width, offset, this.props.align);
      }
    }

  }

  exports.Price = class Price extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.symbolWidth = this.props.limitPrecision ? computeSymbolWidth(this.props.style) : 0;
    }

    render() {
      const {
        price,
        decimalPart,
        width,
        height,
        style,
        align,
        formatPrice
      } = this.props;
      const realPrecision = this.props.limitPrecision ? hd_componentsUtils.getRealPrecision(price, decimalPart, this.symbolWidth, width) : decimalPart;
      const {
        integerPart,
        decimalSeparator,
        fractionalPart
      } = formatPrice(price.toFixed(realPrecision));
      return jsxRuntime.jsx(SeparatedNumber, {
        width: width,
        height: height,
        align: align,
        parts: [{
          part: integerPart ? `${integerPart}${decimalSeparator}` : '',
          style // alpha: 0.5,

        }, {
          part: fractionalPart || '',
          style // alpha: 1

        }]
      }, void 0);
    }

  };
  exports.Price.defaultProps = {
    limitPrecision: false
  };
  exports.Price = __decorate([Pure()], exports.Price);

  class MarketQuantity extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.state = {
        grow: undefined
      };
      this.symbolWidth = this.props.limitPrecision ? computeSymbolWidth(this.props.ceilPartStyle) : 0;
    }

    shouldComponentUpdate(nextProps, nextState) {
      if (nextState.grow !== this.state.grow) {
        return true;
      }

      return !deepEqual__default["default"](this.props, nextProps);
    }

    render() {
      const {
        ceilPart,
        decimalPart,
        zeroPart
      } = this.split(this.props.quantity);
      const {
        integerPart,
        fractionalPart,
        decimalSeparator
      } = this.props.formatQuantity(`${ceilPart}.${decimalPart}`);
      return jsxRuntime.jsx(SeparatedNumber, {
        width: this.props.width,
        height: this.props.height,
        align: this.props.align,
        parts: [{
          part: `${integerPart}${fractionalPart || zeroPart ? decimalSeparator : ''}`,
          style: this.props.ceilPartStyle
        }, {
          part: fractionalPart,
          style: this.props.decimalPartStyle
        }, {
          part: zeroPart,
          style: this.props.zeroPartStyle
        }]
      }, void 0);
    }

    split(quantity) {
      if (this.props.abbreviations) {
        const qty = new big_js.Big(quantity);
        const [ceilPart, _decimalPart = ''] = decimalUtils.abbreviateDecimal(qty, {
          precision: this.props.precision
        }).split('.');
        return {
          ceilPart,
          decimalPart: _decimalPart,
          zeroPart: ''
        };
      }

      const {
        ceil,
        decimal: decimalPart,
        zero: zeroPart
      } = this.props.limitPrecision ? hd_componentsUtils.splitPriceWithMaxWidth(quantity, this.props.precision, this.symbolWidth, this.props.width) : hd_componentsUtils.splitPrice(quantity, this.props.precision);
      return {
        ceilPart: ceil,
        decimalPart,
        zeroPart
      };
    }

  }
  MarketQuantity.defaultProps = {
    limitPrecision: false
  };

  class ScrolledList extends React__namespace.Component {
    constructor(p, c) {
      super(p, c);
      this.state = {
        mouseOnList: false,
        touchY: -1
      };
      this.ref = /*#__PURE__*/React__namespace.createRef();
      this.hitArea = new PIXI__namespace.Rectangle(0, 0, this.props.width, this.props.height);

      this.setListener = view => {
        if (undefined !== this.view) {
          return;
        }

        view.addEventListener('wheel', this.onWheel);
        view.addEventListener('touchstart', this.onTouch);
        view.addEventListener('touchend', this.onTouch);
        view.addEventListener('touchmove', this.onTouch, true);
        this.view = view;
      };

      this.computeScroll = (direction, currentScroll, height) => {
        const maxScroll = this.props.height - height;
        return hd_componentsUtils.boundary(0, maxScroll)(currentScroll + 25 * direction);
      };

      this.onPointerOver = () => {
        this.setState({
          mouseOnList: true
        });
      };

      this.onPointerOut = () => {
        this.setState({
          mouseOnList: false
        });
      };

      this.onWheel = event => {
        event.preventDefault();

        if (!this.state.mouseOnList) {
          return;
        }

        const {
          height,
          width,
          x,
          y
        } = this.props;
        const isHit = event.offsetX >= x && event.offsetX <= x + width && event.offsetY >= y && event.offsetY <= y + height;

        if (!isHit) {
          return;
        }

        this.updateScroll(normalizeWheel__default["default"](event).pixelY);
      };

      this.updateScroll = delta => {
        this.ref.current.y = this.computeScroll(delta > 0 ? -1 : 1, this.ref.current.y, this.ref.current.height);
      };

      this.onTouch = e => {
        e.preventDefault();
        const touchY = e.touches.length ? e.touches[0].pageY : -1;

        if (e.type === 'touchmove' && this.state.touchY >= 0) {
          this.updateScroll(this.state.touchY - touchY);
        }

        this.setState({
          touchY
        });
      };

      if (this.props.computeScroll) {
        this.computeScroll = this.props.computeScroll;
      }
    }

    render() {
      // update hitArea
      this.hitArea.width = this.props.width;
      this.hitArea.height = this.props.height;
      return jsxRuntime.jsx(RendererContext.Consumer, {
        children: ({
          renderer
        }) => {
          this.setListener(renderer.view);
          return jsxRuntime.jsx(reactPixi.Container, Object.assign({
            hitArea: this.hitArea,
            pointerover: this.onPointerOver,
            pointerout: this.onPointerOut,
            interactive: true
          }, {
            children: jsxRuntime.jsx(reactPixi.Container, Object.assign({
              ref: this.ref
            }, {
              children: this.props.children
            }), void 0)
          }), void 0);
        }
      }, void 0);
    }

    componentWillUnmount() {
      if (undefined === this.view) {
        return;
      }

      this.view.removeEventListener('wheel', this.onWheel);
      this.view.removeEventListener('touchstart', this.onTouch);
      this.view.removeEventListener('touchend', this.onTouch);
      this.view.removeEventListener('touchmove', this.onTouch);
    }

  }

  class WithHover extends React__namespace.Component {
    constructor() {
      super(...arguments);
      this.state = {
        hovered: false
      };

      this.toggleHover = () => this.setState({
        hovered: !this.state.hovered
      });
    }

    render() {
      return jsxRuntime.jsx(reactPixi.Container, Object.assign({
        pointerover: this.toggleHover,
        pointerout: this.toggleHover,
        interactive: true,
        hitArea: new PIXI__namespace.Rectangle(0, 0, this.props.width, this.props.height)
      }, {
        children: this.props.children(this.state.hovered)
      }), void 0);
    }

  }

  const connectComponent = (mapStateToProps, Component, staticProps = {}) => reactRedux.connect(mapStateToProps)(props => jsxRuntime.jsx(Component, Object.assign({}, props, staticProps), void 0));

  const createStaticLengthList = (maxLength, staticProps, stub, Component) => _a => {
    var {
      list
    } = _a,
        rest = __rest(_a, ["list"]);

    return lodash.range(0, maxLength, 1).map(i => {
      const visible = undefined !== list[i];
      const props = visible ? list[i] : stub;
      return jsxRuntime.jsx(reactPixi.Container, Object.assign({
        visible: visible
      }, {
        children: jsxRuntime.jsx(Component, Object.assign({}, staticProps, props, rest), void 0)
      }), i);
    });
  };

  const selectAppState = (appType, appId, selector) => state => {
    try {
      return selector({
        app: state.apps[appType][appId].state.app
      });
    } catch (_a) {
      return undefined;
    }
  };

  class ComponentStage {
    constructor(stage, index) {
      this.stage = stage;
      this.index = index;
    }

  }

  const appendContainer = (parent, child, index) => {
    if (index == null) {
      parent.addChild(child);
    } else {
      parent.addChildAt(child, Math.min(parent.children.length, index));
    }
  };
  const setContainerIndex = (parent, child, index) => {
    if (index == null) {
      return;
    }

    parent.setChildIndex(child, Math.max(0, Math.min(parent.children.length - 1, index)));
  };

  class Graphics extends ComponentStage {
    constructor(stage, index) {
      super(stage, index);
      this.index = index;
      this.root = new PIXI__namespace.Graphics();
      appendContainer(this.stage, this.root, index);
    }

    destroy() {
      this.stage.removeChild(this.root);
      this.root.destroy();
    }

  }

  class Container extends ComponentStage {
    constructor(stage, index) {
      super(stage, index);
      this.index = index;
      this.root = new PIXI__namespace.Container();
      appendContainer(this.stage, this.root, index);
    }

    destroy() {
      this.stage.removeChild(this.root);
      this.root.destroy();
    }

  }

  const toAlign = v => {
    switch (v) {
      case 'left':
      case 'bottom':
        return 0;

      case 'right':
      case 'top':
        return 1;

      default:
        return 0.5;
    }
  };

  class Text extends Container {
    setState(state, context, dispatch) {
      const {
        style,
        text,
        x,
        y,
        width,
        height,
        horizontalAlign = 'mid',
        verticalAlign = 'mid',
        interactive,
        pointerdown
      } = state;
      this.root.x = x;
      this.root.y = y;
      this.root.width = width;
      this.root.height = height;
      this.root.scale.set(1, 1);

      if (this.textElement) {
        this.textElement.text = text;

        if (this.textElement instanceof PIXI__namespace.Text) {
          this.textElement.style = style;
        } else {
          this.textElement.tint = style.tint;
        }
      } else {
        this.init(text, style);

        if (interactive) {
          this.textElement.interactive = interactive;
          this.textElement.buttonMode = interactive;

          if (pointerdown) {
            this.textElement.on('pointerdown', pointerdown); // TODO: need remove?
          }
        }
      }

      if (this.textElement) {
        const v = toAlign(verticalAlign);
        const h = toAlign(horizontalAlign);
        this.textElement.anchor.set(h, v);
      }

      setContainerIndex(this.stage, this.root, this.index);
    }

    destroy() {
      if (this.textElement) {
        this.root.removeChild(this.textElement);
        this.textElement.destroy();
      }

      super.destroy();
    }

    init(text, style) {
      if (this.textElement || !style) {
        return;
      }

      if (!hd_componentsCommon.isTTF(style) && style.fontName) {
        this.textElement = new PIXI__namespace.BitmapText(text, style);
      } else {
        this.textElement = new PIXI__namespace.Text(text, style);
      }

      appendContainer(this.root, this.textElement, this.index);
    }

  }
  class TextWithBackground extends Text {
    constructor(stage, index) {
      super(stage, index);
      this.g = new PIXI__namespace.Graphics();
      appendContainer(this.root, this.g, 0);
    }

    setState(state, context, dispatch) {
      const {
        backgroundColor,
        backgroundAlpha = 1,
        width,
        height,
        verticalAlign,
        horizontalAlign,
        triangle
      } = state;
      const v = toAlign(verticalAlign);
      const h = toAlign(horizontalAlign);
      const x = -h * width;
      const y = -v * height;
      this.g.clear().beginFill(backgroundColor, backgroundAlpha).drawRect(x, y, width, height);

      if (triangle) {
        this.g.moveTo(x, y).lineTo(x, y + height).lineTo(x - height / 2, y + height / 2).lineTo(x, y);
      }

      this.g.endFill();
      setContainerIndex(this.root, this.g, 0);
      super.setState(state, context, dispatch);
    }

    destroy() {
      this.root.removeChild(this.g);
      this.g.destroy();
      super.destroy();
    }

  }

  exports.AbstractEmbeddableKernel = AbstractEmbeddableKernel;
  exports.AlignText = AlignText;
  exports.Circle = Circle;
  exports.ComponentStage = ComponentStage;
  exports.Container = Container;
  exports.Ease = Ease;
  exports.Graphics = Graphics;
  exports.Line = Line;
  exports.Liner = Liner;
  exports.MarketQuantity = MarketQuantity;
  exports.MultiAppFacade = MultiAppFacade;
  exports.MultiAppStage = MultiAppStage;
  exports.Pure = Pure;
  exports.Rectangle = Rectangle;
  exports.ResourceLoader = ResourceLoader;
  exports.ScrolledList = ScrolledList;
  exports.SeparatedNumber = SeparatedNumber;
  exports.ServerTime = ServerTime;
  exports.SkipRender = SkipRender;
  exports.SkipRenderProps = SkipRenderProps;
  exports.StageContext = StageContext;
  exports.StoreContext = StoreContext;
  exports.Styled = Styled;
  exports.SyncTime = SyncTime;
  exports.Text = Text;
  exports.TextWithBackground = TextWithBackground;
  exports.ThemeContext = ThemeContext;
  exports.ThemeProvider = ThemeProvider;
  exports.TriangleLabel = TriangleLabel;
  exports.TriangleYAxisLabelWithBackground = TriangleYAxisLabelWithBackground;
  exports.Tween = Tween;
  exports.TweenRegistryContext = TweenRegistryContext;
  exports.WithHover = WithHover;
  exports.WithResources = WithResources;
  exports.WithTween = WithTween;
  exports.XAxisLabel = XAxisLabel;
  exports.XAxisLabelWithBackground = XAxisLabelWithBackground;
  exports.alignHorizontal = alignHorizontal;
  exports.appInitializedAction = appInitializedAction;
  exports.appendContainer = appendContainer;
  exports.changeDragAction = changeDragAction;
  exports.changeMagnetAction = changeMagnetAction;
  exports.changeOnCanvasAction = changeOnCanvasAction;
  exports.changePositionAction = changePositionAction;
  exports.changeThemeAction = changeThemeAction;
  exports.clickAction = clickAction;
  exports.computeSymbolWidth = computeSymbolWidth;
  exports.connectComponent = connectComponent;
  exports.connectWithSkip = connectWithSkip;
  exports.createEmbeddableAppAction = createEmbeddableAppAction;
  exports.createMultiAppStore = createMultiAppStore;
  exports.createStaticLengthList = createStaticLengthList;
  exports.destroyEmbeddableAppAction = destroyEmbeddableAppAction;
  exports.dragMoveAction = dragMoveAction;
  exports.embeddableAppFailedAction = embeddableAppFailedAction;
  exports.embeddableAppInitializedAction = embeddableAppInitializedAction;
  exports.embeddableAppInitializingAction = embeddableAppInitializingAction;
  exports.embeddableAppKernelCreatedAction = embeddableAppKernelCreatedAction;
  exports.embeddableAppNoDataAction = embeddableAppNoDataAction;
  exports.embeddableAppUpdatePositionAction = embeddableAppUpdatePositionAction;
  exports.fLiner = fLiner;
  exports.fLinerDecimal = fLinerDecimal;
  exports.heightSelector = heightSelector;
  exports.initialInputState = initialInputState;
  exports.initialViewportState = initialViewportState;
  exports.multiAppInitialState = multiAppInitialState;
  exports.multiAppUpdateViewportAction = multiAppUpdateViewportAction;
  exports.noDataAction = noDataAction;
  exports.pointDownAction = pointDownAction;
  exports.pointUpAction = pointUpAction;
  exports.selectAppState = selectAppState;
  exports.setContainerIndex = setContainerIndex;
  exports.shallowEqual = shallowEqual;
  exports.shallowEqualState = shallowEqualState;
  exports.shallowEqualWithoutReactElements = shallowEqualWithoutReactElements;
  exports.skipRender = skipRender;
  exports.terminateMultiAppAction = terminateMultiAppAction;
  exports.updateViewportAction = updateViewportAction;
  exports.useTween = useTween;
  exports.viewportSelector = viewportSelector;
  exports.wheelAction = wheelAction;
  exports.widthSelector = widthSelector;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
