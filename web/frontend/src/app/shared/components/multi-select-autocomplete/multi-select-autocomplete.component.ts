import { Component, forwardRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { debounceTime, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { Observable, of, ReplaySubject, timer } from 'rxjs';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'app-multi-select-autocomplete',
  templateUrl: './multi-select-autocomplete.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => MultiSelectAutocompleteComponent),
    },
  ],
})
export class MultiSelectAutocompleteComponent implements OnInit, ControlValueAccessor, OnDestroy {

  @ViewChild(NgSelectComponent) private ngSelectComponent: NgSelectComponent;

  autocomplete$: Observable<string[]>;
  searchTerm$ = new ReplaySubject<string>(1);
  autocompleteLoading = false;
  control = new FormControl();
  @Input() autocompleteProvider: (term?: string) => Observable<string[]>;
  @Input() notFoundText: string;

  private insertDelimiter = ';';
  private destroy$ = new ReplaySubject(1);

  ngOnInit(): void {
    this.autocomplete$ = this.searchTerm$.pipe(
      tap(() => this.autocompleteLoading = true),
      debounceTime(250),
      switchMap(searchTerm => {
        if (searchTerm) {
          return this.autocomplete(searchTerm).pipe(map(items => ({ searchTerm, items })));
        }
        return of({ searchTerm, items: [] });
      }),
      tap(({ searchTerm, items }) => {
        this.autocompleteLoading = false;
        if (items.length === 1 && searchTerm.toLowerCase() === items[0].toLowerCase()) {
          this.addSelectedItems(items);
        }
      }),
      map(({ items }) => items),
    );

    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => this.onChange(value));
  }

  onItemChange() {
    this.searchTerm$.next('');
    this.ngSelectComponent.searchTerm = '';
  }

  onItemsSearch({ term }: { term: string }, notParse = false) {
    this.searchTerm$.next(term);
    const inserted = term.split(this.insertDelimiter).map(part => part.trim());
    if (inserted.length < 2 || notParse) {
      this.searchTerm$.next(term);
    } else {
      this.autocomplete().pipe(
        map(items => {
          const map = new Map();
          items.forEach(s => map.set(s.toLowerCase(), s));
          const found = [];
          const notFound = [];
          inserted.filter(Boolean).forEach(s => {
            const exists = !this.autocompleteProvider ? s : map.get(s.toLowerCase());
            if (exists) {
              found.push(exists);
            } else {
              notFound.push(s);
            }
          });
          return { found, notFound };
        }),
      ).subscribe(
        ({ found, notFound }) => this.addSelectedItems(found, notFound.join(`${this.insertDelimiter} `)),
      );
    }
  }

  onEnter() {
    if (!this.autocompleteProvider) {
      this.searchTerm$.pipe(take(1)).subscribe(term => {
        if (term.trim().length) {
          this.addSelectedItems([term]);
        }
      });
    }
  }

  private addSelectedItems(items: string[], search = '') {
    const unique = new Set(this.control.value);
    items.forEach(s => unique.add(s));
    this.control.patchValue([...unique]);
    this.onItemsSearch({ term: search }, true);
    this.searchTerm$.next('');
    this.ngSelectComponent.searchInput.nativeElement.value = search;
    this.ngSelectComponent.searchTerm = search;
    timer().subscribe(() => this.searchTerm$.next(search));
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  writeValue(value: string[]): void {
    this.control.patchValue(value || []);
  }

  onChange(value: string[]) {
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private autocomplete(search: string = null): Observable<string[]> {
    if (this.autocompleteProvider) {
      return this.autocompleteProvider(search);
    }

    return of([]);
  }
}
