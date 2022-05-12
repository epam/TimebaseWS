import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {ModalDescribeComponent} from './modal-describe.component';

describe('ModalDescribeComponent', () => {
  let component: ModalDescribeComponent;
  let fixture: ComponentFixture<ModalDescribeComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ModalDescribeComponent],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalDescribeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
