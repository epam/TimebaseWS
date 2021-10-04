import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MonitorLogGridComponent } from './monitor-log-grid.component';

describe('MonitorLogGridComponent', () => {
  let component: MonitorLogGridComponent;
  let fixture: ComponentFixture<MonitorLogGridComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
        declarations: [MonitorLogGridComponent],
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonitorLogGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
