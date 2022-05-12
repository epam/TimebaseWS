import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-query-btn',
  templateUrl: './query-btn.component.html',
  styleUrls: ['./query-btn.component.scss'],
})
export class QueryBtnComponent {
  @Input() showText = true;
}
