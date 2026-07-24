import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Observable, Subject } from 'rxjs';
import {map, take, takeUntil} from 'rxjs/operators';
import {MultiSelectItem} from '../../../../../shared/components/multi-select/multi-select-item';
import {MenuItem} from '../../../../../shared/models/menu-item';
import {SymbolsService} from '../../../../../shared/services/symbols.service';
import { ConfirmModalComponent } from 'src/app/shared/components/modals/modal-on-close-alert/confirm-modal.component';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/core/store';
import * as StreamsActions from '../../../store/streams-list/streams.actions';

@Component({
  selector: 'app-modal-stream-symbols',
  templateUrl: './modal-stream-symbols.component.html',
  styleUrls: ['./modal-stream-symbols.component.scss']
})
export class ModalStreamSymbolsComponent implements OnInit, OnDestroy {
  symbols$: Observable<MultiSelectItem[]>;
  item: MenuItem;
  form: UntypedFormGroup;
  selectedSymbols: string[];
  modalText: string;
  showTextArea = false;
  showDeleteConfirmModal = false;

  private destroy$ = new Subject<void>();

  @ViewChild('deleteItemMessage') private deleteItemMessage: TemplateRef<HTMLElement>;

  constructor(
    private symbolsService: SymbolsService,
    private fb: UntypedFormBuilder,
    private bsModalRef: BsModalRef,
    private modalService: BsModalService,
    private appStore: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      symbol: [null, Validators.required],
    });

    this.symbols$ = this.symbolsService
      .getSymbols(this.item.meta.stream.id, null, null, this.item.tbId)
      .pipe(map((symbols) => symbols.map((s) => ({id: s, name: s}))));

    this.form.get('symbol').valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(symbolList => {
        this.selectedSymbols = symbolList.map(item => item.name);
        this.modalText = '';
        let symbolsInText = 0;
        for (let symbol of this.selectedSymbols) {
          if (this.modalText.length > 50) {
            break;
          }
          this.modalText += `${symbol}, `;
          symbolsInText += 1;
        }
        this.modalText = this.modalText.slice(0, this.modalText.length - 2);
        if (symbolsInText !== this.selectedSymbols.length) {
          this.modalText = this.selectedSymbols.join(', ');
          this.showTextArea = true;
        }
      })
  }

  confirmDelete() {
    if (this.showTextArea) {
      this.showDeleteConfirmModal = true;
    } else {
      this.bsModalRef.hide();
      this.openModal(ConfirmModalComponent, {
        initialState: {
          messageTpl: this.deleteItemMessage,
          withoutHeader: true,
          btns: {yes: 'buttons.delete', no: 'buttons.cancel'},
        },
        class: 'modal-small',
      })
      .content.resolve.pipe(take(1))
      .subscribe((confirm) => {
        if (!confirm || !this.item?.id) {
          return;
        }
        this.delete();
      })
    }
  }

  delete() {
    this.appStore.dispatch(
      new StreamsActions.AskToDeleteSymbols({
        streamKey: this.item.meta.stream.id,
        tbId: this.item.tbId,
        symbols: this.selectedSymbols
      }),
    );
    this.bsModalRef.hide();
  }

  cancel() {
    this.bsModalRef.hide();
  }

  private openModal(content: string | TemplateRef<any> | any, options: ModalOptions): BsModalRef {
    if (!this.item?.meta.stream?.id) return;
    return this.modalService.show(content, options);
  }

  copySymbolList() {
    navigator.clipboard.writeText(this.selectedSymbols.join(', '));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
