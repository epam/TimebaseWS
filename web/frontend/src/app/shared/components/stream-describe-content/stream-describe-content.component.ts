import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormControl }                                        from '@angular/forms';
import { BsModalRef }                                   from 'ngx-bootstrap/modal';
import { Observable, of }                               from 'rxjs';
import { map, shareReplay, startWith, switchMap, take } from 'rxjs/operators';
import { MenuItem }                                     from '../../models/menu-item';
import { StreamsService }                               from '../../services/streams.service';
import { copyToClipboard }                              from '../../utils/copy';

@Component({
  selector: 'app-stream-describe-content',
  templateUrl: './stream-describe-content.component.html',
  styleUrls: ['./stream-describe-content.component.scss'],
})
export class StreamDescribeContentComponent implements OnInit, OnChanges {
  
  @Input() view?: { query: string };
  @Input() stream: MenuItem;
  
  content$: Observable<string>;
  viewControl = new FormControl<string>('');
  
  constructor(
    private streamsService: StreamsService,
  ) { }
  
  ngOnInit(): void {
    const ddl$ = this.streamsService.describe(this.stream.id).pipe(map(describe => describe.ddl), shareReplay(1));
    this.updateInitControl();
    this.content$ = this.viewControl.valueChanges.pipe(
      startWith(null),
      map(() => this.viewControl.value),
      switchMap(view => view === 'schema' ? ddl$ : of(this.view.query)),
      map(value => value.trim()),
    );
  }
  
  copy(): Observable<string> {
    return this.content$.pipe(
      switchMap((ddl) => copyToClipboard(ddl)),
      take(1),
      map(() => this.viewControl.value),
    );
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.view?.currentValue?.id !== changes.view?.previousValue?.id) {
      this.updateInitControl();
    }
  }
  
  private updateInitControl() {
    this.viewControl.patchValue(this.view ? 'query' : 'schema');
  }
}
