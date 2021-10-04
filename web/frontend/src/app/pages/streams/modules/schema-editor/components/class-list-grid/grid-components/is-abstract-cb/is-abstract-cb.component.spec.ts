import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IsUsedCbComponent } from './is-used-cb.component';

describe('IsUsedCbComponent', () => {
  let component: IsUsedCbComponent;
  let fixture: ComponentFixture<IsUsedCbComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
        declarations: [IsUsedCbComponent],
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IsUsedCbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
