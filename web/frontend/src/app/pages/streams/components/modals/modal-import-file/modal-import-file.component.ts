import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { streamsListStateSelector } from '../../../store/streams-list/streams.selectors';
import * as fromStreams from '../../../store/streams-list/streams.reducer';
import { ImportService } from '../../../../../shared/services/import.service';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-modal-import-file',
  templateUrl: './modal-import-file.component.html',
  styleUrls: ['./modal-import-file.component.scss'],
})
export class ModalImportFileComponent implements OnInit {

  form: FormGroup;
  autocomplete$: Observable<string[]>;

  constructor(
    private fb: FormBuilder,
    private streamsStore: Store<fromStreams.FeatureState>,
    private importService: ImportService,
    private bsModalRef: BsModalRef,
  ) {
  }

  ngOnInit(): void {

    const validateRange = (fg: FormGroup) => {
      if (!fg.get('setRange').value) {
        return null;
      }

      const range = fg.get('range').value;

      return range.start && range.end ? null : { needRange: true };
    };

    this.form = this.fb.group({
      file: [null, Validators.required],
      stream: ['', Validators.required],
      description: '',
      symbols: [[]],
      setRange: false,
      range: { start: null, end: null },
    }, { validators: [validateRange] });

    const stream = this.form.get('stream');
    this.autocomplete$ = combineLatest([
      this.streamsStore.pipe(select(streamsListStateSelector)),
      stream.valueChanges.pipe(startWith(stream.value)),
    ]).pipe(
      map(([state, search]) => {
        if (!state.streams) {
          return [];
        }

        return state.streams?.map(stream => stream.name).filter(
          stream => stream.toLowerCase().includes(search?.toLowerCase())
        );
      }),
    );
  }

  onStreamChange(search: string) {
    this.form.get('stream').patchValue(search);
  }

  import() {
    const formData = this.form.getRawValue();
    this.importService.import({
      file: formData.file[0],
      stream: formData.stream,
      description: formData.description,
      symbols: JSON.stringify(formData.symbols),
      setRange: formData.setRange,
      rangeStart: formData.setRange ? formData.range.start.toISOString() : null,
      rangeEnd: formData.setRange ? formData.range.end.toISOString() : null,
    }).subscribe(() => this.bsModalRef.hide());
  }
}
