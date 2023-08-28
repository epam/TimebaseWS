import { Component, HostBinding, Input } from '@angular/core';
import { RightPaneService }              from '../right-pane.service';

@Component({
  selector: 'app-right-info-wrapper',
  templateUrl: './right-info-wrapper.component.html',
  styleUrls: ['./right-info-wrapper.component.scss'],
})
export class RightInfoWrapperComponent {
  
  @HostBinding('class.overflow') @Input() overflow: boolean;
  
  constructor(
    private rightPaneService: RightPaneService,
  ) { }
  
  close() {
    this.rightPaneService.closeRightPanel();
  }
}
