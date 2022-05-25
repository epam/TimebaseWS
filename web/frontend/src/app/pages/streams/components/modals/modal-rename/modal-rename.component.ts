import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {AppState} from '../../../../../core/store';
import {MenuItem} from '../../../../../shared/models/menu-item';
import {StreamModel} from '../../../models/stream.model';
import * as StreamsActions from '../../../store/streams-list/streams.actions';

@Component({
  selector: 'app-modal-rename',
  templateUrl: './modal-rename.component.html',
  styleUrls: ['./modal-rename.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalRenameComponent implements OnInit {
  public renameForm: FormGroup;
  public stream: StreamModel;
  public data: {
    stream: MenuItem;
    space?: MenuItem;
    symbol?: string;
    name?: string;
  };

  constructor(
    public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.data.name = this.data.symbol
      ? this.data.stream.name +
        (this.data.space ? ` / ${this.data.space.id} / ` : ' / ') +
        this.data.symbol
      : this.data.space
      ? `${this.data.stream.name} / ${this.data.space.id}`
      : this.data.stream.name;

    this.renameForm = this.fb.group({
      newName: [
        this.data.symbol
          ? this.data.symbol
          : this.data.space
          ? this.data.space.id
          : this.data.stream.id,
        Validators.required,
      ],
    });
  }

  public onRenameSubmit() {
    if (this.renameForm.invalid || !this.renameForm.get('newName').value) {
      return;
    }
    if (!this.data.symbol) {
      this.appStore.dispatch(
        new StreamsActions.AskToRenameStream({
          streamId: this.data.stream.id,
          newName: this.renameForm.get('newName').value,
          ...(this.data.space ? {spaceName: this.data.space.id} : {}),
        }),
      );
    } else {
      this.appStore.dispatch(
        new StreamsActions.AskToRenameSymbol({
          streamId: this.data.stream.id,
          ...(this.data.space ? {spaceName: this.data.space.id} : {}),
          newSymbolName: this.renameForm.get('newName').value,
          oldSymbolName: this.data.symbol,
        }),
      );
    }
    this.bsModalRef.hide();
  }
}
