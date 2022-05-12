(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@deltix/vizceral'), require('@juggle/resize-observer'), require('@angular/common')) :
    typeof define === 'function' && define.amd ? define('@deltix/ngx-vizceral', ['exports', '@angular/core', '@deltix/vizceral', '@juggle/resize-observer', '@angular/common'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.deltix = global.deltix || {}, global.deltix['ngx-vizceral'] = {}), global.ng.core, global.VizceralGraph, global.resizeObserver, global.ng.common));
}(this, (function (exports, i0, VizceralGraph, resizeObserver, common) { 'use strict';

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
                        get: function () {
                            return e[k];
                        }
                    });
                }
            });
        }
        n['default'] = e;
        return Object.freeze(n);
    }

    var i0__namespace = /*#__PURE__*/_interopNamespace(i0);
    var VizceralGraph__default = /*#__PURE__*/_interopDefaultLegacy(VizceralGraph);

    var NgxVizceralService = /** @class */ (function () {
        function NgxVizceralService() {
        }
        return NgxVizceralService;
    }());
    NgxVizceralService.ɵfac = i0__namespace.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: NgxVizceralService, deps: [], target: i0__namespace.ɵɵFactoryTarget.Injectable });
    NgxVizceralService.ɵprov = i0__namespace.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: NgxVizceralService, providedIn: 'root' });
    i0__namespace.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: NgxVizceralService, decorators: [{
                type: i0.Injectable,
                args: [{
                        providedIn: 'root',
                    }]
            }], ctorParameters: function () { return []; } });

    var VizceralDirective = /** @class */ (function () {
        function VizceralDirective(zone, elementRef) {
            this.zone = zone;
            this.elementRef = elementRef;
            this.viewChanged = new i0.EventEmitter();
            this.viewUpdated = new i0.EventEmitter();
            this.objectHighlighted = new i0.EventEmitter();
            this.nodeContextSizeChanged = new i0.EventEmitter();
            this.matchesFound = new i0.EventEmitter();
            this.nodeUpdated = new i0.EventEmitter();
            this.objectHovered = new i0.EventEmitter();
            this.definitions = null;
            this.traffic = null;
            // ANDY// private objectsJSON: any = null;
            this.view = null;
            this.showLabels = true;
            // private initialTraffic: any = null;
            this.filters = null;
            this.objectToHighlight = null;
            this.match = null;
            this.modes = null;
            this.allowDraggingOfNodes = false;
            this.styles = null;
            this.targetFramerate = null;
            this.ro = null;
            this.instance = null;
            this.initialWidth = null;
            this.initialHeight = null;
            /* @Input()
             set traffic(data: any) {
             this.setTraffic(data);
             }*/
            this.defaultProps = {
                connectionHighlighted: function () { },
                definitions: {},
                filters: [],
                match: '',
                nodeHighlighted: function () { },
                nodeUpdated: function () { },
                nodeContextSizeChanged: function () { },
                matchesFound: function () { },
                objectHighlighted: function () { },
                objectHovered: function () { },
                objectToHighlight: null,
                showLabels: true,
                allowDraggingOfNodes: false,
                styles: {},
                traffic: {},
                viewChanged: function () { },
                viewUpdated: function () { },
                view: [],
                targetFramerate: null,
            };
        }
        Object.defineProperty(VizceralDirective.prototype, "size", {
            set: function (size) {
                this.setSize(size.width, size.height);
            },
            enumerable: false,
            configurable: true
        });
        VizceralDirective.prototype.ngOnInit = function () {
            var _this = this;
            this.zone.runOutsideAngular(function () {
                var elRef = _this.elementRef.nativeElement;
                var size = {};
                if (_this.initialSize) {
                    size = _this.initialSize;
                }
                else if (_this.useCurrentInitialSize) {
                    size = {
                        width: elRef.offsetWidth,
                        height: elRef.offsetHeight,
                    };
                }
                _this.instance = new VizceralGraph__default['default'](elRef, _this.targetFramerate, size);
                _this.instance.on('viewChanged', function (event) {
                    _this.zone.run(function () {
                        _this.viewChanged.emit(event);
                    });
                });
                _this.instance.on('objectHighlighted', function (event) {
                    _this.zone.run(function () {
                        _this.objectHighlighted.emit(event);
                    });
                });
                _this.instance.on('objectHovered', function (event) {
                    _this.zone.run(function () {
                        _this.objectHovered.emit(event);
                    });
                });
                _this.instance.on('nodeUpdated', function (event) {
                    _this.zone.run(function () {
                        _this.nodeUpdated.emit(event);
                    });
                });
                _this.instance.on('nodeContextSizeChanged', function (event) {
                    _this.zone.run(function () {
                        _this.nodeContextSizeChanged.emit(event);
                    });
                });
                _this.instance.on('matchesFound', function (event) {
                    _this.zone.run(function () {
                        _this.matchesFound.emit(event);
                    });
                });
                _this.instance.on('viewUpdated', function (event) {
                    _this.zone.run(function () {
                        _this.viewUpdated.emit(event);
                    });
                });
                // Pass our defaults to Vizceral in the case that it has different defaults.
                _this.instance.setOptions({
                    allowDraggingOfNodes: _this.allowDraggingOfNodes,
                    showLabels: _this.showLabels,
                });
                //   //return back for this
                //  if (!isEqual(this.filters, this.defaultProps.filters)) {
                //     this.instance.setFilters(this.filters);
                //   }
                //   if (!isEqual(this.definitions, this.defaultProps.definitions)) {
                //     this.instance.updateDefinitions(this.definitions);
                //   }
                // Finish the current call stack before updating the view.
                // If vizceral-react was passed data directly without any asynchronous
                // calls to retrieve the data, the initially loaded graph would not
                // animate properly.
                setTimeout(function () {
                    // let renderers = {
                    //   global: GlobalTrafficGraph,
                    //   region: RegionTrafficGraph,
                    //   focused: FocusedTrafficGraph,
                    //   focusedChild: FocusedChildTrafficGraph,
                    //   dns: DnsTrafficGraph
                    // };
                    // console.log ("Renderers:");
                    // console.log (renderers);
                    // //this.instance.setRenderers(renderers);
                    _this.instance.setView(_this.view || _this.defaultProps.view, _this.objectToHighlight);
                    _this.instance.updateData(_this.traffic);
                    var perfNow = _this.getPerformanceNow();
                    _this.instance.animate(perfNow === null ? 0 : perfNow);
                    _this.instance.updateBoundingRectCache();
                    // console.log('VizceralGraph:')
                    // console.log(this.instance)
                }, 0);
            });
            this.zone.runOutsideAngular(function () {
                _this.ro = new resizeObserver.ResizeObserver(function (entries, observer) {
                    var element = _this.elementRef.nativeElement.parentElement.parentElement;
                    if (!_this.initialWidth) {
                        _this.setSize(element.offsetWidth, element.offsetHeight);
                    }
                });
                _this.ro.observe(_this.elementRef.nativeElement.parentElement.parentElement);
            });
        };
        VizceralDirective.prototype.ngAfterViewInit = function () {
            // ANDY
            //       // Pass our defaults to Vizceral in the case that it has different defaults.
            //       this.instance.setOptions({
            //         allowDraggingOfNodes: this.allowDraggingOfNodes,
            //         showLabels: this.showLabels
            //       });
        };
        VizceralDirective.prototype.getPerformanceNow = function () {
            var g = window;
            if (g != null) {
                var perf = g.performance;
                if (perf != null) {
                    try {
                        var perfNow = perf.now();
                        if (typeof perfNow === 'number') {
                            return perfNow;
                        }
                    }
                    catch (e) {
                        // do nothing
                    }
                }
            }
            return null;
        };
        VizceralDirective.prototype.ngOnDestroy = function () {
            console.log('VizceralComponent:ngOnDestroy() - suppressing instance.destroy()');
            if (this.ro) {
                this.ro.disconnect();
            }
            if (this.instance) {
                // ANDY//this.objectsJSON = this.instance.toJSON();
                // ANDY// this.instance.dispose(); // <-- doesn't work
                delete this.instance;
                this.instance = null;
            }
        };
        VizceralDirective.prototype.ngDoCheck = function () {
            if (this.configDiff) {
                var changes = this.configDiff.diff(this.config || {});
                if (changes) {
                    this.ngOnDestroy();
                    this.ngOnInit();
                }
            }
        };
        VizceralDirective.prototype.ngOnChanges = function (changes) {
            // console.log('VizceralDirective:ngOnChanges())');
            if (this.instance && changes.disabled) {
                if (changes.disabled.currentValue !== changes.disabled.previousValue) {
                    this.ngOnDestroy();
                    this.ngOnInit();
                }
                else if (changes.traffic) {
                    // console.log('VizceralDirective:ngOnChanges(traffic)');
                    this.instance.updateData(this.traffic);
                }
            }
        };
        VizceralDirective.prototype.vizceral = function () {
            return this.instance;
        };
        VizceralDirective.prototype.setView = function (view) {
            this.view = view;
            this.instance.setView(this.view || this.defaultProps.view, this.objectToHighlight);
        };
        VizceralDirective.prototype.setSize = function (width, height) {
            this.initialWidth = width;
            this.initialHeight = height;
            if (this.instance) {
                this.instance.setSize(width, height);
            }
        };
        return VizceralDirective;
    }());
    VizceralDirective.ɵfac = i0__namespace.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: VizceralDirective, deps: [{ token: i0__namespace.NgZone }, { token: i0__namespace.ElementRef }], target: i0__namespace.ɵɵFactoryTarget.Directive });
    VizceralDirective.ɵdir = i0__namespace.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "12.0.0", type: VizceralDirective, selector: "[vizceral]", inputs: { definitions: "definitions", traffic: "traffic", view: "view", showLabels: "showLabels", filters: "filters", objectToHighlight: "objectToHighlight", match: "match", modes: "modes", allowDraggingOfNodes: "allowDraggingOfNodes", styles: "styles", targetFramerate: "targetFramerate", initialSize: "initialSize", useCurrentInitialSize: "useCurrentInitialSize", config: ["vizceral", "config"], size: "size" }, outputs: { viewChanged: "viewChanged", viewUpdated: "viewUpdated", objectHighlighted: "objectHighlighted", nodeContextSizeChanged: "nodeContextSizeChanged", matchesFound: "matchesFound", nodeUpdated: "nodeUpdated", objectHovered: "objectHovered" }, exportAs: ["ngxVizceral"], usesOnChanges: true, ngImport: i0__namespace });
    i0__namespace.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: VizceralDirective, decorators: [{
                type: i0.Directive,
                args: [{
                        selector: '[vizceral]',
                        exportAs: 'ngxVizceral',
                    }]
            }], ctorParameters: function () { return [{ type: i0__namespace.NgZone }, { type: i0__namespace.ElementRef }]; }, propDecorators: { viewChanged: [{
                    type: i0.Output
                }], viewUpdated: [{
                    type: i0.Output
                }], objectHighlighted: [{
                    type: i0.Output
                }], nodeContextSizeChanged: [{
                    type: i0.Output
                }], matchesFound: [{
                    type: i0.Output
                }], nodeUpdated: [{
                    type: i0.Output
                }], objectHovered: [{
                    type: i0.Output
                }], definitions: [{
                    type: i0.Input
                }], traffic: [{
                    type: i0.Input
                }], view: [{
                    type: i0.Input
                }], showLabels: [{
                    type: i0.Input
                }], filters: [{
                    type: i0.Input
                }], objectToHighlight: [{
                    type: i0.Input
                }], match: [{
                    type: i0.Input
                }], modes: [{
                    type: i0.Input
                }], allowDraggingOfNodes: [{
                    type: i0.Input
                }], styles: [{
                    type: i0.Input
                }], targetFramerate: [{
                    type: i0.Input
                }], initialSize: [{
                    type: i0.Input
                }], useCurrentInitialSize: [{
                    type: i0.Input
                }], config: [{
                    type: i0.Input,
                    args: ['vizceral']
                }], size: [{
                    type: i0.Input
                }] } });

    var VizceralComponent = /** @class */ (function () {
        function VizceralComponent() {
            // private json: any = null;
            this.initData = null;
            // @Input()
            // set data(data: string) {
            //   this.setJSON(data);
            // }
            this.size = { width: null, height: null };
            this.view = null;
            this.showLabels = null;
            this.filters = null;
            this.objectToHighlight = null;
            this.match = null;
            this.modes = null;
            this.allowDraggingOfNodes = null;
            this.styles = null;
            this.targetFramerate = null;
            this.viewChanged = new i0.EventEmitter();
            this.viewUpdated = new i0.EventEmitter();
            this.objectHighlighted = new i0.EventEmitter();
            this.nodeContextSizeChanged = new i0.EventEmitter();
            this.matchesFound = new i0.EventEmitter();
            this.nodeUpdated = new i0.EventEmitter();
            this.objectHovered = new i0.EventEmitter();
        }
        Object.defineProperty(VizceralComponent.prototype, "traffic", {
            // @Input() traffic: any = null;
            set: function (data) {
                this.setTraffic(data);
            },
            enumerable: false,
            configurable: true
        });
        VizceralComponent.prototype.ngAfterViewInit = function () {
            // if (this.json != null) {
            //   this.setJSON(this.json, true);
            // }
        };
        VizceralComponent.prototype.ngOnChanges = function (changes) {
        };
        VizceralComponent.prototype.vizceral = function () {
            return this.directiveRef.vizceral();
        };
        VizceralComponent.prototype.setView = function (view) {
            this.directiveRef.setView(view);
        };
        VizceralComponent.prototype.locate = function (searchText) {
            // console.log('Locating nodes that match: ' + searchText);
            this.vizceral().findNodes(searchText);
        };
        VizceralComponent.prototype.setTraffic = function (data) {
            this.initData = data;
            // if (data != null) {
            //   this.initData['QuantServer']._particleSystem = {
            //       isEnabled: true,
            //       viscousDragCoefficient: 0.2,
            //       hooksSprings: {
            //         restLength: 50,
            //         springConstant: 0.2,
            //         dampingConstant: 0.1
            //       },
            //       particles: {
            //         mass: 1
            //       }
            //   };
            // }
            if (this.directiveRef && this.directiveRef.vizceral()) {
                // console.log('VizceralComponent:setTraffic');
                // console.log(data)
                // console.log(this.directiveRef.vizceral());
                this.vizceral().updateData(data);
                // console.log('VizceralGraph:')
                // console.log(this.vizceral())
                // console.log('Graph:')
                // let graph = this.vizceral().getGraph('QuantServer', null) as TrafficGraph;
                // if (graph) {
                //   let options = {
                //     ...graph.getPhysicsOptions (),
                //     isEnabled: true,
                //     jaspersReplusionBetweenParticles: true,
                //     viscousDragCoefficient: 0.2,
                //     hooksSprings: {
                //       restLength: 50,
                //       springConstant: 0.2,
                //       dampingConstant: 0.1
                //     },
                //     particles: {
                //       mass: 1
                //     }
                //   };
                //   let flag = false;
                //   let _particleSystem_isEnabled = false;
                //   if (hasOwnPropF.call(options, 'isEnabled')) {
                //     let { isEnabled } = options;
                //     options = { ...options};
                //     delete options.isEnabled;
                //     if (typeof isEnabled !== 'boolean') {
                //       console.warn('Got non-boolean value for PhysicsOptions.isEnabled, coercing to boolean:', isEnabled);
                //       isEnabled = !!isEnabled;
                //     }
                //     flag = _particleSystem_isEnabled !== isEnabled;
                //     _particleSystem_isEnabled = isEnabled;
                //   }
                //   console.log ("IS ENABLED: " + flag);
                //   console.log(graph.getPhysicsOptions ());
                //   console.log(options);
                //   graph.setPhysicsOptions(options);
                //   console.log(graph);
                // }
            }
        };
        return VizceralComponent;
    }());
    VizceralComponent.ɵfac = i0__namespace.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: VizceralComponent, deps: [], target: i0__namespace.ɵɵFactoryTarget.Component });
    VizceralComponent.ɵcmp = i0__namespace.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "12.0.0", type: VizceralComponent, selector: "vizceral", inputs: { size: "size", view: "view", showLabels: "showLabels", filters: "filters", objectToHighlight: "objectToHighlight", match: "match", modes: "modes", allowDraggingOfNodes: "allowDraggingOfNodes", styles: "styles", targetFramerate: "targetFramerate", initialSize: "initialSize", useCurrentInitialSize: "useCurrentInitialSize", traffic: "traffic" }, outputs: { viewChanged: "viewChanged", viewUpdated: "viewUpdated", objectHighlighted: "objectHighlighted", nodeContextSizeChanged: "nodeContextSizeChanged", matchesFound: "matchesFound", nodeUpdated: "nodeUpdated", objectHovered: "objectHovered" }, host: { properties: { "class.vizceral": "this.directiveRef" } }, viewQueries: [{ propertyName: "directiveRef", first: true, predicate: VizceralDirective, descendants: true, static: true }], exportAs: ["ngxVizceral"], usesOnChanges: true, ngImport: i0__namespace, template: "<div class=\"vizceral\">\n  <canvas\n      (matchesFound)=\"matchesFound.emit($event)\"\n      (nodeContextSizeChanged)=\"nodeContextSizeChanged.emit($event)\"\n      (objectHighlighted)=\"objectHighlighted.emit($event)\"\n      (viewChanged)=\"viewChanged.emit($event)\"\n      (viewUpdated)=\"viewUpdated.emit($event)\"\n      [allowDraggingOfNodes]=\"allowDraggingOfNodes\"\n      [initialSize]=\"initialSize\"\n      [useCurrentInitialSize]=\"useCurrentInitialSize\"\n      [filters]=\"filters\"\n      [match]=\"match\"\n      [modes]=\"modes\"\n      [objectToHighlight]=\"objectToHighlight\"\n      [showLabels]=\"showLabels\"\n      [size]=\"size\"\n      [styles]=\"styles\"\n      [traffic]=\"initData\"\n      [view]=\"view\" style=\" width:100%; height:100%\"\n      vizceral>\n  </canvas>\n  \n  <div class=\"vizceral-notice\"></div>\n\n</div>\n", styles: ["vizceral{width:100%;height:100%}vizceral[fxflex]{display:flex;flex-direction:column;min-width:0;min-height:0}.vizceral,vizceral.vizceral{width:100%;height:100%}.vizceral{display:block;box-sizing:border-box}.vizceral .vizceral-notice{display:block;position:absolute;padding:0 3px;width:200px;background-color:#fff;border-left:2px solid grey;font-size:11px;color:grey}.vizceral .vizceral-notice ul{list-style:none;padding:0;margin:0}.vizceral .vizceral-notice>ul>li{line-height:12px;padding-top:3px;padding-bottom:3px}.vizceral .vizceral-notice .subtitle{font-weight:900}"], directives: [{ type: VizceralDirective, selector: "[vizceral]", inputs: ["definitions", "traffic", "view", "showLabels", "filters", "objectToHighlight", "match", "modes", "allowDraggingOfNodes", "styles", "targetFramerate", "initialSize", "useCurrentInitialSize", "vizceral", "size"], outputs: ["viewChanged", "viewUpdated", "objectHighlighted", "nodeContextSizeChanged", "matchesFound", "nodeUpdated", "objectHovered"], exportAs: ["ngxVizceral"] }], encapsulation: i0__namespace.ViewEncapsulation.None });
    i0__namespace.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: VizceralComponent, decorators: [{
                type: i0.Component,
                args: [{
                        selector: 'vizceral',
                        exportAs: 'ngxVizceral',
                        templateUrl: './ngx-vizceral.component.html',
                        styleUrls: ['./ngx-vizceral.component.scss'],
                        encapsulation: i0.ViewEncapsulation.None,
                    }]
            }], ctorParameters: function () { return []; }, propDecorators: { size: [{
                    type: i0.Input
                }], view: [{
                    type: i0.Input
                }], showLabels: [{
                    type: i0.Input
                }], filters: [{
                    type: i0.Input
                }], objectToHighlight: [{
                    type: i0.Input
                }], match: [{
                    type: i0.Input
                }], modes: [{
                    type: i0.Input
                }], allowDraggingOfNodes: [{
                    type: i0.Input
                }], styles: [{
                    type: i0.Input
                }], targetFramerate: [{
                    type: i0.Input
                }], initialSize: [{
                    type: i0.Input
                }], useCurrentInitialSize: [{
                    type: i0.Input
                }], viewChanged: [{
                    type: i0.Output
                }], viewUpdated: [{
                    type: i0.Output
                }], objectHighlighted: [{
                    type: i0.Output
                }], nodeContextSizeChanged: [{
                    type: i0.Output
                }], matchesFound: [{
                    type: i0.Output
                }], nodeUpdated: [{
                    type: i0.Output
                }], objectHovered: [{
                    type: i0.Output
                }], directiveRef: [{
                    type: i0.HostBinding,
                    args: ['class.vizceral']
                }, {
                    type: i0.ViewChild,
                    args: [VizceralDirective, { static: true }]
                }], traffic: [{
                    type: i0.Input
                }] } });

    var VizceralModule = /** @class */ (function () {
        function VizceralModule() {
        }
        return VizceralModule;
    }());
    VizceralModule.ɵfac = i0__namespace.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: VizceralModule, deps: [], target: i0__namespace.ɵɵFactoryTarget.NgModule });
    VizceralModule.ɵmod = i0__namespace.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: VizceralModule, declarations: [VizceralComponent,
            VizceralDirective], imports: [common.CommonModule], exports: [common.CommonModule,
            VizceralComponent,
            VizceralDirective] });
    VizceralModule.ɵinj = i0__namespace.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: VizceralModule, imports: [[
                common.CommonModule,
            ], common.CommonModule] });
    i0__namespace.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0__namespace, type: VizceralModule, decorators: [{
                type: i0.NgModule,
                args: [{
                        declarations: [
                            VizceralComponent,
                            VizceralDirective,
                        ],
                        imports: [
                            common.CommonModule,
                        ],
                        exports: [
                            common.CommonModule,
                            VizceralComponent,
                            VizceralDirective,
                        ],
                        schemas: [i0.CUSTOM_ELEMENTS_SCHEMA],
                    }]
            }] });

    /*
     * Public API Surface of ngx-vizceral
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.NgxVizceralService = NgxVizceralService;
    exports.VizceralComponent = VizceralComponent;
    exports.VizceralDirective = VizceralDirective;
    exports.VizceralModule = VizceralModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=deltix-ngx-vizceral.umd.js.map
