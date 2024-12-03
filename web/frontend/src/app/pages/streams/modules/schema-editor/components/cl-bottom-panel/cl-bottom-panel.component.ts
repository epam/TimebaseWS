import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-cl-bottom-panel',
  templateUrl: './cl-bottom-panel.component.html',
  styleUrls: ['./cl-bottom-panel.component.scss'],
})
export class ClBottomPanelComponent {
  @Input() readonly = false;
}
