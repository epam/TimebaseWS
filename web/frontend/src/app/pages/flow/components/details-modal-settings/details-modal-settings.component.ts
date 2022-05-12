import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store';
import {ClearActiveNode} from '../../store/flow.actions';

@Component({
  selector: 'app-details-modal-settings',
  templateUrl: './details-modal-settings.component.html',
  styleUrls: ['./details-modal-settings.component.scss'],
})
export class DetailsModalSettingsComponent implements OnInit {
  @Input() expanded = true;
  @Input() hideAllButExpand = false;
  @Output() expandedChange = new EventEmitter<boolean>();

  constructor(private appStore: Store<AppState>) {}

  ngOnInit(): void {}

  public onClose() {
    this.appStore.dispatch(ClearActiveNode());
  }

  public onToggleExpanded(expanded: boolean) {
    this.expanded = expanded;
    this.expandedChange.emit(this.expanded);
  }

  public onShowModalSettings() {}
}
