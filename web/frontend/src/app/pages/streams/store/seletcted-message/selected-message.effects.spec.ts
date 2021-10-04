import { TestBed }            from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable }         from 'rxjs';

import { SelectedMessageEffects } from './selected-message.effects';

describe('SelectedMessageEffects', () => {
  // tslint:disable-next-line:prefer-const
  let actions$: Observable<any>;
  let effects: SelectedMessageEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SelectedMessageEffects,
        provideMockActions(() => actions$),
      ],
    });

    effects = TestBed.get<SelectedMessageEffects>(SelectedMessageEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
