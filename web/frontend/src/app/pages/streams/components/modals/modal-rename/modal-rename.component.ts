import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {AppState} from '../../../../../core/store';
import {MenuItem} from '../../../../../shared/models/menu-item';
import {StreamModel} from '../../../models/stream.model';
import * as StreamsActions from '../../../store/streams-list/streams.actions';
import { uniqueName } from 'src/app/shared/utils/validators';
import { StreamsService } from 'src/app/shared/services/streams.service';
import { forbiddenChars, forbiddenCharsForMessage } from 'src/app/shared/utils/forbiddenCharacters';
import { TopicService } from '../../../modules/schema-editor/services/topic.service';

@Component({
  selector: 'app-modal-rename',
  templateUrl: './modal-rename.component.html',
  styleUrls: ['./modal-rename.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalRenameComponent implements OnInit, OnDestroy {
  public renameForm: UntypedFormGroup;
  public stream: StreamModel;
  public data: {
    stream: MenuItem;
    space?: MenuItem;
    symbol?: string;
    name?: string;
    isTopic?: boolean
  };
  public forbiddenCharsForMessage = forbiddenCharsForMessage;
  public lastValidationError: { [key: string]: boolean };
  private destroy$ = new Subject();

  constructor(
    public bsModalRef: BsModalRef,
    private appStore: Store<AppState>,
    private fb: UntypedFormBuilder,
    private streamsService: StreamsService,
    private cdRef: ChangeDetectorRef,
    private topicService: TopicService
  ) {}

  ngOnInit(): void {
    this.data.name = this.data.symbol
      ? this.data.stream.name +
        (this.data.space ? ` / ${this.data.space.id} / ` : ' / ') +
        this.data.symbol
      : this.data.space
      ? `${this.data.stream.name} / ${this.data.space.id}`
      : this.data.stream.name;

    const existing$ = this.streamsService
      .getList(false)
      .pipe(map((streams) => streams
        .filter(stream => stream.key !== this.data.stream.id)
        .map((stream) => stream.key)));

    if (this.data.isTopic) {
      this.renameForm = this.fb.group({
        newName: [ this.data.stream.name, Validators.required ],
      });
    } else {
      this.renameForm = this.fb.group({
        newName: [
          this.data.symbol
            ? this.data.symbol
            : this.data.space
            ? this.data.space.id
            : this.data.stream.id,
          [Validators.required, Validators.maxLength(255), this.noForbiddenSymbols()],
          [uniqueName(existing$), this.containsAlphaNumericSymbol()],
        ],
      });
    }

    this.renameForm.get('newName').statusChanges
      .pipe(filter(status => status !== 'PENDING', takeUntil(this.destroy$)))
      .subscribe(() => {
        this.lastValidationError = this.renameForm.get('newName').errors;
        this.cdRef.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onRenameSubmit() {
    if (this.renameForm.invalid || !this.renameForm.get('newName').value.trim()) {
      return;
    }
    if (!this.data.symbol) {
      if (this.data.isTopic) {
        this.topicService.renameTopic(this.data.stream.name, this.renameForm.get('newName').value).subscribe();
      } else {
        this.appStore.dispatch(
          new StreamsActions.AskToRenameStream({
            streamId: this.data.stream.id,
            newName: this.renameForm.get('newName').value,
            ...(this.data.space ? {spaceName: this.data.space.id} : {}),
          }),
        );
      }
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

  get newName() {
    return this.renameForm.get('newName');
  }

  private noForbiddenSymbols() {
    return (control: FormControl) => !forbiddenChars.some(char => control.value?.includes(char)) ? 
      null : { forbiddenSymbols: true };
  }

  private containsAlphaNumericSymbol() {
    return (control: UntypedFormControl) => {
      return this.streamsService.validateStreamName(control.value)
        .pipe(map(isValid => isValid ? null : { noAlphaNumeric: true } ));
    }
  }
}
