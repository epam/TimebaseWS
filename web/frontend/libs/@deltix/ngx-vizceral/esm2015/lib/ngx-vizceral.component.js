import { Component, EventEmitter, HostBinding, Input, Output, ViewChild, ViewEncapsulation, } from '@angular/core';
import { VizceralDirective } from './ngx-vizceral.directive';
import * as i0 from "@angular/core";
import * as i1 from "./ngx-vizceral.directive";
export class VizceralComponent {
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
VizceralComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "12.0.0", type: VizceralComponent, selector: "vizceral", inputs: { size: "size", view: "view", showLabels: "showLabels", filters: "filters", objectToHighlight: "objectToHighlight", match: "match", modes: "modes", allowDraggingOfNodes: "allowDraggingOfNodes", styles: "styles", targetFramerate: "targetFramerate", initialSize: "initialSize", useCurrentInitialSize: "useCurrentInitialSize", traffic: "traffic" }, outputs: { viewChanged: "viewChanged", viewUpdated: "viewUpdated", objectHighlighted: "objectHighlighted", nodeContextSizeChanged: "nodeContextSizeChanged", matchesFound: "matchesFound", nodeUpdated: "nodeUpdated", objectHovered: "objectHovered" }, host: { properties: { "class.vizceral": "this.directiveRef" } }, viewQueries: [{ propertyName: "directiveRef", first: true, predicate: VizceralDirective, descendants: true, static: true }], exportAs: ["ngxVizceral"], usesOnChanges: true, ngImport: i0, template: "<div class=\"vizceral\">\n  <canvas\n      (matchesFound)=\"matchesFound.emit($event)\"\n      (nodeContextSizeChanged)=\"nodeContextSizeChanged.emit($event)\"\n      (objectHighlighted)=\"objectHighlighted.emit($event)\"\n      (viewChanged)=\"viewChanged.emit($event)\"\n      (viewUpdated)=\"viewUpdated.emit($event)\"\n      [allowDraggingOfNodes]=\"allowDraggingOfNodes\"\n      [initialSize]=\"initialSize\"\n      [useCurrentInitialSize]=\"useCurrentInitialSize\"\n      [filters]=\"filters\"\n      [match]=\"match\"\n      [modes]=\"modes\"\n      [objectToHighlight]=\"objectToHighlight\"\n      [showLabels]=\"showLabels\"\n      [size]=\"size\"\n      [styles]=\"styles\"\n      [traffic]=\"initData\"\n      [view]=\"view\" style=\" width:100%; height:100%\"\n      vizceral>\n  </canvas>\n  \n  <div class=\"vizceral-notice\"></div>\n\n</div>\n", styles: ["vizceral{width:100%;height:100%}vizceral[fxflex]{display:flex;flex-direction:column;min-width:0;min-height:0}.vizceral,vizceral.vizceral{width:100%;height:100%}.vizceral{display:block;box-sizing:border-box}.vizceral .vizceral-notice{display:block;position:absolute;padding:0 3px;width:200px;background-color:#fff;border-left:2px solid grey;font-size:11px;color:grey}.vizceral .vizceral-notice ul{list-style:none;padding:0;margin:0}.vizceral .vizceral-notice>ul>li{line-height:12px;padding-top:3px;padding-bottom:3px}.vizceral .vizceral-notice .subtitle{font-weight:900}"], directives: [{ type: i1.VizceralDirective, selector: "[vizceral]", inputs: ["definitions", "traffic", "view", "showLabels", "filters", "objectToHighlight", "match", "modes", "allowDraggingOfNodes", "styles", "targetFramerate", "initialSize", "useCurrentInitialSize", "vizceral", "size"], outputs: ["viewChanged", "viewUpdated", "objectHighlighted", "nodeContextSizeChanged", "matchesFound", "nodeUpdated", "objectHovered"], exportAs: ["ngxVizceral"] }], encapsulation: i0.ViewEncapsulation.None });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LXZpemNlcmFsLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC12aXpjZXJhbC9zcmMvbGliL25neC12aXpjZXJhbC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtdml6Y2VyYWwvc3JjL2xpYi9uZ3gtdml6Y2VyYWwuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVMLFNBQVMsRUFDVCxZQUFZLEVBQ1osV0FBVyxFQUNYLEtBQUssRUFFTCxNQUFNLEVBRU4sU0FBUyxFQUNULGlCQUFpQixHQUNsQixNQUFpQyxlQUFlLENBQUM7QUFFbEQsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7OztBQVU3RCxNQUFNLE9BQU8saUJBQWlCO0lBb0M1QjtRQW5DQSw0QkFBNEI7UUFDckIsYUFBUSxHQUFRLElBQUksQ0FBQztRQUU1QixXQUFXO1FBQ1gsMkJBQTJCO1FBQzNCLHdCQUF3QjtRQUN4QixJQUFJO1FBRUssU0FBSSxHQUFpQixFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQyxDQUFDO1FBQ2pELFNBQUksR0FBUSxJQUFJLENBQUM7UUFDakIsZUFBVSxHQUFRLElBQUksQ0FBQztRQUN2QixZQUFPLEdBQVEsSUFBSSxDQUFDO1FBQ3BCLHNCQUFpQixHQUFRLElBQUksQ0FBQztRQUM5QixVQUFLLEdBQVEsSUFBSSxDQUFDO1FBQ2xCLFVBQUssR0FBUSxJQUFJLENBQUM7UUFDbEIseUJBQW9CLEdBQVEsSUFBSSxDQUFDO1FBQ2pDLFdBQU0sR0FBUSxJQUFJLENBQUM7UUFDbkIsb0JBQWUsR0FBUSxJQUFJLENBQUM7UUFPM0IsZ0JBQVcsR0FBRyxJQUFJLFlBQVksRUFBTyxDQUFDO1FBQ3RDLGdCQUFXLEdBQUcsSUFBSSxZQUFZLEVBQU8sQ0FBQztRQUN0QyxzQkFBaUIs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c0JBQWYsS0FBSztnQkFDRyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLEtBQUs7c0JBQWIsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBQ0csTUFBTTtzQkFBZCxLQUFLO2dCQUNHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBQ0csV0FBVztzQkFBbkIsS0FBSztnQkFJRyxxQkFBcUI7c0JBQTdCLEtBQUs7Z0JBRUksV0FBVztzQkFBcEIsTUFBTTtnQkFDRyxXQUFXO3NCQUFwQixNQUFNO2dCQUNHLGlCQUFpQjtzQkFBMUIsTUFBTTtnQkFDRyxzQkFBc0I7c0JBQS9CLE1BQU07Z0JBQ0csWUFBWTtzQkFBckIsTUFBTTtnQkFDRyxXQUFXO3NCQUFwQixNQUFNO2dCQUNHLGFBQWE7c0JBQXRCLE1BQU07Z0JBR3VDLFlBQVk7c0JBRHpELFdBQVc7dUJBQUMsZ0JBQWdCOztzQkFDNUIsU0FBUzt1QkFBQyxpQkFBaUIsRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUM7Z0JBT3hDLE9BQU87c0JBRFYsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIENvbXBvbmVudCxcbiAgRXZlbnRFbWl0dGVyLFxuICBIb3N0QmluZGluZyxcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT3V0cHV0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxufSAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCBWaXpjZXJhbEdyYXBoICAgICAgICAgZnJvbSAnQGRlbHRpeC92aXpjZXJhbCc7XG5pbXBvcnQgeyBWaXpjZXJhbERpcmVjdGl2ZSB9IGZyb20gJy4vbmd4LXZpemNlcmFsLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBWaXpjZXJhbFNpemUgfSAgICAgIGZyb20gJy4vbmd4LXZpemNlcmFsLm1vZGVscyc7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ3ZpemNlcmFsJyxcbiAgZXhwb3J0QXM6ICduZ3hWaXpjZXJhbCcsXG4gIHRlbXBsYXRlVXJsOiAnLi9uZ3gtdml6Y2VyYWwuY29tcG9uZW50Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9uZ3gtdml6Y2VyYWwuY29tcG9uZW50LnNjc3MnXSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbn0pXG5leHBvcnQgY2xhc3MgVml6Y2VyYWxDb21wb25lbnQgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkNoYW5nZXMge1xuICAvLyBwcml2YXRlIGpzb246IGFueSA9IG51bGw7XG4gIHB1YmxpYyBpbml0RGF0YTogYW55ID0gbnVsbDtcbiAgXG4gIC8vIEBJbnB1dCgpXG4gIC8vIHNldCBkYXRhKGRhdGE6IHN0cmluZykge1xuICAvLyAgIHRoaXMuc2V0SlNPTihkYXRhKTtcbiAgLy8gfVxuICBcbiAgQElucHV0KCkgc2l6ZTogVml6Y2VyYWxTaXplID0ge3dpZHRoOiBudWxsLCBoZWlnaHQ6IG51bGx9O1xuICBASW5wdXQoKSB2aWV3OiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBzaG93TGFiZWxzOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBmaWx0ZXJzOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBvYmplY3RUb0hpZ2hsaWdodDogYW55ID0gbnVsbDtcbiAgQElucHV0KCkgbWF0Y2g6IGFueSA9IG51bGw7XG4gIEBJbnB1dCgpIG1vZGVzOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSBhbGxvd0RyYWdnaW5nT2ZOb2RlczogYW55ID0gbnVsbDtcbiAgQElucHV0KCkgc3R5bGVzOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKSB0YXJnZXRGcmFtZXJhdGU6IGFueSA9IG51bGw7XG4gIEBJbnB1dCgpIGluaXRpYWxTaXplOiB7XG4gICAgd2lkdGg6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgfTtcbiAgQElucHV0KCkgdXNlQ3VycmVudEluaXRpYWxTaXplOiBib29sZWFuO1xuICBcbiAgQE91dHB1dCgpIHZpZXdDaGFuZ2VkID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIEBPdXRwdXQoKSB2aWV3VXBkYXRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICBAT3V0cHV0KCkgb2JqZWN0SGlnaGxpZ2h0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIG5vZGVDb250ZXh0U2l6ZUNoYW5nZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIG1hdGNoZXNGb3VuZCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICBAT3V0cHV0KCkgbm9kZVVwZGF0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIG9iamVjdEhvdmVyZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgXG4gIEBIb3N0QmluZGluZygnY2xhc3Mudml6Y2VyYWwnKVxuICBAVmlld0NoaWxkKFZpemNlcmFsRGlyZWN0aXZlLCB7c3RhdGljOiB0cnVlfSkgZGlyZWN0aXZlUmVmOiBWaXpjZXJhbERpcmVjdGl2ZTtcbiAgXG4gIGNvbnN0cnVjdG9yKCkge1xuICB9XG4gIFxuICAvLyBASW5wdXQoKSB0cmFmZmljOiBhbnkgPSBudWxsO1xuICBASW5wdXQoKVxuICBzZXQgdHJhZmZpYyhkYXRhOiBhbnkpIHtcbiAgICB0aGlzLnNldFRyYWZmaWMoZGF0YSk7XG4gIH1cbiAgXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICAvLyBpZiAodGhpcy5qc29uICE9IG51bGwpIHtcbiAgICAvLyAgIHRoaXMuc2V0SlNPTih0aGlzLmpzb24sIHRydWUpO1xuICAgIC8vIH1cbiAgfVxuICBcbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICBcbiAgfVxuICBcbiAgdml6Y2VyYWwoKTogVml6Y2VyYWxHcmFwaCB7XG4gICAgcmV0dXJuIHRoaXMuZGlyZWN0aXZlUmVmLnZpemNlcmFsKCk7XG4gIH1cbiAgXG4gIHNldFZpZXcodmlldzogc3RyaW5nW10pIHtcbiAgICB0aGlzLmRpcmVjdGl2ZVJlZi5zZXRWaWV3KHZpZXcpO1xuICB9XG5cbiAgbG9jYXRlKHNlYXJjaFRleHQ6IHN0cmluZykge1xuICAgIC8vIGNvbnNvbGUubG9nKCdMb2NhdGluZyBub2RlcyB0aGF0IG1hdGNoOiAnICsgc2VhcmNoVGV4dCk7XG4gICAgdGhpcy52aXpjZXJhbCgpLmZpbmROb2RlcyhzZWFyY2hUZXh0KTtcbiAgfVxuICBcbiAgcHJpdmF0ZSBzZXRUcmFmZmljKGRhdGE6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuaW5pdERhdGEgPSBkYXRhO1xuICAgIC8vIGlmIChkYXRhICE9IG51bGwpIHtcbiAgICAvLyAgIHRoaXMuaW5pdERhdGFbJ1F1YW50U2VydmVyJ10uX3BhcnRpY2xlU3lzdGVtID0ge1xuICAgIC8vICAgICAgIGlzRW5hYmxlZDogdHJ1ZSxcbiAgICAvLyAgICAgICB2aXNjb3VzRHJhZ0NvZWZmaWNpZW50OiAwLjIsXG4gICAgLy8gICAgICAgaG9va3NTcHJpbmdzOiB7XG4gICAgLy8gICAgICAgICByZXN0TGVuZ3RoOiA1MCxcbiAgICAvLyAgICAgICAgIHNwcmluZ0NvbnN0YW50OiAwLjIsXG4gICAgLy8gICAgICAgICBkYW1waW5nQ29uc3RhbnQ6IDAuMVxuICAgIC8vICAgICAgIH0sXG4gICAgLy8gICAgICAgcGFydGljbGVzOiB7XG4gICAgLy8gICAgICAgICBtYXNzOiAxXG4gICAgLy8gICAgICAgfVxuICAgIC8vICAgfTtcbiAgICAvLyB9XG4gICAgaWYgKHRoaXMuZGlyZWN0aXZlUmVmICYmIHRoaXMuZGlyZWN0aXZlUmVmLnZpemNlcmFsKCkpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdWaXpjZXJhbENvbXBvbmVudDpzZXRUcmFmZmljJyk7XG4gICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgLy8gY29uc29sZS5sb2codGhpcy5kaXJlY3RpdmVSZWYudml6Y2VyYWwoKSk7XG4gICAgICB0aGlzLnZpemNlcmFsKCkudXBkYXRlRGF0YShkYXRhKTtcbiAgICAgIFxuICAgICAgLy8gY29uc29sZS5sb2coJ1ZpemNlcmFsR3JhcGg6JylcbiAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMudml6Y2VyYWwoKSlcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdHcmFwaDonKVxuICAgICAgXG4gICAgICAvLyBsZXQgZ3JhcGggPSB0aGlzLnZpemNlcmFsKCkuZ2V0R3JhcGgoJ1F1YW50U2VydmVyJywgbnVsbCkgYXMgVHJhZmZpY0dyYXBoO1xuICAgICAgLy8gaWYgKGdyYXBoKSB7XG4gICAgICAvLyAgIGxldCBvcHRpb25zID0ge1xuICAgICAgLy8gICAgIC4uLmdyYXBoLmdldFBoeXNpY3NPcHRpb25zICgpLFxuICAgICAgLy8gICAgIGlzRW5hYmxlZDogdHJ1ZSxcbiAgICAgIC8vICAgICBqYXNwZXJzUmVwbHVzaW9uQmV0d2VlblBhcnRpY2xlczogdHJ1ZSxcbiAgICAgIC8vICAgICB2aXNjb3VzRHJhZ0NvZWZmaWNpZW50OiAwLjIsXG4gICAgICAvLyAgICAgaG9va3NTcHJpbmdzOiB7XG4gICAgICAvLyAgICAgICByZXN0TGVuZ3RoOiA1MCxcbiAgICAgIC8vICAgICAgIHNwcmluZ0NvbnN0YW50OiAwLjIsXG4gICAgICAvLyAgICAgICBkYW1waW5nQ29uc3RhbnQ6IDAuMVxuICAgICAgLy8gICAgIH0sXG4gICAgICAvLyAgICAgcGFydGljbGVzOiB7XG4gICAgICAvLyAgICAgICBtYXNzOiAxXG4gICAgICAvLyAgICAgfVxuICAgICAgLy8gICB9O1xuICAgICAgXG4gICAgICAvLyAgIGxldCBmbGFnID0gZmFsc2U7XG4gICAgICAvLyAgIGxldCBfcGFydGljbGVTeXN0ZW1faXNFbmFibGVkID0gZmFsc2U7XG4gICAgICAvLyAgIGlmIChoYXNPd25Qcm9wRi5jYWxsKG9wdGlvbnMsICdpc0VuYWJsZWQnKSkge1xuICAgICAgLy8gICAgIGxldCB7IGlzRW5hYmxlZCB9ID0gb3B0aW9ucztcbiAgICAgIC8vICAgICBvcHRpb25zID0geyAuLi5vcHRpb25zfTtcbiAgICAgIC8vICAgICBkZWxldGUgb3B0aW9ucy5pc0VuYWJsZWQ7XG4gICAgICAvLyAgICAgaWYgKHR5cGVvZiBpc0VuYWJsZWQgIT09ICdib29sZWFuJykge1xuICAgICAgLy8gICAgICAgY29uc29sZS53YXJuKCdHb3Qgbm9uLWJvb2xlYW4gdmFsdWUgZm9yIFBoeXNpY3NPcHRpb25zLmlzRW5hYmxlZCwgY29lcmNpbmcgdG8gYm9vbGVhbjonLCBpc0VuYWJsZWQpO1xuICAgICAgLy8gICAgICAgaXNFbmFibGVkID0gISFpc0VuYWJsZWQ7XG4gICAgICAvLyAgICAgfVxuICAgICAgLy8gICAgIGZsYWcgPSBfcGFydGljbGVTeXN0ZW1faXNFbmFibGVkICE9PSBpc0VuYWJsZWQ7XG4gICAgICAvLyAgICAgX3BhcnRpY2xlU3lzdGVtX2lzRW5hYmxlZCA9IGlzRW5hYmxlZDtcbiAgICAgIC8vICAgfVxuICAgICAgLy8gICBjb25zb2xlLmxvZyAoXCJJUyBFTkFCTEVEOiBcIiArIGZsYWcpO1xuICAgICAgXG4gICAgICAvLyAgIGNvbnNvbGUubG9nKGdyYXBoLmdldFBoeXNpY3NPcHRpb25zICgpKTtcbiAgICAgIC8vICAgY29uc29sZS5sb2cob3B0aW9ucyk7XG4gICAgICAvLyAgIGdyYXBoLnNldFBoeXNpY3NPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgLy8gICBjb25zb2xlLmxvZyhncmFwaCk7XG4gICAgICAvLyB9XG4gICAgICBcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHByaXZhdGUgc2V0SlNPTihqc29uOiBzdHJpbmcsIGZvcmNlPzogYm9vbGVhbik6IHZvaWQge1xuICAvLyAgIGlmIChmb3JjZSB8fCBqc29uICE9PSB0aGlzLmpzb24pIHtcbiAgLy8gICAgIGlmICh0aGlzLmRpcmVjdGl2ZVJlZiAmJiB0aGlzLmRpcmVjdGl2ZVJlZi52aXpjZXJhbCgpKSB7XG4gIC8vICAgICAgIC8vIHRoaXMuZGlyZWN0aXZlUmVmLmxvYWRGcm9tSlNPTihqc29uLCAoKSA9PiB7XG4gIC8vICAgICAgIC8vICAgLy90aGlzLmRhdGFMb2FkZWQuZW1pdCh0aGlzLmRpcmVjdGl2ZVJlZi52aXpjZXJhbCgpKTtcbiAgLy8gICAgICAgLy8gfSk7XG4gIC8vICAgICB9XG4gIFxuICAvLyAgICAgdGhpcy5qc29uID0ganNvbjtcbiAgLy8gICB9XG4gIC8vIH1cbn1cbiIsIjxkaXYgY2xhc3M9XCJ2aXpjZXJhbFwiPlxuICA8Y2FudmFzXG4gICAgICAobWF0Y2hlc0ZvdW5kKT1cIm1hdGNoZXNGb3VuZC5lbWl0KCRldmVudClcIlxuICAgICAgKG5vZGVDb250ZXh0U2l6ZUNoYW5nZWQpPVwibm9kZUNvbnRleHRTaXplQ2hhbmdlZC5lbWl0KCRldmVudClcIlxuICAgICAgKG9iamVjdEhpZ2hsaWdodGVkKT1cIm9iamVjdEhpZ2hsaWdodGVkLmVtaXQoJGV2ZW50KVwiXG4gICAgICAodmlld0NoYW5nZWQpPVwidmlld0NoYW5nZWQuZW1pdCgkZXZlbnQpXCJcbiAgICAgICh2aWV3VXBkYXRlZCk9XCJ2aWV3VXBkYXRlZC5lbWl0KCRldmVudClcIlxuICAgICAgW2FsbG93RHJhZ2dpbmdPZk5vZGVzXT1cImFsbG93RHJhZ2dpbmdPZk5vZGVzXCJcbiAgICAgIFtpbml0aWFsU2l6ZV09XCJpbml0aWFsU2l6ZVwiXG4gICAgICBbdXNlQ3VycmVudEluaXRpYWxTaXplXT1cInVzZUN1cnJlbnRJbml0aWFsU2l6ZVwiXG4gICAgICBbZmlsdGVyc109XCJmaWx0ZXJzXCJcbiAgICAgIFttYXRjaF09XCJtYXRjaFwiXG4gICAgICBbbW9kZXNdPVwibW9kZXNcIlxuICAgICAgW29iamVjdFRvSGlnaGxpZ2h0XT1cIm9iamVjdFRvSGlnaGxpZ2h0XCJcbiAgICAgIFtzaG93TGFiZWxzXT1cInNob3dMYWJlbHNcIlxuICAgICAgW3NpemVdPVwic2l6ZVwiXG4gICAgICBbc3R5bGVzXT1cInN0eWxlc1wiXG4gICAgICBbdHJhZmZpY109XCJpbml0RGF0YVwiXG4gICAgICBbdmlld109XCJ2aWV3XCIgc3R5bGU9XCIgd2lkdGg6MTAwJTsgaGVpZ2h0OjEwMCVcIlxuICAgICAgdml6Y2VyYWw+XG4gIDwvY2FudmFzPlxuICBcbiAgPGRpdiBjbGFzcz1cInZpemNlcmFsLW5vdGljZVwiPjwvZGl2PlxuXG48L2Rpdj5cbiJdfQ==