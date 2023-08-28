import {Component, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Observable, ReplaySubject, timer} from 'rxjs';
import {map, takeUntil, pluck, first, filter, switchMap} from 'rxjs/operators';
import {MultiSelectItem} from '../../../../../shared/components/multi-select/multi-select-item';
import {MenuItem} from '../../../../../shared/models/menu-item';
import {SymbolsService} from '../../../../../shared/services/symbols.service';
import {appRoute} from '../../../../../shared/utils/routes.names';
import {StreamsNavigationScrollService} from '../../../streams-navigation/streams-navigation-scroll.service';
import { GlobalFiltersService } from 'src/app/shared/services/global-filters.service';
import { MenuItemsService } from 'src/app/shared/services/menu-items.service';

@Component({
  selector: 'app-modal-stream-chart',
  templateUrl: './modal-stream-chart.component.html',
  styleUrls: ['./modal-stream-chart.component.scss'],
})
export class ModalStreamChartComponent implements OnInit, OnDestroy {
  symbols$: Observable<MultiSelectItem[]>;
  item: MenuItem;
  form: UntypedFormGroup;

  private destroy$ = new ReplaySubject(1);
  private showSpaces: boolean;
  private spaceName: string;

  constructor(
    private symbolsService: SymbolsService,
    private router: Router,
    private fb: UntypedFormBuilder,
    private bsModalRef: BsModalRef,
    private streamsNavigationScrollService: StreamsNavigationScrollService,
    private globalFiltersService: GlobalFiltersService,
    private menuItemsService: MenuItemsService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      symbol: [null, Validators.required],
      newTab: localStorage.getItem('chartNewTabLastChoice') || false,
    });
    this.symbols$ = this.symbolsService
      .getSymbols(this.item.meta.stream.id)
      .pipe(map((symbols) => symbols.map((s) => ({id: s, name: s}))));

    this.form
      .get('newTab')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        localStorage.setItem('chartNewTabLastChoice', value);
      });

    this.globalFiltersService.getFilters()
      .pipe(
        filter(res => res.showSpaces),
        first(), 
        takeUntil(this.destroy$),
        pluck('showSpaces'),
        switchMap(() => {
          this.showSpaces = true;
          return this.menuItemsService.getItems([`/${this.item.id}`], true)
        }))
        .subscribe(result => {
          this.spaceName = result.children[0].children[0].name;
        });
  }

  open() {
    this.bsModalRef.hide();
    
    let queryParams: object = this.form.get('newTab').value ? {newTab: 1} : {};

    this.item.meta?.chartType.forEach(ct => {
      queryParams['chartType'] =  queryParams['chartType'] || [];
      queryParams['chartTypeTitles'] =  queryParams['chartTypeTitles'] || [];
      queryParams['chartType'].push(ct.chartType);
      queryParams['chartTypeTitles'].push(ct.title);
    });
    queryParams['streamName'] = this.item.meta.stream.name;
    queryParams['isView'] = this.item.meta.isView ? '1' : '';
    queryParams = this.showSpaces ? { ...queryParams, space: this.spaceName } : queryParams;

    this.router.navigate(
      ['/', appRoute, 'symbol', 'chart', this.item.meta.stream.id, this.form.get('symbol').value],
      {queryParams},
    );
    timer().subscribe(() => this.streamsNavigationScrollService.scrollToActiveMenu());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
