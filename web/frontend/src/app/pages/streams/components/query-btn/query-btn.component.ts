import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-query-btn',
  templateUrl: './query-btn.component.html',
  styleUrls: ['./query-btn.component.scss'],
})
export class QueryBtnComponent implements OnChanges, OnInit {
  @Input() showText = true;
  @Input() stream: string;
  @Input() symbol: string;

  params: {[index: string]: unknown};

  ngOnInit() {
    this.freshParams();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.freshParams();
  }

  private freshParams() {
    this.params = {newTab: true, querySymbol: this.symbol, queryStream: this.stream};
  }
}
