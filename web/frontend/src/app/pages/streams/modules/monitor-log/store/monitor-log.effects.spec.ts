import { TestBed }            from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable }         from 'rxjs';

import { MonitorLogEffects } from './monitor-log.effects';

describe('MonitorLogEffects', () => {
  let actions$: Observable<any>;
  let effects: MonitorLogEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MonitorLogEffects,
        provideMockActions(() => actions$),
      ],
    });

    effects = TestBed.get<MonitorLogEffects>(MonitorLogEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
