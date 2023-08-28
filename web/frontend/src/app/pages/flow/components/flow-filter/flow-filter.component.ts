import { Component, OnDestroy, OnInit }        from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import equal                                   from 'fast-deep-equal';
import { Observable, Subject }                 from 'rxjs';
import { map, switchMap, take, takeUntil }     from 'rxjs/operators';
import { TabStorageService }                   from '../../../../shared/services/tab-storage.service';
import { FlowFilter }                          from '../../models/flow-filter';
import { TrafficModel }                        from '../../models/traffic.model';
import { FlowDataService }                     from '../../services/flow-data.service';


interface Form {
  topology: FormControl<string>;
  nodes: FormControl<{ id: string, name: string }[]>;
  rpsType: FormControl<string>;
  rpsVal: FormControl<number>;
}

@Component({
  selector: 'app-flow-filter',
  templateUrl: './flow-filter.component.html',
  styleUrls: ['./flow-filter.component.scss'],
})
export class FlowFilterComponent implements OnInit, OnDestroy {
  nodesList$: Observable<{ id: string, name: string }[]>;
  topologies = ['ltrTree', 'ringCenter'];
  rpsFilterTypeVal$: Subject<string> = new Subject();
  form: FormGroup<Form>;
  rpsTypeValues = ['all', 'more', 'less', 'equal'];
  rpsValues = [0, 1, 5, 10, 20, 50, 100, 200, 500, 1000];
  
  private destroy$ = new Subject<any>();
  
  constructor(
    private flowDataService: FlowDataService,
    private fb: FormBuilder,
    private tabStorage: TabStorageService<FlowFilter>,
  ) {}
  
  ngOnInit(): void {
    this.form = this.fb.group({
      topology: null,
      nodes: null,
      rpsType: null,
      rpsVal: null,
    }) as FormGroup<Form>;
    
    this.tabStorage.updateData((data) => (data || {
      topology: this.topologies[0],
      nodes: [],
      rpsType: 'all',
      rpsVal: null,
    })).pipe(
      take(1),
      switchMap(() => this.tabStorage.getData()),
      takeUntil(this.destroy$),
    ).subscribe(data => {
      this.flowDataService.updateLayout(data.topology);
      Object.keys(data).forEach(key => {
        if (this.form.get(key).value !== data[key]) {
          this.form.get(key).patchValue(data[key], {emitEvent: false});
        }
      });
      
      if (data.rpsType === 'all') {
        this.form.get('rpsVal').setValue(null, {emitEvent: false});
        this.form.get('rpsVal').disable({emitEvent: false});
      } else {
        this.form.get('rpsVal').enable({emitEvent: false});
      }
    });
    
    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(formData => {
      this.tabStorage.updateDataSync(() => formData);
    });
    
    this.nodesList$ = this.flowDataService.flow().pipe(
      map((flow: TrafficModel) => flow?.nodes?.map(
        (node) => ({id: node.name, name: `${node.name} (${node.class})`}),
      ) || []),
    );
  }
  
  onRPSFilterChangeInput(text: string) {
    const number = text === '' ? NaN : Number(text);
    this.form.get('rpsVal').patchValue(isFinite(number) ? number : null);
  }
  
  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  
  topologyManuallyChanged() {
    this.flowDataService.topologyManuallyChanged();
  }
}
