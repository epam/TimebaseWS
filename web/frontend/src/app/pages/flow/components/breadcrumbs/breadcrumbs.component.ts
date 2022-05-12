import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-flow-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
})
export class BreadcrumbsComponent implements OnInit {
  @Input() path: string[];
  @Output() breadCrumbClicked = new EventEmitter<string[]>();

  constructor() {}

  get displayedPath() {
    return [...this.path];
  }

  ngOnInit(): void {}

  public onClick(index?) {
    this.breadCrumbClicked.emit(typeof index === 'number' ? this.path.slice(0, ++index) : []);
  }
}
