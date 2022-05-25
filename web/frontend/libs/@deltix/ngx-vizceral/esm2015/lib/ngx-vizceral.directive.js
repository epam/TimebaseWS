import VizceralGraph from '@deltix/vizceral';
// const isEqual = require('lodash.isequal');
import { ResizeObserver } from '@juggle/resize-observer';
import { Directive, Input, Output, EventEmitter, } from '@angular/core';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXZpemNlcmFsLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC12aXpjZXJhbC9zcmMvbGliL25neC12aXpjZXJhbC5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxhQUFhLE1BQVcsa0JBQWtCLENBQUM7QUFDbEQsNkNBQTZDO0FBQzdDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUV6RCxPQUFPLEVBQ0wsU0FBUyxFQU1ULEtBQUssRUFDTCxNQUFNLEVBQ04sWUFBWSxHQUtiLE1BQTRCLGVBQWUsQ0FBQzs7QUFPN0MsTUFBTSxPQUFPLGlCQUFpQjtJQTRENUIsWUFDVSxJQUFZLEVBQ1osVUFBc0I7UUFEdEIsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLGVBQVUsR0FBVixVQUFVLENBQVk7UUE3RHRCLGdCQUFXLEdBQUcsSUFBSSxZQUFZLEVBQU8sQ0FBQztRQUN0QyxnQkFBVyxHQUFHLElBQUksWUFBWSxFQUFPLENBQUM7UUFDdEMsc0JBQWlCLEdBQUcsSUFBSSxZQUFZLEVBQU8sQ0FBQztRQUM1QywyQkFBc0IsR0FBRyxJQUFJLFlBQVksRUFBTyxDQUFDO1FBQ2pELGlCQUFZLEdBQUcsSUFBSSxZQUFZLEVBQU8sQ0FBQztRQUN2QyxnQkFBVyxHQUFHLElBQUksWUFBWSxFQUFPLENBQUM7UUFDdEMsa0JBQWEsR0FBRyxJQUFJLFlBQVksRUFBTyxDQUFDO1FBRXpDLGdCQUFXLEdBQVEsSUFBSSxDQUFDO1FBQ3hCLFlBQU8sR0FBUSxJQUFJLENBQUM7UUFDN0IsMENBQTBDO1FBQ2pDLFNBQUksR0FBUSxJQUFJLENBQUM7UUFDakIsZUFBVSxHQUFHLElBQUksQ0FBQztRQUMzQixzQ0FBc0M7UUFDN0IsWUFBTyxHQUFRLElBQUksQ0FBQztRQUNwQixzQkFBaUIsR0FBUSxJQUFJLENBQUM7UUFDOUIsVUFBSyxHQUFRLElBQUks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QUFLO3NCQUFiLEtBQUs7Z0JBQ0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQUNHLE1BQU07c0JBQWQsS0FBSztnQkFDRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLFdBQVc7c0JBQW5CLEtBQUs7Z0JBSUcscUJBQXFCO3NCQUE3QixLQUFLO2dCQUNhLE1BQU07c0JBQXhCLEtBQUs7dUJBQUMsVUFBVTtnQkF5Q2IsSUFBSTtzQkFEUCxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFZpemNlcmFsR3JhcGggICAgICBmcm9tICdAZGVsdGl4L3ZpemNlcmFsJztcbi8vIGNvbnN0IGlzRXF1YWwgPSByZXF1aXJlKCdsb2Rhc2guaXNlcXVhbCcpO1xuaW1wb3J0IHsgUmVzaXplT2JzZXJ2ZXIgfSBmcm9tICdAanVnZ2xlL3Jlc2l6ZS1vYnNlcnZlcic7XG5cbmltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgT25Jbml0LFxuICBBZnRlclZpZXdJbml0LFxuICBPbkRlc3Ryb3ksXG4gIERvQ2hlY2ssXG4gIE9uQ2hhbmdlcyxcbiAgSW5wdXQsXG4gIE91dHB1dCxcbiAgRXZlbnRFbWl0dGVyLFxuICBOZ1pvbmUsXG4gIEVsZW1lbnRSZWYsXG4gIEtleVZhbHVlRGlmZmVyLFxuICBTaW1wbGVDaGFuZ2VzLFxufSAgICAgICAgICAgICAgICAgICAgICAgZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBWaXpjZXJhbFNpemUgfSBmcm9tICcuL25neC12aXpjZXJhbC5tb2RlbHMnO1xuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbdml6Y2VyYWxdJyxcbiAgZXhwb3J0QXM6ICduZ3hWaXpjZXJhbCcsXG59KVxuZXhwb3J0IGNsYXNzIFZpemNlcmFsRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBBZnRlclZpZXdJbml0LCBPbkRlc3Ryb3ksIERvQ2hlY2ssIE9uQ2hhbmdlcyB7XG4gIEBPdXRwdXQoKSB2aWV3Q2hhbmdlZCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICBAT3V0cHV0KCkgdmlld1VwZGF0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIG9iamVjdEhpZ2hsaWdodGVkID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIEBPdXRwdXQoKSBub2RlQ29udGV4dFNpemVDaGFuZ2VkID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIEBPdXRwdXQoKSBtYXRjaGVzRm91bmQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIG5vZGVVcGRhdGVkID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIEBPdXRwdXQoKSBvYmplY3RIb3ZlcmVkID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIFxuICBASW5wdXQoKSBkZWZpbml0aW9uczogYW55ID0gbnVsbDtcbiAgQElucHV0KCkgdHJhZmZpYzogYW55ID0gbnVsbDtcbiAgLy8gQU5EWS8vIHByaXZhdGUgb2JqZWN0c0pTT046IGFueSA9IG51bGw7XG4gIEBJbnB1dCgpIHZpZXc6IGFueSA9IG51bGw7XG4gIEBJbnB1dCgpIHNob3dMYWJlbHMgPSB0cnVlO1xuICAvLyBwcml2YXRlIGluaXRpYWxUcmFmZmljOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBmaWx0ZXJzOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBvYmplY3RUb0hpZ2hsaWdodDogYW55ID0gbnVsbDtcbiAgQElucHV0KCkgbWF0Y2g6IGFueSA9IG51bGw7XG4gIEBJbnB1dCgpIG1vZGVzOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBhbGxvd0RyYWdnaW5nT2ZOb2RlcyA9IGZhbHNlO1xuICBASW5wdXQoKSBzdHlsZXM6IGFueSA9IG51bGw7XG4gIEBJbnB1dCgpIHRhcmdldEZyYW1lcmF0ZTogYW55ID0gbnVsbDtcbiAgQElucHV0KCkgaW5pdGlhbFNpemU6IHtcbiAgICB3aWR0aDogbnVtYmVyLFxuICAgIGhlaWdodDogbnVtYmVyLFxuICB9O1xuICBASW5wdXQoKSB1c2VDdXJyZW50SW5pdGlhbFNpemU6IGJvb2xlYW47XG4gIEBJbnB1dCgndml6Y2VyYWwnKSBjb25maWc6IGFueTtcbiAgXG4gIHByaXZhdGUgcm86IGFueSA9IG51bGw7XG4gIHByaXZhdGUgaW5zdGFuY2U6IFZpemNlcmFsR3JhcGggPSBudWxsO1xuICBwcml2YXRlIGluaXRpYWxXaWR0aDogbnVtYmVyID0gbnVsbDtcbiAgcHJpdmF0ZSBpbml0aWFsSGVpZ2h0OiBudW1iZXIgPSBudWxsO1xuICBwcml2YXRlIGNvbmZpZ0RpZmY6IEtleVZhbHVlRGlmZmVyPHN0cmluZywgYW55PjtcbiAgLyogQElucHV0KClcbiAgIHNldCB0cmFmZmljKGRhdGE6IGFueSkge1xuICAgdGhpcy5zZXRUcmFmZmljKGRhdGEpO1xuICAgfSovXG4gIHByaXZhdGUgZGVmYXVsdFByb3BzID0ge1xuICAgIGNvbm5lY3Rpb25IaWdobGlnaHRlZDogKCkgPT4ge30sXG4gICAgZGVmaW5pdGlvbnM6IHt9LFxuICAgIGZpbHRlcnM6IFtdLFxuICAgIG1hdGNoOiAnJyxcbiAgICBub2RlSGlnaGxpZ2h0ZWQ6ICgpID0+IHt9LFxuICAgIG5vZGVVcGRhdGVkOiAoKSA9PiB7fSxcbiAgICBub2RlQ29udGV4dFNpemVDaGFuZ2VkOiAoKSA9PiB7fSxcbiAgICBtYXRjaGVzRm91bmQ6ICgpID0+IHt9LFxuICAgIG9iamVjdEhpZ2hsaWdodGVkOiAoKSA9PiB7fSxcbiAgICBvYmplY3RIb3ZlcmVkOiAoKSA9PiB7fSxcbiAgICBvYmplY3RUb0hpZ2hsaWdodDogbnVsbCxcbiAgICBzaG93TGFiZWxzOiB0cnVlLFxuICAgIGFsbG93RHJhZ2dpbmdPZk5vZGVzOiBmYWxzZSxcbiAgICBzdHlsZXM6IHt9LFxuICAgIHRyYWZmaWM6IHt9LFxuICAgIHZpZXdDaGFuZ2VkOiAoKSA9PiB7fSxcbiAgICB2aWV3VXBkYXRlZDogKCkgPT4ge30sXG4gICAgdmlldzogW10sXG4gICAgdGFyZ2V0RnJhbWVyYXRlOiBudWxsLFxuICB9O1xuICBcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSB6b25lOiBOZ1pvbmUsXG4gICAgcHJpdmF0ZSBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgIC8vIHByaXZhdGUgZGlmZmVyczogS2V5VmFsdWVEaWZmZXJzLFxuICApIHtcbiAgfVxuICBcbiAgQElucHV0KClcbiAgc2V0IHNpemUoc2l6ZTogVml6Y2VyYWxTaXplKSB7XG4gICAgdGhpcy5zZXRTaXplKHNpemUud2lkdGgsIHNpemUuaGVpZ2h0KTtcbiAgfVxuICBcbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgXG4gICAgICBjb25zdCBlbFJlZiA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgICAgbGV0IHNpemUgPSB7fTtcbiAgICAgIGlmICh0aGlzLmluaXRpYWxTaXplKSB7XG4gICAgICAgIHNpemUgPSB0aGlzLmluaXRpYWxTaXplO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnVzZUN1cnJlbnRJbml0aWFsU2l6ZSkge1xuICAgICAgICBzaXplID0ge1xuICAgICAgICAgIHdpZHRoOiBlbFJlZi5vZmZzZXRXaWR0aCxcbiAgICAgICAgICBoZWlnaHQ6IGVsUmVmLm9mZnNldEhlaWdodCxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5zdGFuY2UgPSBuZXcgVml6Y2VyYWxHcmFwaChlbFJlZiwgdGhpcy50YXJnZXRGcmFtZXJhdGUsIHNpemUpO1xuICBcbiAgICAgIHRoaXMuaW5zdGFuY2Uub24oJ3ZpZXdDaGFuZ2VkJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMudmlld0NoYW5nZWQuZW1pdChldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmluc3RhbmNlLm9uKCdvYmplY3RIaWdobGlnaHRlZCcsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLm9iamVjdEhpZ2hsaWdodGVkLmVtaXQoZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5pbnN0YW5jZS5vbignb2JqZWN0SG92ZXJlZCcsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLm9iamVjdEhvdmVyZWQuZW1pdChldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmluc3RhbmNlLm9uKCdub2RlVXBkYXRlZCcsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLm5vZGVVcGRhdGVkLmVtaXQoZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5pbnN0YW5jZS5vbignbm9kZUNvbnRleHRTaXplQ2hhbmdlZCcsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLm5vZGVDb250ZXh0U2l6ZUNoYW5nZWQuZW1pdChldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmluc3RhbmNlLm9uKCdtYXRjaGVzRm91bmQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5tYXRjaGVzRm91bmQuZW1pdChldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLmluc3RhbmNlLm9uKCd2aWV3VXBkYXRlZCcsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnZpZXdVcGRhdGVkLmVtaXQoZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBcbiAgICAgIC8vIFBhc3Mgb3VyIGRlZmF1bHRzIHRvIFZpemNlcmFsIGluIHRoZSBjYXNlIHRoYXQgaXQgaGFzIGRpZmZlcmVudCBkZWZhdWx0cy5cbiAgICAgIHRoaXMuaW5zdGFuY2Uuc2V0T3B0aW9ucyh7XG4gICAgICAgIGFsbG93RHJhZ2dpbmdPZk5vZGVzOiB0aGlzLmFsbG93RHJhZ2dpbmdPZk5vZGVzLFxuICAgICAgICBzaG93TGFiZWxzOiB0aGlzLnNob3dMYWJlbHMsXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gICAvL3JldHVybiBiYWNrIGZvciB0aGlzXG4gICAgICAvLyAgaWYgKCFpc0VxdWFsKHRoaXMuZmlsdGVycywgdGhpcy5kZWZhdWx0UHJvcHMuZmlsdGVycykpIHtcbiAgICAgIC8vICAgICB0aGlzLmluc3RhbmNlLnNldEZpbHRlcnModGhpcy5maWx0ZXJzKTtcbiAgICAgIC8vICAgfVxuICAgICAgXG4gICAgICAvLyAgIGlmICghaXNFcXVhbCh0aGlzLmRlZmluaXRpb25zLCB0aGlzLmRlZmF1bHRQcm9wcy5kZWZpbml0aW9ucykpIHtcbiAgICAgIC8vICAgICB0aGlzLmluc3RhbmNlLnVwZGF0ZURlZmluaXRpb25zKHRoaXMuZGVmaW5pdGlvbnMpO1xuICAgICAgLy8gICB9XG4gICAgICBcbiAgICAgIC8vIEZpbmlzaCB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGJlZm9yZSB1cGRhdGluZyB0aGUgdmlldy5cbiAgICAgIC8vIElmIHZpemNlcmFsLXJlYWN0IHdhcyBwYXNzZWQgZGF0YSBkaXJlY3RseSB3aXRob3V0IGFueSBhc3luY2hyb25vdXNcbiAgICAgIC8vIGNhbGxzIHRvIHJldHJpZXZlIHRoZSBkYXRhLCB0aGUgaW5pdGlhbGx5IGxvYWRlZCBncmFwaCB3b3VsZCBub3RcbiAgICAgIC8vIGFuaW1hdGUgcHJvcGVybHkuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGxldCByZW5kZXJlcnMgPSB7XG4gICAgICAgIC8vICAgZ2xvYmFsOiBHbG9iYWxUcmFmZmljR3JhcGgsXG4gICAgICAgIC8vICAgcmVnaW9uOiBSZWdpb25UcmFmZmljR3JhcGgsXG4gICAgICAgIC8vICAgZm9jdXNlZDogRm9jdXNlZFRyYWZmaWNHcmFwaCxcbiAgICAgICAgLy8gICBmb2N1c2VkQ2hpbGQ6IEZvY3VzZWRDaGlsZFRyYWZmaWNHcmFwaCxcbiAgICAgICAgLy8gICBkbnM6IERuc1RyYWZmaWNHcmFwaFxuICAgICAgICAvLyB9O1xuICAgICAgICAvLyBjb25zb2xlLmxvZyAoXCJSZW5kZXJlcnM6XCIpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyAocmVuZGVyZXJzKTtcbiAgICAgICAgLy8gLy90aGlzLmluc3RhbmNlLnNldFJlbmRlcmVycyhyZW5kZXJlcnMpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5pbnN0YW5jZS5zZXRWaWV3KHRoaXMudmlldyB8fCB0aGlzLmRlZmF1bHRQcm9wcy52aWV3LCB0aGlzLm9iamVjdFRvSGlnaGxpZ2h0KTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW5zdGFuY2UudXBkYXRlRGF0YSh0aGlzLnRyYWZmaWMpO1xuICAgICAgICBjb25zdCBwZXJmTm93ID0gdGhpcy5nZXRQZXJmb3JtYW5jZU5vdygpO1xuICAgICAgICB0aGlzLmluc3RhbmNlLmFuaW1hdGUocGVyZk5vdyA9PT0gbnVsbCA/IDAgOiBwZXJmTm93KTtcbiAgICAgICAgdGhpcy5pbnN0YW5jZS51cGRhdGVCb3VuZGluZ1JlY3RDYWNoZSgpO1xuICAgICAgICBcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ1ZpemNlcmFsR3JhcGg6JylcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5pbnN0YW5jZSlcbiAgICAgICAgXG4gICAgICB9LCAwKTtcbiAgICB9KTtcbiAgICBcbiAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5ybyA9IG5ldyBSZXNpemVPYnNlcnZlcigoZW50cmllcywgb2JzZXJ2ZXIpID0+IHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5pbml0aWFsV2lkdGgpIHtcbiAgICAgICAgICB0aGlzLnNldFNpemUoZWxlbWVudC5vZmZzZXRXaWR0aCwgZWxlbWVudC5vZmZzZXRIZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgdGhpcy5yby5vYnNlcnZlKHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICAvLyBBTkRZXG4gICAgLy8gICAgICAgLy8gUGFzcyBvdXIgZGVmYXVsdHMgdG8gVml6Y2VyYWwgaW4gdGhlIGNhc2UgdGhhdCBpdCBoYXMgZGlmZmVyZW50IGRlZmF1bHRzLlxuICAgIC8vICAgICAgIHRoaXMuaW5zdGFuY2Uuc2V0T3B0aW9ucyh7XG4gICAgLy8gICAgICAgICBhbGxvd0RyYWdnaW5nT2ZOb2RlczogdGhpcy5hbGxvd0RyYWdnaW5nT2ZOb2RlcyxcbiAgICAvLyAgICAgICAgIHNob3dMYWJlbHM6IHRoaXMuc2hvd0xhYmVsc1xuICAgIC8vICAgICAgIH0pO1xuICAgIFxuICB9XG4gIFxuICBwdWJsaWMgZ2V0UGVyZm9ybWFuY2VOb3coKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgY29uc3QgZyA9IHdpbmRvdztcbiAgICBpZiAoZyAhPSBudWxsKSB7XG4gICAgICBjb25zdCBwZXJmID0gZy5wZXJmb3JtYW5jZTtcbiAgICAgIGlmIChwZXJmICE9IG51bGwpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBwZXJmTm93ID0gcGVyZi5ub3coKTtcbiAgICAgICAgICBpZiAodHlwZW9mIHBlcmZOb3cgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICByZXR1cm4gcGVyZk5vdztcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKCdWaXpjZXJhbENvbXBvbmVudDpuZ09uRGVzdHJveSgpIC0gc3VwcHJlc3NpbmcgaW5zdGFuY2UuZGVzdHJveSgpJyk7XG4gICAgaWYgKHRoaXMucm8pIHtcbiAgICAgIHRoaXMucm8uZGlzY29ubmVjdCgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5pbnN0YW5jZSkge1xuICAgICAgLy8gQU5EWS8vdGhpcy5vYmplY3RzSlNPTiA9IHRoaXMuaW5zdGFuY2UudG9KU09OKCk7XG4gICAgICBcbiAgICAgIC8vIEFORFkvLyB0aGlzLmluc3RhbmNlLmRpc3Bvc2UoKTsgLy8gPC0tIGRvZXNuJ3Qgd29ya1xuICAgICAgXG4gICAgICBkZWxldGUgdGhpcy5pbnN0YW5jZTtcbiAgICAgIFxuICAgICAgdGhpcy5pbnN0YW5jZSA9IG51bGw7XG4gICAgfVxuICB9XG4gIFxuICBuZ0RvQ2hlY2soKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY29uZmlnRGlmZikge1xuICAgICAgY29uc3QgY2hhbmdlcyA9IHRoaXMuY29uZmlnRGlmZi5kaWZmKHRoaXMuY29uZmlnIHx8IHt9KTtcbiAgICAgIFxuICAgICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgICAgdGhpcy5uZ09uRGVzdHJveSgpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5uZ09uSW5pdCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIC8vIGNvbnNvbGUubG9nKCdWaXpjZXJhbERpcmVjdGl2ZTpuZ09uQ2hhbmdlcygpKScpO1xuICAgIGlmICh0aGlzLmluc3RhbmNlICYmIGNoYW5nZXMuZGlzYWJsZWQpIHtcbiAgICAgIGlmIChjaGFuZ2VzLmRpc2FibGVkLmN1cnJlbnRWYWx1ZSAhPT0gY2hhbmdlcy5kaXNhYmxlZC5wcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgIHRoaXMubmdPbkRlc3Ryb3koKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMubmdPbkluaXQoKTtcbiAgICAgIH0gZWxzZSBpZiAoY2hhbmdlcy50cmFmZmljKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdWaXpjZXJhbERpcmVjdGl2ZTpuZ09uQ2hhbmdlcyh0cmFmZmljKScpO1xuICAgICAgICB0aGlzLmluc3RhbmNlLnVwZGF0ZURhdGEodGhpcy50cmFmZmljKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gIH1cbiAgXG4gIHB1YmxpYyB2aXpjZXJhbCgpOiBWaXpjZXJhbEdyYXBoIHtcbiAgICByZXR1cm4gdGhpcy5pbnN0YW5jZTtcbiAgfVxuICBcbiAgcHVibGljIHNldFZpZXcodmlldzogc3RyaW5nIFtdKTogdm9pZCB7XG4gICAgdGhpcy52aWV3ID0gdmlldztcbiAgICB0aGlzLmluc3RhbmNlLnNldFZpZXcodGhpcy52aWV3IHx8IHRoaXMuZGVmYXVsdFByb3BzLnZpZXcsIHRoaXMub2JqZWN0VG9IaWdobGlnaHQpO1xuICB9XG4gIFxuICBcbiAgcHVibGljIHNldFNpemUod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLmluaXRpYWxXaWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaW5pdGlhbEhlaWdodCA9IGhlaWdodDtcbiAgICBcbiAgICBpZiAodGhpcy5pbnN0YW5jZSkge1xuICAgICAgdGhpcy5pbnN0YW5jZS5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gcHJpdmF0ZSB1cGRhdGVTdHlsZXMoc3R5bGVzKSB7XG4gIC8vICAgY29uc3Qgc3R5bGVOYW1lcyA9IHRoaXMuaW5zdGFuY2UuZ2V0U3R5bGVzKCk7XG4gIC8vICAgY29uc3QgY3VzdG9tU3R5bGVzID0gc3R5bGVOYW1lcy5yZWR1Y2UoKHJlc3VsdCwgc3R5bGVOYW1lKSA9PiB7XG4gIC8vICAgICByZXN1bHRbc3R5bGVOYW1lXSA9IHN0eWxlc1tzdHlsZU5hbWVdIHx8IHJlc3VsdFtzdHlsZU5hbWVdO1xuICAvLyAgICAgcmV0dXJuIHJlc3VsdDtcbiAgLy8gICB9LCB7fSk7XG4gIC8vXG4gIC8vICAgdGhpcy5pbnN0YW5jZS51cGRhdGVTdHlsZXMoY3VzdG9tU3R5bGVzKTtcbiAgLy8gfVxuICBcbiAgXG4gIC8qIHByaXZhdGUgc2V0VHJhZmZpYyhkYXRhOiBhbnkpIHtcbiAgIHRoaXMuaW5pdGlhbFRyYWZmaWMgPSBkYXRhO1xuICAgaWYgKHRoaXMuaW5zdGFuY2UpIHtcbiAgIGNvbnNvbGUubG9nKCdEYXRhIGNoYW5nZWQuLicpXG4gICB0aGlzLmluc3RhbmNlLnVwZGF0ZURhdGEodGhpcy5pbml0aWFsVHJhZmZpYyk7XG4gICB9XG4gICB9Ki9cbn1cbiJdfQ==