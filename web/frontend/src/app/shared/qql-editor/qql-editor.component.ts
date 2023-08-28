import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef, EventEmitter,
  forwardRef,
  Injector,
  OnDestroy,
  OnInit, Output,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR, NgControl, Validators } from '@angular/forms';
import { EditorComponent }                                   from 'ngx-monaco-editor';
import { ReplaySubject, timer }                                    from 'rxjs';
import { distinctUntilChanged, map, shareReplay, take, takeUntil } from 'rxjs/operators';
import { QueryFunction }                                           from '../../pages/query/query-function';
import { QueryService }                                                                from '../../pages/query/services/query.service';
import { StreamModel }                                                                 from '../../pages/streams/models/stream.model';
import { MonacoEditorOptions }                                                         from '../models/qql-editor';
import { MonacoQqlConfigService }                                                      from '../services/monaco-qql-config.service';
import { QqlService }                                                                  from '../services/qql.service';
import { ResizeObserveService }                                                        from '../services/resize-observe.service';
import { SchemaService }                                                               from '../services/schema.service';
import { StreamsService }                                                              from '../services/streams.service';

@Component({
  selector: 'app-qql-editor',
  templateUrl: './qql-editor.component.html',
  styleUrls: ['./qql-editor.component.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => QqlEditorComponent)},
  ],
})
export class QqlEditorComponent implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor {
  
  @ViewChild(EditorComponent, {read: ElementRef}) private editorEl: ElementRef;
  
  @Output() validUpdate = new EventEmitter();
  
  editorOptions: MonacoEditorOptions;
  control = new UntypedFormControl();
  selfControl: UntypedFormControl;
  queryError: string;
  
  private destroy$ = new ReplaySubject(1);
  
  constructor(
    private streamsService: StreamsService,
    private schemaService: SchemaService,
    private qqlService: QqlService,
    private monacoQqlConfigService: MonacoQqlConfigService,
    private resizeObserveService: ResizeObserveService,
    private injector: Injector,
    private queryService: QueryService,
    private cdRef: ChangeDetectorRef,
  ) { }
  
  ngOnInit(): void {
    this.editorOptions = this.monacoQqlConfigService.options();
    this.control.valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe(value => this.onChange(value));
  }
  
  ngAfterViewInit() {
    this.selfControl = this.injector.get(NgControl).control as UntypedFormControl;
    this.selfControl.setValidators([Validators.required]);
    this.selfControl.setAsyncValidators([this.validateQuery()]);
    this.selfControl.updateValueAndValidity();
    this.fitEditor();
    this.resizeObserveService.observe(this.editorEl.nativeElement).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.fitEditor();
    });
  }
  
  editorInit(editor) {
    const streams$ = this.streamsService
      .getListWithUpdates()
      .pipe(map((streams: StreamModel[]) => streams.map((stream) => stream.name)));
    
    const columns = (stream) =>
      this.schemaService.getSchema(stream).pipe(
        map(({types, all}) => {
          const result = [];
          const fieldNamesCount = {};
          const shortTypeNameCount = {};
          const shortTypeName = (typeName: string, fieldName: string) =>
            `${typeName.split('.').pop()}:${fieldName}`;
          all.forEach((type) => {
            type.fields.forEach((field) => {
              fieldNamesCount[field.name] =
                fieldNamesCount[field.name] !== undefined ? fieldNamesCount[field.name] + 1 : 1;
              const alias = shortTypeName(type.name, field.name);
              shortTypeNameCount[alias] =
                shortTypeNameCount[alias] !== undefined ? shortTypeNameCount[alias] + 1 : 1;
            });
          });
          
          types.forEach((type) => {
            type.fields.forEach((field) => {
              const shortAlias = shortTypeName(type.name, field.name);
              if (fieldNamesCount[field.name] === 1) {
                result.push(field.name);
              } else if (shortTypeNameCount[shortAlias] === 1) {
                result.push(shortAlias);
              } else {
                result.push(`"${type.name}":${field.name}`);
              }
            });
          });
          
          return result;
        }),
      );
    
    const functions$ = this.qqlService.functions().pipe(
      map((functions) => {
        const unique = new Map<string, QueryFunction>();
        functions.forEach((f) => unique.set(`${f.name}-${f.stateful ? '1' : '0'}`, f));
        return [...unique.values()];
      }),
      shareReplay(1),
    );
    
    this.monacoQqlConfigService.init(editor, streams$, columns, functions$, [
      'int8',
      'int16',
      'int32',
      'int64',
      'decimal64',
      'decimal',
      'float32',
      'float64',
      'char',
      'boolean',
    ]);
  }
  
  fitEditor() {
    const wrapperRect = this.editorEl.nativeElement.getBoundingClientRect();
    this.monacoQqlConfigService.setSize({width: wrapperRect.width, height: wrapperRect.height});
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
  }
  
  writeValue(value: string): void {
    this.monacoQqlConfigService.tokenizerInit().pipe(take(1)).subscribe(() => {
      this.control.patchValue(value, {emitEvent: false});
    });
  }
  
  private onChange(value: string) {
  
  }
  
  private validateQuery() {
    return (control: UntypedFormControl) => {
      if (!control.value) {
        return null;
      }
      
      return this.queryService.compile(control.value).pipe(map(response => {
        
        const location = response?.errorLocation;
        if (location) {
          this.monacoQqlConfigService.setError({
            startLineNumber: location.startLine + 1,
            endLineNumber: location.endLine + 1,
            startColumn: location.startPosition + 1,
            endColumn: location.endPosition + 1,
          }, false);
        }
        
        this.queryError = response?.error;
        timer().subscribe(() => {
          this.cdRef.detectChanges();
          this.validUpdate.next();
        });
        return response?.error ? {queryError: true} : null;
      }));
    };
  }
}
