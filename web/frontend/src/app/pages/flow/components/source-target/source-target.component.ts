import {Component, Input, OnInit} from '@angular/core';
import {VizceralNode} from '../../models/vizceral.extended.models';

@Component({
  selector: 'app-source-target',
  templateUrl: './source-target.component.html',
  styleUrls: ['./source-target.component.scss'],
})
export class SourceTargetComponent implements OnInit {
  @Input() node: VizceralNode;
  @Input() nodeType: 'source' | 'target';

  constructor() {}

  ngOnInit(): void {}
}
