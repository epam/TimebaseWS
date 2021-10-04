import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalRenameComponent } from './modal-rename.component';

describe('ModalRenameComponent', () => {
  let component: ModalRenameComponent;
  let fixture: ComponentFixture<ModalRenameComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
        declarations: [ModalRenameComponent],
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalRenameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
