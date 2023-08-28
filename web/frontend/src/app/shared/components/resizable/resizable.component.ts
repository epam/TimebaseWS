
import { AfterContentInit, Component, ElementRef, OnInit, AfterViewInit, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { fromEvent, Subject, BehaviorSubject } from 'rxjs';
import { filter, startWith, map, takeUntil } from 'rxjs/operators';
import { ResizableService } from '../../services/resizable.servise';
export enum TypeDrag {
  Move,
  Top,
  Bottom,
  Left,
  Right,
  TopRight,
  BottomRight,
  TopLeft,
  BottomLeft
};

@Component({
  selector: 'app-resizable',
  templateUrl: './resizable.component.html',
  styleUrls: ['./resizable.component.scss']
})

export class ResizableComponent implements OnInit, AfterContentInit, AfterViewInit, OnChanges {
  rect: any;
  incr: number[] = [0, 0, 0, 0];
  nativeElement: any;
  typeDrag: TypeDrag;
  origin: any;
  onDrag: boolean = false;
  moveSubscription: any;
  modalContent: any;
  windowSize = {
    height: window.innerHeight,
    width: window.innerWidth
  }
  defaultSizeButtonIsVisible = new BehaviorSubject(false);

  classNames = [
    'cell-top',
    'cell-border-top',
    'cell-border-bottom',
    'cell-border-left',
    'cell-border-right',
    'cell-top-right',
    'cell-bottom-right',
    'cell-top-left',
    'cell-bottom-left'
  ];

  style: any = null;

  private destroy$ = new Subject();
  @Input() minWidth: number;
  @Input() minHeight: number;

  @Input() storageKey: string;
  @Input() contentClassName: string;
  @Input() modalClassName: string = '';

  @Input() contentHeightDifference: number;
  @Input() modalBodyHeightDifference: number = 0;
  @Input() rootModal: boolean = true;

  @ViewChild('resizableBorders') resizableBorders: ElementRef;

  constructor(private hostElement: ElementRef, private resizableService: ResizableService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (Object.keys(changes).length === 1 && changes.minHeight) {
      this.modalContent.style.height = changes.minHeight.currentValue > window.innerHeight - 48 ?
        window.innerHeight - 50 + 'px' : changes.minHeight.currentValue + 'px';

      this.style.height = this.modalContent.style.height;
      this.modalContent.children[0].style.height = this.style.height;
      const marginTop = (window.innerHeight - parseInt(this.style.height)) / 2;
      this.modalContent.style['margin-top'] = marginTop + 'px';

      (document.querySelector('app-modal') as HTMLElement).style.height = this.style.height;
      this.resizeContentHeight();
    }
  }

  ngOnInit(): void {
    this.modalContent = this.rootModal ? 
      this.hostElement.nativeElement.closest('.modal-content').parentElement : this.hostElement.nativeElement.closest(`.${this.storageKey}`);

    this.resizableService.parentResizeDisabled
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDisabled => {
        if (this.rootModal) {
          this.resizableBorders.nativeElement.style.visibility = isDisabled ? 'hidden' : 'visible';
        }
      })
    
    this.resizableService.windowResized
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (window.innerWidth > 850) {
          const widthRatio = +(window.innerWidth / this.windowSize.width).toFixed(6);
          const width = Math.round(widthRatio * parseInt(this.style.width));

          this.style.width = (width < this.minWidth ? this.minWidth : (width > window.innerWidth - 48) ? window.innerWidth - 50 : width - 1) + 'px';
          this.modalContent.style.width = this.style.width;
          const margin = (window.innerWidth - parseInt(this.style.width)) / 2;

          if (this.rootModal) {
            this.modalContent.children[0].style.width = this.style.width;
            this.modalContent.style['margin-left'] = margin + 'px';
          } else {
            this.modalContent.style['left'] = margin + 'px';
          }

          this.windowSize.width = window.innerWidth;
        }
        if (window.innerWidth > 715) {
          const heightRatio = +(window.innerHeight / this.windowSize.height).toFixed(6);
          const height = Math.round(heightRatio * parseInt(this.style.height));

          this.style.height = (height < this.minHeight ? this.minHeight : (height > window.innerHeight - 48) ? window.innerHeight - 50 : height - 1) + 'px';
          this.modalContent.style.height = this.style.height;
          const marginTop = (window.innerHeight - parseInt(this.style.height)) / 2;

          if (this.rootModal) {
            this.modalContent.children[0].style.height = this.style.height;
            (document.querySelector('app-modal') as HTMLElement).style.height = this.style.height;
            this.modalContent.style['margin-top'] = marginTop + 'px';
          } else {
            this.modalContent.style['top'] = marginTop + 'px';
          }

          this.windowSize.height = window.innerHeight;
          this.resizeContentHeight();
        }
        localStorage.setItem(this.storageKey, JSON.stringify( { width: this.style.width, height: parseInt(this.style.height) < 650 ? '650px' : this.style.height } ));
      }
    );

    fromEvent(this.hostElement.nativeElement, 'mousedown').pipe(map((event: any) => ({
      target: event.target,
      screenX: event.screenX,
      screenY: event.screenY
      })
    ))
    .pipe(filter((event: MouseEvent) => {
      const classs = (event.target as any).className;
      if (classs && typeof classs === 'string') {
        const className = classs.split(' ');
        return className.indexOf('cell-top') >= 0
          ? true : this.classNames.indexOf(classs) >= 0;
        }
        return false;
      }),
      takeUntil(this.destroy$)
    )
    .subscribe((event: MouseEvent) => {
      this.rect = document.querySelector(this.rootModal ? '.modal-content' : `.${this.storageKey}`).getBoundingClientRect();
      this.origin =  { x: event.screenX, y: event.screenY };

      this.onDrag = true;
      const className = (event.target as any).className.split(' ');
      this.typeDrag = className.indexOf('cell-top') >= 0 ? 
        TypeDrag.Move : (this.classNames.indexOf(className[0]) as TypeDrag);

      this.incr =
        this.typeDrag == TypeDrag.Move
          ? [1, 0, 1, 0]
          : this.typeDrag == TypeDrag.Top
          ? [1, -1, 0, 0]
          : this.typeDrag == TypeDrag.Bottom
          ? [0, 1, 0, 0]
          : this.typeDrag == TypeDrag.Right
          ? [0, 0, 0, 1]
          : this.typeDrag == TypeDrag.Left
          ? [0, 0, 1, -1]
          : this.typeDrag == TypeDrag.TopRight
          ? [1, -1, 0, 1]
          : this.typeDrag == TypeDrag.TopLeft
          ? [1, -1, 1, -1]
          : this.typeDrag == TypeDrag.BottomRight
          ? [0, 1, 0, 1]
          : [0, 1, 1, -1];

      this.onDrag = true;

      fromEvent(document, 'mouseup')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.moveSubscription) {
            this.moveSubscription.unsubscribe();
            this.moveSubscription = undefined;
            this.onDrag = false;
          }}
        );

      if (!this.moveSubscription) {

        this.moveSubscription = fromEvent(document, 'mousemove').pipe(map((event: any)=>({
            target:event.target,
            screenX:event.screenX,
            screenY:event.screenY
          }))
        )
        .pipe(
          startWith({ screenY: this.origin.y, screenX: this.origin.x }),
          takeUntil(this.destroy$)
        )
        .subscribe((moveEvent: MouseEvent) => {
          if (this.rootModal && this.resizableService.childModalOpen) {
            return;
          }

          window.getSelection().removeAllRanges();
          const targetElementClass = (event.target as HTMLElement).className;
          const incrTop = moveEvent.screenY - this.origin.y;
          const incrLeft = moveEvent.screenX - this.origin.x;

          this.modalContent.style['max-width'] = '100%';

          this.style = this.style ?? {};

          if (targetElementClass === 'cell-bottom-right' || targetElementClass === 'cell-border-right') {

            const width = this.rect.width + 2 * this.incr[3] * incrLeft; 
            this.style.width = (width < this.minWidth ? this.minWidth : (width > window.innerWidth - 48) ? window.innerWidth - 50 : width - 1) + 'px';
            const margin = (window.innerWidth - parseInt(this.style.width)) / 2;

            this.modalContent.style.width = this.style.width;

            if (this.rootModal) {
              (document.querySelector('.modal') as HTMLElement).style.justifyContent = 'start';
              this.modalContent.children[0].style.width = this.style.width;
              this.modalContent.style['margin-left'] = margin + 'px';
            } else {
              this.modalContent.style['left'] = margin + 'px';
            }
          }

          if (targetElementClass === 'cell-bottom-right' || targetElementClass === 'cell-border-bottom') {
            const height = this.rect.height + 2 * this.incr[1] * incrTop;

            this.style.height = (height < this.minHeight ? this.minHeight : (height > window.innerHeight - 48) ? window.innerHeight - 50 : height - 1) + 'px';
            this.modalContent.style.height = this.style.height;
            const marginTop = (window.innerHeight - parseInt(this.style.height)) / 2;

            if (this.rootModal) {
              this.modalContent.children[0].style.height = this.style.height;
              (document.querySelector('app-modal') as HTMLElement).style.height = this.style.height;
              this.modalContent.style['margin-top'] = marginTop + 'px';
            } else {
              this.modalContent.style['top'] = marginTop + 'px';
            }
            this.resizeContentHeight();
          }
          this.toggleDefaultSizeButtonVisible(this.style);
          localStorage.setItem(this.storageKey, JSON.stringify( { width: this.style.width, height: parseInt(this.style.height) < 650 ? '650px' : this.style.height } ));
        });
      }
    });
  }
  ngAfterViewInit() {
    setTimeout(() => this.toggleDefaultSizeButtonVisible(), 0);
  }
  toggleDefaultSizeButtonVisible(sizes = null) {
    if (!sizes) {
      const modalStyle = this.hostElement.nativeElement.getBoundingClientRect();
      this.defaultSizeButtonIsVisible.next(modalStyle.width > 800 || modalStyle.height > 665);
    } else {
      this.defaultSizeButtonIsVisible.next(parseInt(sizes.width) > 800 || parseInt(sizes.height) > 665);
    }
  }
  resizeContentHeight() {
    const contentHeight = parseInt(this.style.height);
    const content = this.hostElement.nativeElement.querySelector(`.${this.contentClassName}`);
    if (content) {
      content.style.height = contentHeight - this.contentHeightDifference + 'px';
      const modalBody = this.rootModal ? 
        this.hostElement.nativeElement.querySelector('.modal-body') : this.hostElement.nativeElement.querySelector(`.${this.modalClassName}`);

      modalBody.style.height = contentHeight - this.modalBodyHeightDifference + 'px';
    }
  }

  setDefaultSize() {
    const modalContent = this.hostElement.nativeElement.closest('.modal-content').parentElement;
    const width = this.minWidth + 'px';
    modalContent.style.width = width;
    modalContent.children[0].style.width = width;
    this.hostElement.nativeElement.querySelector('.resizable').style.width = width;

    const marginLeft = (window.innerWidth - parseInt(width)) / 2;
    modalContent.style['margin-left'] = marginLeft + 'px';

    const height = this.minHeight + 'px';
    modalContent.style.height = height;
    modalContent.children[0].style.height = height;
    this.hostElement.nativeElement.querySelector('.resizable').style.height = height;
    this.hostElement.nativeElement.querySelector('app-modal').style.height = height;

    const marginTop = (window.innerHeight - parseInt(height)) / 2;
    modalContent.style['margin-top'] = marginTop + 'px';

    this.style.height = height;
    this.resizeContentHeight();

    localStorage.removeItem(this.storageKey);
    this.defaultSizeButtonIsVisible.next(false);
  }

  setModalContentWidth() {
    this.modalContent.style.width = this.style.width;
    this.modalContent.children[0].style.width = this.style.width;

    const margin = (window.innerWidth - parseInt(this.style.width)) / 2;
    this.modalContent.style['margin-left'] = margin + 'px';
  }

  setModalContentHeight() {
    this.modalContent.style.height = this.style.height;
    this.modalContent.children[0].style.height = this.style.height;

    const marginTop = (window.innerHeight - parseInt(this.style.height)) / 2;
    this.modalContent.style['margin-top'] = marginTop + 'px';
  }

  ngAfterContentInit() {
    if (this.rootModal) {
      this.style = this.style ?? {};
      const modalInitialSize = JSON.parse(localStorage.getItem(this.storageKey));
 
      const initialHeight = parseInt(modalInitialSize?.height) || this.minHeight;
 
      this.modalContent.style.height = initialHeight > window.innerHeight - 48 ?
        window.innerHeight - 50 + 'px' : initialHeight + 'px';
 
      this.style.height = this.modalContent.style.height;
      this.resizeContentHeight();
   
      const marginTop = (window.innerHeight - this.minHeight) / 2;
      this.modalContent.style['margin-top'] = marginTop + 'px';
 
      const initialWidth = parseInt(modalInitialSize?.width) || this.minWidth;
 
      const width = initialWidth > window.innerWidth - 48 ? window.innerWidth - 50 + 'px' : initialWidth + 'px';
 
      (document.querySelector('.modal') as HTMLElement).style.justifyContent = 'start';
      const margin = (window.innerWidth - parseInt(width)) / 2;
      this.modalContent.style['margin-left'] = margin + 'px';
 
      this.modalContent.style.width = width;
      this.modalContent.children[0].style.width = width;
 
      this.style.width = this.modalContent.style.width;
 
      this.setModalContentHeight();
     
      localStorage.setItem(this.storageKey, JSON.stringify(
        { width: this.modalContent.style.width, height: this.modalContent.style.height }
      ));
    } else {
      this.style = this.style ?? {};
      this.style.height = this.minHeight;
      this.style.width = this.minWidth;
    }
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}