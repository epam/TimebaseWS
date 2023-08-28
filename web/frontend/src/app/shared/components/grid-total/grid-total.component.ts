import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { TranslateModule }   from '@ngx-translate/core';
import { Observable }        from 'rxjs';
import { map }               from 'rxjs/operators';
import { RowsLoadInfo }      from '../../models/rows-load-info';
import { GridService }       from '../../services/grid.service';
import { GridTotalService }  from './grid-total.service';

@Component({
  selector: 'app-grid-total',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './grid-total.component.html',
  styleUrls: ['./grid-total.component.scss'],
})
export class GridTotalComponent implements OnInit {

  dataCount$: Observable<RowsLoadInfo>;
  
  constructor(
    private gridTotalService: GridTotalService,
  ) { }

  ngOnInit(): void {
    this.dataCount$ = this.gridTotalService.onRowsLoadingInfo();
  }

}
