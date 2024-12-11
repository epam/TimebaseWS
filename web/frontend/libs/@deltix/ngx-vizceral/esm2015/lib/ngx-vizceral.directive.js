import VizceralGraph from '@deltix/vizceral';
// const isEqual = require('lodash.isequal');
import { ResizeObserver } from '@juggle/resize-observer';
import { Directive, Input, Output, EventEmitter, } from '@angular/core';
import equal from 'fast-deep-equal';
import * as i0 from "@angular/core";
export class VizceralDirective {
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
            if (!equal(this.filters, this.defaultProps.filters)) {
                this.instance.setFilters(this.filters);
            }
            if (this.styles && !equal(this.styles, this.defaultProps.styles)) {
                this.instance.updateStyles(this.styles);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXZpemNlcmFsLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC12aXpjZXJhbC9zcmMvbGliL25neC12aXpjZXJhbC5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxhQUFhLE1BQVcsa0JBQWtCLENBQUM7QUFDbEQsNkNBQTZDO0FBQzdDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUV6RCxPQUFPLEVBQ0wsU0FBUyxFQU1ULEtBQUssRUFDTCxNQUFNLEVBQ04sWUFBWSxHQUtiLE1BQTRCLGVBQWUsQ0FBQztBQUU3QyxPQUFPLEtBQUssTUFBaUIsaUJBQWlCLENBQUM7O0FBTy9DLE1BQU0sT0FBTyxpQkFBaUI7SUE0RDVCLFlBQ1UsSUFBWSxFQUNaLFVBQXNCO1FBRHRCLFNBQUksR0FBSixJQUFJLENBQVE7UUFDWixlQUFVLEdBQVYsVUFBVSxDQUFZO1FBN0R0QixnQkFBVyxHQUFHLElBQUksWUFBWSxFQUFPLENBQUM7UUFDdEMsZ0JBQVcsR0FBRyxJQUFJLFlBQVksRUFBTyxDQUFDO1FBQ3RDLHNCQUFpQixHQUFHLElBQUksWUFBWSxFQUFPLENBQUM7UUFDNUMsMkJBQXNCLEdBQUcsSUFBSSxZQUFZLEVBQU8sQ0FBQztRQUNqRCxpQkFBWSxHQUFHLElBQUksWUFBWSxFQUFPLENBQUM7UUFDdkMsZ0JBQVcsR0FBRyxJQUFJLFlBQVksRUFBTyxDQUFDO1FBQ3RDLGtCQUFhLEdBQUcsSUFBSSxZQUFZLEVBQU8sQ0FBQztRQUV6QyxnQkFBVyxHQUFRLElBQUksQ0FBQztRQUN4QixZQUFPLEdBQVEsSUFBSSxDQUFDO1FBQzdCLDBDQUEwQztRQUNqQyxTQUFJLEdBQVEsSUFBSSxDQUFDO1FBQ2pCLGVBQVUsR0FBRyxJQUFJLENBQUM7UUFDM0Isc0NBQXNDO1FBQzdCLFlBQU8sR0FBUSxJQUFJLENBQUM7UUFDcEIsc0JBQWlCLEdB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LE1BQU07Z0JBQ0csV0FBVztzQkFBcEIsTUFBTTtnQkFDRyxpQkFBaUI7c0JBQTFCLE1BQU07Z0JBQ0csc0JBQXNCO3NCQUEvQixNQUFNO2dCQUNHLFlBQVk7c0JBQXJCLE1BQU07Z0JBQ0csV0FBVztzQkFBcEIsTUFBTTtnQkFDRyxhQUFhO3NCQUF0QixNQUFNO2dCQUVFLFdBQVc7c0JBQW5CLEtBQUs7Z0JBQ0csT0FBTztzQkFBZixLQUFLO2dCQUVHLElBQUk7c0JBQVosS0FBSztnQkFDRyxVQUFVO3NCQUFsQixLQUFLO2dCQUVHLE9BQU87c0JBQWYsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBQ0csTUFBTTtzQkFBZCxLQUFLO2dCQUNHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFJRyxxQkFBcUI7c0JBQTdCLEtBQUs7Z0JBQ2EsTUFBTTtzQkFBeEIsS0FBSzt1QkFBQyxVQUFVO2dCQXlDYixJQUFJO3NCQURQLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVml6Y2VyYWxHcmFwaCAgICAgIGZyb20gJ0BkZWx0aXgvdml6Y2VyYWwnO1xuLy8gY29uc3QgaXNFcXVhbCA9IHJlcXVpcmUoJ2xvZGFzaC5pc2VxdWFsJyk7XG5pbXBvcnQgeyBSZXNpemVPYnNlcnZlciB9IGZyb20gJ0BqdWdnbGUvcmVzaXplLW9ic2VydmVyJztcblxuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBPbkluaXQsXG4gIEFmdGVyVmlld0luaXQsXG4gIE9uRGVzdHJveSxcbiAgRG9DaGVjayxcbiAgT25DaGFuZ2VzLFxuICBJbnB1dCxcbiAgT3V0cHV0LFxuICBFdmVudEVtaXR0ZXIsXG4gIE5nWm9uZSxcbiAgRWxlbWVudFJlZixcbiAgS2V5VmFsdWVEaWZmZXIsXG4gIFNpbXBsZUNoYW5nZXMsXG59ICAgICAgICAgICAgICAgICAgICAgICBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFZpemNlcmFsU2l6ZSB9IGZyb20gJy4vbmd4LXZpemNlcmFsLm1vZGVscyc7XG5pbXBvcnQgZXF1YWwgICAgICAgICAgICBmcm9tICdmYXN0LWRlZXAtZXF1YWwnO1xuXG5cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1t2aXpjZXJhbF0nLFxuICBleHBvcnRBczogJ25neFZpemNlcmFsJyxcbn0pXG5leHBvcnQgY2xhc3MgVml6Y2VyYWxEaXJlY3RpdmUgaW1wbGVtZW50cyBPbkluaXQsIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSwgRG9DaGVjaywgT25DaGFuZ2VzIHtcbiAgQE91dHB1dCgpIHZpZXdDaGFuZ2VkID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIEBPdXRwdXQoKSB2aWV3VXBkYXRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICBAT3V0cHV0KCkgb2JqZWN0SGlnaGxpZ2h0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIG5vZGVDb250ZXh0U2l6ZUNoYW5nZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIG1hdGNoZXNGb3VuZCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICBAT3V0cHV0KCkgbm9kZVVwZGF0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIG9iamVjdEhvdmVyZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgXG4gIEBJbnB1dCgpIGRlZmluaXRpb25zOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSB0cmFmZmljOiBhbnkgPSBudWxsO1xuICAvLyBBTkRZLy8gcHJpdmF0ZSBvYmplY3RzSlNPTjogYW55ID0gbnVsbDtcbiAgQElucHV0KCkgdmlldzogYW55ID0gbnVsbDtcbiAgQElucHV0KCkgc2hvd0xhYmVscyA9IHRydWU7XG4gIC8vIHByaXZhdGUgaW5pdGlhbFRyYWZmaWM6IGFueSA9IG51bGw7XG4gIEBJbnB1dCgpIGZpbHRlcnM6IGFueSA9IG51bGw7XG4gIEBJbnB1dCgpIG9iamVjdFRvSGlnaGxpZ2h0OiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBtYXRjaDogYW55ID0gbnVsbDtcbiAgQElucHV0KCkgbW9kZXM6IGFueSA9IG51bGw7XG4gIEBJbnB1dCgpIGFsbG93RHJhZ2dpbmdPZk5vZGVzID0gZmFsc2U7XG4gIEBJbnB1dCgpIHN0eWxlczogYW55ID0gbnVsbDtcbiAgQElucHV0KCkgdGFyZ2V0RnJhbWVyYXRlOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBpbml0aWFsU2l6ZToge1xuICAgIHdpZHRoOiBudW1iZXIsXG4gICAgaGVpZ2h0OiBudW1iZXIsXG4gIH07XG4gIEBJbnB1dCgpIHVzZUN1cnJlbnRJbml0aWFsU2l6ZTogYm9vbGVhbjtcbiAgQElucHV0KCd2aXpjZXJhbCcpIGNvbmZpZzogYW55O1xuICBcbiAgcHJpdmF0ZSBybzogYW55ID0gbnVsbDtcbiAgcHJpdmF0ZSBpbnN0YW5jZTogVml6Y2VyYWxHcmFwaCA9IG51bGw7XG4gIHByaXZhdGUgaW5pdGlhbFdpZHRoOiBudW1iZXIgPSBudWxsO1xuICBwcml2YXRlIGluaXRpYWxIZWlnaHQ6IG51bWJlciA9IG51bGw7XG4gIHByaXZhdGUgY29uZmlnRGlmZjogS2V5VmFsdWVEaWZmZXI8c3RyaW5nLCBhbnk+O1xuICAvKiBASW5wdXQoKVxuICAgc2V0IHRyYWZmaWMoZGF0YTogYW55KSB7XG4gICB0aGlzLnNldFRyYWZmaWMoZGF0YSk7XG4gICB9Ki9cbiAgcHJpdmF0ZSBkZWZhdWx0UHJvcHMgPSB7XG4gICAgY29ubmVjdGlvbkhpZ2hsaWdodGVkOiAoKSA9PiB7fSxcbiAgICBkZWZpbml0aW9uczoge30sXG4gICAgZmlsdGVyczogW10sXG4gICAgbWF0Y2g6ICcnLFxuICAgIG5vZGVIaWdobGlnaHRlZDogKCkgPT4ge30sXG4gICAgbm9kZVVwZGF0ZWQ6ICgpID0+IHt9LFxuICAgIG5vZGVDb250ZXh0U2l6ZUNoYW5nZWQ6ICgpID0+IHt9LFxuICAgIG1hdGNoZXNGb3VuZDogKCkgPT4ge30sXG4gICAgb2JqZWN0SGlnaGxpZ2h0ZWQ6ICgpID0+IHt9LFxuICAgIG9iamVjdEhvdmVyZWQ6ICgpID0+IHt9LFxuICAgIG9iamVjdFRvSGlnaGxpZ2h0OiBudWxsLFxuICAgIHNob3dMYWJlbHM6IHRydWUsXG4gICAgYWxsb3dEcmFnZ2luZ09mTm9kZXM6IGZhbHNlLFxuICAgIHN0eWxlczoge30sXG4gICAgdHJhZmZpYzoge30sXG4gICAgdmlld0NoYW5nZWQ6ICgpID0+IHt9LFxuICAgIHZpZXdVcGRhdGVkOiAoKSA9PiB7fSxcbiAgICB2aWV3OiBbXSxcbiAgICB0YXJnZXRGcmFtZXJhdGU6IG51bGwsXG4gIH07XG4gIFxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHpvbmU6IE5nWm9uZSxcbiAgICBwcml2YXRlIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsXG4gICAgLy8gcHJpdmF0ZSBkaWZmZXJzOiBLZXlWYWx1ZURpZmZlcnMsXG4gICkge1xuICB9XG4gIFxuICBASW5wdXQoKVxuICBzZXQgc2l6ZShzaXplOiBWaXpjZXJhbFNpemUpIHtcbiAgICB0aGlzLnNldFNpemUoc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQpO1xuICB9XG4gIFxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICBcbiAgICAgIGNvbnN0IGVsUmVmID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICBsZXQgc2l6ZSA9IHt9O1xuICAgICAgaWYgKHRoaXMuaW5pdGlhbFNpemUpIHtcbiAgICAgICAgc2l6ZSA9IHRoaXMuaW5pdGlhbFNpemU7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMudXNlQ3VycmVudEluaXRpYWxTaXplKSB7XG4gICAgICAgIHNpemUgPSB7XG4gICAgICAgICAgd2lkdGg6IGVsUmVmLm9mZnNldFdpZHRoLFxuICAgICAgICAgIGhlaWdodDogZWxSZWYub2Zmc2V0SGVpZ2h0LFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgdGhpcy5pbnN0YW5jZSA9IG5ldyBWaXpjZXJhbEdyYXBoKGVsUmVmLCB0aGlzLnRhcmdldEZyYW1lcmF0ZSwgc2l6ZSk7XG4gIFxuICAgICAgdGhpcy5pbnN0YW5jZS5vbigndmlld0NoYW5nZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgdGhpcy52aWV3Q2hhbmdlZC5lbWl0KGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuaW5zdGFuY2Uub24oJ29iamVjdEhpZ2hsaWdodGVkJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMub2JqZWN0SGlnaGxpZ2h0ZWQuZW1pdChldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmluc3RhbmNlLm9uKCdvYmplY3RIb3ZlcmVkJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMub2JqZWN0SG92ZXJlZC5lbWl0KGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuaW5zdGFuY2Uub24oJ25vZGVVcGRhdGVkJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMubm9kZVVwZGF0ZWQuZW1pdChldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmluc3RhbmNlLm9uKCdub2RlQ29udGV4dFNpemVDaGFuZ2VkJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMubm9kZUNvbnRleHRTaXplQ2hhbmdlZC5lbWl0KGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuaW5zdGFuY2Uub24oJ21hdGNoZXNGb3VuZCcsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLm1hdGNoZXNGb3VuZC5lbWl0KGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuaW5zdGFuY2Uub24oJ3ZpZXdVcGRhdGVkJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMudmlld1VwZGF0ZWQuZW1pdChldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gIFxuICBcbiAgICAgIC8vIFBhc3Mgb3VyIGRlZmF1bHRzIHRvIFZpemNlcmFsIGluIHRoZSBjYXNlIHRoYXQgaXQgaGFzIGRpZmZlcmVudCBkZWZhdWx0cy5cbiAgICAgIHRoaXMuaW5zdGFuY2Uuc2V0T3B0aW9ucyh7XG4gICAgICAgIGFsbG93RHJhZ2dpbmdPZk5vZGVzOiB0aGlzLmFsbG93RHJhZ2dpbmdPZk5vZGVzLFxuICAgICAgICBzaG93TGFiZWxzOiB0aGlzLnNob3dMYWJlbHMsXG4gICAgXG4gICAgICB9KTtcbiAgXG4gICAgICAvLyAgIC8vcmV0dXJuIGJhY2sgZm9yIHRoaXNcbiAgICAgIGlmICghZXF1YWwodGhpcy5maWx0ZXJzLCB0aGlzLmRlZmF1bHRQcm9wcy5maWx0ZXJzKSkge1xuICAgICAgICB0aGlzLmluc3RhbmNlLnNldEZpbHRlcnModGhpcy5maWx0ZXJzKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnN0eWxlcyAmJiAhZXF1YWwodGhpcy5zdHlsZXMsIHRoaXMuZGVmYXVsdFByb3BzLnN0eWxlcykpIHtcbiAgICAgICAgdGhpcy5pbnN0YW5jZS51cGRhdGVTdHlsZXModGhpcy5zdHlsZXMpO1xuICAgICAgfVxuICBcbiAgICAgIC8vICAgaWYgKCFpc0VxdWFsKHRoaXMuZGVmaW5pdGlvbnMsIHRoaXMuZGVmYXVsdFByb3BzLmRlZmluaXRpb25zKSkge1xuICAgICAgLy8gICAgIHRoaXMuaW5zdGFuY2UudXBkYXRlRGVmaW5pdGlvbnModGhpcy5kZWZpbml0aW9ucyk7XG4gICAgICAvLyAgIH1cbiAgXG4gICAgICAvLyBGaW5pc2ggdGhlIGN1cnJlbnQgY2FsbCBzdGFjayBiZWZvcmUgdXBkYXRpbmcgdGhlIHZpZXcuXG4gICAgICAvLyBJZiB2aXpjZXJhbC1yZWFjdCB3YXMgcGFzc2VkIGRhdGEgZGlyZWN0bHkgd2l0aG91dCBhbnkgYXN5bmNocm9ub3VzXG4gICAgICAvLyBjYWxscyB0byByZXRyaWV2ZSB0aGUgZGF0YSwgdGhlIGluaXRpYWxseSBsb2FkZWQgZ3JhcGggd291bGQgbm90XG4gICAgICAvLyBhbmltYXRlIHByb3Blcmx5LlxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBsZXQgcmVuZGVyZXJzID0ge1xuICAgICAgICAvLyAgIGdsb2JhbDogR2xvYmFsVHJhZmZpY0dyYXBoLFxuICAgICAgICAvLyAgIHJlZ2lvbjogUmVnaW9uVHJhZmZpY0dyYXBoLFxuICAgICAgICAvLyAgIGZvY3VzZWQ6IEZvY3VzZWRUcmFmZmljR3JhcGgsXG4gICAgICAgIC8vICAgZm9jdXNlZENoaWxkOiBGb2N1c2VkQ2hpbGRUcmFmZmljR3JhcGgsXG4gICAgICAgIC8vICAgZG5zOiBEbnNUcmFmZmljR3JhcGhcbiAgICAgICAgLy8gfTtcbiAgICAgICAgLy8gY29uc29sZS5sb2cgKFwiUmVuZGVyZXJzOlwiKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2cgKHJlbmRlcmVycyk7XG4gICAgICAgIC8vIC8vdGhpcy5pbnN0YW5jZS5zZXRSZW5kZXJlcnMocmVuZGVyZXJzKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5zdGFuY2Uuc2V0Vmlldyh0aGlzLnZpZXcgfHwgdGhpcy5kZWZhdWx0UHJvcHMudmlldywgdGhpcy5vYmplY3RUb0hpZ2hsaWdodCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluc3RhbmNlLnVwZGF0ZURhdGEodGhpcy50cmFmZmljKTtcbiAgICAgICAgY29uc3QgcGVyZk5vdyA9IHRoaXMuZ2V0UGVyZm9ybWFuY2VOb3coKTtcbiAgICAgICAgdGhpcy5pbnN0YW5jZS5hbmltYXRlKHBlcmZOb3cgPT09IG51bGwgPyAwIDogcGVyZk5vdyk7XG4gICAgICAgIHRoaXMuaW5zdGFuY2UudXBkYXRlQm91bmRpbmdSZWN0Q2FjaGUoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdWaXpjZXJhbEdyYXBoOicpXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuaW5zdGFuY2UpXG4gICAgICAgIFxuICAgICAgfSwgMCk7XG4gICAgfSk7XG4gICAgXG4gICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHRoaXMucm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKGVudHJpZXMsIG9ic2VydmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMuaW5pdGlhbFdpZHRoKSB7XG4gICAgICAgICAgdGhpcy5zZXRTaXplKGVsZW1lbnQub2Zmc2V0V2lkdGgsIGVsZW1lbnQub2Zmc2V0SGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIHRoaXMucm8ub2JzZXJ2ZSh0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQpO1xuICAgIH0pO1xuICB9XG4gIFxuICBuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XG4gICAgLy8gQU5EWVxuICAgIC8vICAgICAgIC8vIFBhc3Mgb3VyIGRlZmF1bHRzIHRvIFZpemNlcmFsIGluIHRoZSBjYXNlIHRoYXQgaXQgaGFzIGRpZmZlcmVudCBkZWZhdWx0cy5cbiAgICAvLyAgICAgICB0aGlzLmluc3RhbmNlLnNldE9wdGlvbnMoe1xuICAgIC8vICAgICAgICAgYWxsb3dEcmFnZ2luZ09mTm9kZXM6IHRoaXMuYWxsb3dEcmFnZ2luZ09mTm9kZXMsXG4gICAgLy8gICAgICAgICBzaG93TGFiZWxzOiB0aGlzLnNob3dMYWJlbHNcbiAgICAvLyAgICAgICB9KTtcbiAgICBcbiAgfVxuICBcbiAgcHVibGljIGdldFBlcmZvcm1hbmNlTm93KCk6IG51bWJlciB8IG51bGwge1xuICAgIGNvbnN0IGcgPSB3aW5kb3c7XG4gICAgaWYgKGcgIT0gbnVsbCkge1xuICAgICAgY29uc3QgcGVyZiA9IGcucGVyZm9ybWFuY2U7XG4gICAgICBpZiAocGVyZiAhPSBudWxsKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgcGVyZk5vdyA9IHBlcmYubm93KCk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBwZXJmTm93ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgcmV0dXJuIHBlcmZOb3c7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIFxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICBjb25zb2xlLmxvZygnVml6Y2VyYWxDb21wb25lbnQ6bmdPbkRlc3Ryb3koKSAtIHN1cHByZXNzaW5nIGluc3RhbmNlLmRlc3Ryb3koKScpO1xuICAgIGlmICh0aGlzLnJvKSB7XG4gICAgICB0aGlzLnJvLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuaW5zdGFuY2UpIHtcbiAgICAgIC8vIEFORFkvL3RoaXMub2JqZWN0c0pTT04gPSB0aGlzLmluc3RhbmNlLnRvSlNPTigpO1xuICAgICAgXG4gICAgICAvLyBBTkRZLy8gdGhpcy5pbnN0YW5jZS5kaXNwb3NlKCk7IC8vIDwtLSBkb2Vzbid0IHdvcmtcbiAgICAgIFxuICAgICAgZGVsZXRlIHRoaXMuaW5zdGFuY2U7XG4gICAgICBcbiAgICAgIHRoaXMuaW5zdGFuY2UgPSBudWxsO1xuICAgIH1cbiAgfVxuICBcbiAgbmdEb0NoZWNrKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmNvbmZpZ0RpZmYpIHtcbiAgICAgIGNvbnN0IGNoYW5nZXMgPSB0aGlzLmNvbmZpZ0RpZmYuZGlmZih0aGlzLmNvbmZpZyB8fCB7fSk7XG4gICAgICBcbiAgICAgIGlmIChjaGFuZ2VzKSB7XG4gICAgICAgIHRoaXMubmdPbkRlc3Ryb3koKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMubmdPbkluaXQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICAvLyBjb25zb2xlLmxvZygnVml6Y2VyYWxEaXJlY3RpdmU6bmdPbkNoYW5nZXMoKSknKTtcbiAgICBpZiAodGhpcy5pbnN0YW5jZSAmJiBjaGFuZ2VzLmRpc2FibGVkKSB7XG4gICAgICBpZiAoY2hhbmdlcy5kaXNhYmxlZC5jdXJyZW50VmFsdWUgIT09IGNoYW5nZXMuZGlzYWJsZWQucHJldmlvdXNWYWx1ZSkge1xuICAgICAgICB0aGlzLm5nT25EZXN0cm95KCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLm5nT25Jbml0KCk7XG4gICAgICB9IGVsc2UgaWYgKGNoYW5nZXMudHJhZmZpYykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnVml6Y2VyYWxEaXJlY3RpdmU6bmdPbkNoYW5nZXModHJhZmZpYyknKTtcbiAgICAgICAgdGhpcy5pbnN0YW5jZS51cGRhdGVEYXRhKHRoaXMudHJhZmZpYyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICB9XG4gIFxuICBwdWJsaWMgdml6Y2VyYWwoKTogVml6Y2VyYWxHcmFwaCB7XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2U7XG4gIH1cbiAgXG4gIHB1YmxpYyBzZXRWaWV3KHZpZXc6IHN0cmluZyBbXSk6IHZvaWQge1xuICAgIHRoaXMudmlldyA9IHZpZXc7XG4gICAgdGhpcy5pbnN0YW5jZS5zZXRWaWV3KHRoaXMudmlldyB8fCB0aGlzLmRlZmF1bHRQcm9wcy52aWV3LCB0aGlzLm9iamVjdFRvSGlnaGxpZ2h0KTtcbiAgfVxuICBcbiAgXG4gIHB1YmxpYyBzZXRTaXplKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5pbml0aWFsV2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmluaXRpYWxIZWlnaHQgPSBoZWlnaHQ7XG4gICAgXG4gICAgaWYgKHRoaXMuaW5zdGFuY2UpIHtcbiAgICAgIHRoaXMuaW5zdGFuY2Uuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHByaXZhdGUgdXBkYXRlU3R5bGVzKHN0eWxlcykge1xuICAvLyAgIGNvbnN0IHN0eWxlTmFtZXMgPSB0aGlzLmluc3RhbmNlLmdldFN0eWxlcygpO1xuICAvLyAgIGNvbnN0IGN1c3RvbVN0eWxlcyA9IHN0eWxlTmFtZXMucmVkdWNlKChyZXN1bHQsIHN0eWxlTmFtZSkgPT4ge1xuICAvLyAgICAgcmVzdWx0W3N0eWxlTmFtZV0gPSBzdHlsZXNbc3R5bGVOYW1lXSB8fCByZXN1bHRbc3R5bGVOYW1lXTtcbiAgLy8gICAgIHJldHVybiByZXN1bHQ7XG4gIC8vICAgfSwge30pO1xuICAvL1xuICAvLyAgIHRoaXMuaW5zdGFuY2UudXBkYXRlU3R5bGVzKGN1c3RvbVN0eWxlcyk7XG4gIC8vIH1cbiAgXG4gIFxuICAvKiBwcml2YXRlIHNldFRyYWZmaWMoZGF0YTogYW55KSB7XG4gICB0aGlzLmluaXRpYWxUcmFmZmljID0gZGF0YTtcbiAgIGlmICh0aGlzLmluc3RhbmNlKSB7XG4gICBjb25zb2xlLmxvZygnRGF0YSBjaGFuZ2VkLi4nKVxuICAgdGhpcy5pbnN0YW5jZS51cGRhdGVEYXRhKHRoaXMuaW5pdGlhbFRyYWZmaWMpO1xuICAgfVxuICAgfSovXG59XG4iXX0=