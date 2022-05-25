import * as i0 from '@angular/core';
import { Injectable, EventEmitter, Directive, Output, Input, Component, ViewEncapsulation, HostBinding, ViewChild, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import VizceralGraph from '@deltix/vizceral';
import { ResizeObserver } from '@juggle/resize-observer';
import { CommonModule } from '@angular/common';

class NgxVizceralService {
    constructor() { }
}
NgxVizceralService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: NgxVizceralService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
NgxVizceralService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: NgxVizceralService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: NgxVizceralService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: function () { return []; } });

class VizceralDirective {
    constructor(zone, elementRef) {
        this.zone = zone;
        this.elementRef = elementRef;
        this.viewChanged = new EventEmitter();
        this.viewUpdated = new EventEmitter();
        this.objectHighlighted = new EventEmitter();
        this.nodeContextSizeChanged = new EventEmitter();
        this.matchesFound = new EventEmitter();
        this.nodeUpdated = new EventEmitter();
        this.objectHovered = new EventEmitter();
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
            connectionHighlighted: () => { },
            definitions: {},
            filters: [],
            match: '',
            nodeHighlighted: () => { },
            nodeUpdated: () => { },
            nodeContextSizeChanged: () => { },
            matchesFound: () => { },
            objectHighlighted: () => { },
            objectHovered: () => { },
            objectToHighlight: null,
            showLabels: true,
            allowDraggingOfNodes: false,
            styles: {},
            traffic: {},
            viewChanged: () => { },
            viewUpdated: () => { },
            view: [],
            targetFramerate: null,
        };
    }
    set size(size) {
        this.setSize(size.width, size.height);
    }
    ngOnInit() {
        this.zone.runOutsideAngular(() => {
            const elRef = this.elementRef.nativeElement;
            let size = {};
            if (this.initialSize) {
                size = this.initialSize;
            }
            else if (this.useCurrentInitialSize) {
                size = {
                    width: elRef.offsetWidth,
                    height: elRef.offsetHeight,
                };
            }
            this.instance = new VizceralGraph(elRef, this.targetFramerate, size);
            this.instance.on('viewChanged', (event) => {
                this.zone.run(() => {
                    this.viewChanged.emit(event);
                });
            });
            this.instance.on('objectHighlighted', (event) => {
                this.zone.run(() => {
                    this.objectHighlighted.emit(event);
                });
            });
            this.instance.on('objectHovered', (event) => {
                this.zone.run(() => {
                    this.objectHovered.emit(event);
                });
            });
            this.instance.on('nodeUpdated', (event) => {
                this.zone.run(() => {
                    this.nodeUpdated.emit(event);
                });
            });
            this.instance.on('nodeContextSizeChanged', (event) => {
                this.zone.run(() => {
                    this.nodeContextSizeChanged.emit(event);
                });
            });
            this.instance.on('matchesFound', (event) => {
                this.zone.run(() => {
                    this.matchesFound.emit(event);
                });
            });
            this.instance.on('viewUpdated', (event) => {
                this.zone.run(() => {
                    this.viewUpdated.emit(event);
                });
            });
            // Pass our defaults to Vizceral in the case that it has different defaults.
            this.instance.setOptions({
                allowDraggingOfNodes: this.allowDraggingOfNodes,
                showLabels: this.showLabels,
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
            setTimeout(() => {
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
                this.instance.setView(this.view || this.defaultProps.view, this.objectToHighlight);
                this.instance.updateData(this.traffic);
                const perfNow = this.getPerformanceNow();
                this.instance.animate(perfNow === null ? 0 : perfNow);
                this.instance.updateBoundingRectCache();
                // console.log('VizceralGraph:')
                // console.log(this.instance)
            }, 0);
        });
        this.zone.runOutsideAngular(() => {
            this.ro = new ResizeObserver((entries, observer) => {
                const element = this.elementRef.nativeElement.parentElement.parentElement;
                if (!this.initialWidth) {
                    this.setSize(element.offsetWidth, element.offsetHeight);
                }
            });
            this.ro.observe(this.elementRef.nativeElement.parentElement.parentElement);
        });
    }
    ngAfterViewInit() {
        // ANDY
        //       // Pass our defaults to Vizceral in the case that it has different defaults.
        //       this.instance.setOptions({
        //         allowDraggingOfNodes: this.allowDraggingOfNodes,
        //         showLabels: this.showLabels
        //       });
    }
    getPerformanceNow() {
        const g = window;
        if (g != null) {
            const perf = g.performance;
            if (perf != null) {
                try {
                    const perfNow = perf.now();
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
    }
    ngOnDestroy() {
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
    }
    ngDoCheck() {
        if (this.configDiff) {
            const changes = this.configDiff.diff(this.config || {});
            if (changes) {
                this.ngOnDestroy();
                this.ngOnInit();
            }
        }
    }
    ngOnChanges(changes) {
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
    }
    vizceral() {
        return this.instance;
    }
    setView(view) {
        this.view = view;
        this.instance.setView(this.view || this.defaultProps.view, this.objectToHighlight);
    }
    setSize(width, height) {
        this.initialWidth = width;
        this.initialHeight = height;
        if (this.instance) {
            this.instance.setSize(width, height);
        }
    }
}
VizceralDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: VizceralDirective, deps: [{ token: i0.NgZone }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive });
VizceralDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "12.0.0", type: VizceralDirective, selector: "[vizceral]", inputs: { definitions: "definitions", traffic: "traffic", view: "view", showLabels: "showLabels", filters: "filters", objectToHighlight: "objectToHighlight", match: "match", modes: "modes", allowDraggingOfNodes: "allowDraggingOfNodes", styles: "styles", targetFramerate: "targetFramerate", initialSize: "initialSize", useCurrentInitialSize: "useCurrentInitialSize", config: ["vizceral", "config"], size: "size" }, outputs: { viewChanged: "viewChanged", viewUpdated: "viewUpdated", objectHighlighted: "objectHighlighted", nodeContextSizeChanged: "nodeContextSizeChanged", matchesFound: "matchesFound", nodeUpdated: "nodeUpdated", objectHovered: "objectHovered" }, exportAs: ["ngxVizceral"], usesOnChanges: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: VizceralDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[vizceral]',
                    exportAs: 'ngxVizceral',
                }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i0.ElementRef }]; }, propDecorators: { viewChanged: [{
                type: Output
            }], viewUpdated: [{
                type: Output
            }], objectHighlighted: [{
                type: Output
            }], nodeContextSizeChanged: [{
                type: Output
            }], matchesFound: [{
                type: Output
            }], nodeUpdated: [{
                type: Output
            }], objectHovered: [{
                type: Output
            }], definitions: [{
                type: Input
            }], traffic: [{
                type: Input
            }], view: [{
                type: Input
            }], showLabels: [{
                type: Input
            }], filters: [{
                type: Input
            }], objectToHighlight: [{
                type: Input
            }], match: [{
                type: Input
            }], modes: [{
                type: Input
            }], allowDraggingOfNodes: [{
                type: Input
            }], styles: [{
                type: Input
            }], targetFramerate: [{
                type: Input
            }], initialSize: [{
                type: Input
            }], useCurrentInitialSize: [{
                type: Input
            }], config: [{
                type: Input,
                args: ['vizceral']
            }], size: [{
                type: Input
            }] } });

class VizceralComponent {
    constructor() {
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
        this.viewChanged = new EventEmitter();
        this.viewUpdated = new EventEmitter();
        this.objectHighlighted = new EventEmitter();
        this.nodeContextSizeChanged = new EventEmitter();
        this.matchesFound = new EventEmitter();
        this.nodeUpdated = new EventEmitter();
        this.objectHovered = new EventEmitter();
    }
    // @Input() traffic: any = null;
    set traffic(data) {
        this.setTraffic(data);
    }
    ngAfterViewInit() {
        // if (this.json != null) {
        //   this.setJSON(this.json, true);
        // }
    }
    ngOnChanges(changes) {
    }
    vizceral() {
        return this.directiveRef.vizceral();
    }
    setView(view) {
        this.directiveRef.setView(view);
    }
    locate(searchText) {
        // console.log('Locating nodes that match: ' + searchText);
        this.vizceral().findNodes(searchText);
    }
    setTraffic(data) {
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
    }
}
VizceralComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: VizceralComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
VizceralComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "12.0.0", type: VizceralComponent, selector: "vizceral", inputs: { size: "size", view: "view", showLabels: "showLabels", filters: "filters", objectToHighlight: "objectToHighlight", match: "match", modes: "modes", allowDraggingOfNodes: "allowDraggingOfNodes", styles: "styles", targetFramerate: "targetFramerate", initialSize: "initialSize", useCurrentInitialSize: "useCurrentInitialSize", traffic: "traffic" }, outputs: { viewChanged: "viewChanged", viewUpdated: "viewUpdated", objectHighlighted: "objectHighlighted", nodeContextSizeChanged: "nodeContextSizeChanged", matchesFound: "matchesFound", nodeUpdated: "nodeUpdated", objectHovered: "objectHovered" }, host: { properties: { "class.vizceral": "this.directiveRef" } }, viewQueries: [{ propertyName: "directiveRef", first: true, predicate: VizceralDirective, descendants: true, static: true }], exportAs: ["ngxVizceral"], usesOnChanges: true, ngImport: i0, template: "<div class=\"vizceral\">\n  <canvas\n      (matchesFound)=\"matchesFound.emit($event)\"\n      (nodeContextSizeChanged)=\"nodeContextSizeChanged.emit($event)\"\n      (objectHighlighted)=\"objectHighlighted.emit($event)\"\n      (viewChanged)=\"viewChanged.emit($event)\"\n      (viewUpdated)=\"viewUpdated.emit($event)\"\n      [allowDraggingOfNodes]=\"allowDraggingOfNodes\"\n      [initialSize]=\"initialSize\"\n      [useCurrentInitialSize]=\"useCurrentInitialSize\"\n      [filters]=\"filters\"\n      [match]=\"match\"\n      [modes]=\"modes\"\n      [objectToHighlight]=\"objectToHighlight\"\n      [showLabels]=\"showLabels\"\n      [size]=\"size\"\n      [styles]=\"styles\"\n      [traffic]=\"initData\"\n      [view]=\"view\" style=\" width:100%; height:100%\"\n      vizceral>\n  </canvas>\n  \n  <div class=\"vizceral-notice\"></div>\n\n</div>\n", styles: ["vizceral{width:100%;height:100%}vizceral[fxflex]{display:flex;flex-direction:column;min-width:0;min-height:0}.vizceral,vizceral.vizceral{width:100%;height:100%}.vizceral{display:block;box-sizing:border-box}.vizceral .vizceral-notice{display:block;position:absolute;padding:0 3px;width:200px;background-color:#fff;border-left:2px solid grey;font-size:11px;color:grey}.vizceral .vizceral-notice ul{list-style:none;padding:0;margin:0}.vizceral .vizceral-notice>ul>li{line-height:12px;padding-top:3px;padding-bottom:3px}.vizceral .vizceral-notice .subtitle{font-weight:900}"], directives: [{ type: VizceralDirective, selector: "[vizceral]", inputs: ["definitions", "traffic", "view", "showLabels", "filters", "objectToHighlight", "match", "modes", "allowDraggingOfNodes", "styles", "targetFramerate", "initialSize", "useCurrentInitialSize", "vizceral", "size"], outputs: ["viewChanged", "viewUpdated", "objectHighlighted", "nodeContextSizeChanged", "matchesFound", "nodeUpdated", "objectHovered"], exportAs: ["ngxVizceral"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: VizceralComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'vizceral',
                    exportAs: 'ngxVizceral',
                    templateUrl: './ngx-vizceral.component.html',
                    styleUrls: ['./ngx-vizceral.component.scss'],
                    encapsulation: ViewEncapsulation.None,
                }]
        }], ctorParameters: function () { return []; }, propDecorators: { size: [{
                type: Input
            }], view: [{
                type: Input
            }], showLabels: [{
                type: Input
            }], filters: [{
                type: Input
            }], objectToHighlight: [{
                type: Input
            }], match: [{
                type: Input
            }], modes: [{
                type: Input
            }], allowDraggingOfNodes: [{
                type: Input
            }], styles: [{
                type: Input
            }], targetFramerate: [{
                type: Input
            }], initialSize: [{
                type: Input
            }], useCurrentInitialSize: [{
                type: Input
            }], viewChanged: [{
                type: Output
            }], viewUpdated: [{
                type: Output
            }], objectHighlighted: [{
                type: Output
            }], nodeContextSizeChanged: [{
                type: Output
            }], matchesFound: [{
                type: Output
            }], nodeUpdated: [{
                type: Output
            }], objectHovered: [{
                type: Output
            }], directiveRef: [{
                type: HostBinding,
                args: ['class.vizceral']
            }, {
                type: ViewChild,
                args: [VizceralDirective, { static: true }]
            }], traffic: [{
                type: Input
            }] } });

class VizceralModule {
}
VizceralModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: VizceralModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
VizceralModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: VizceralModule, declarations: [VizceralComponent,
        VizceralDirective], imports: [CommonModule], exports: [CommonModule,
        VizceralComponent,
        VizceralDirective] });
VizceralModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: VizceralModule, imports: [[
            CommonModule,
        ], CommonModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.0.0", ngImport: i0, type: VizceralModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [
                        VizceralComponent,
                        VizceralDirective,
                    ],
                    imports: [
                        CommonModule,
                    ],
                    exports: [
                        CommonModule,
                        VizceralComponent,
                        VizceralDirective,
                    ],
                    schemas: [CUSTOM_ELEMENTS_SCHEMA],
                }]
        }] });

/*
 * Public API Surface of ngx-vizceral
 */

/**
 * Generated bundle index. Do not edit.
 */

export { NgxVizceralService, VizceralComponent, VizceralDirective, VizceralModule };
//# sourceMappingURL=deltix-ngx-vizceral.js.map
