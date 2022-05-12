import { ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
export declare class AutocompleteDescriptionDirective implements OnChanges {
    element: ElementRef<HTMLElement>;
    private sanitizer;
    appAutocompleteDescription: string | HTMLElement;
    private safeHtmlPipe;
    constructor(element: ElementRef<HTMLElement>, sanitizer: DomSanitizer);
    private readonly safeHtml;
    ngOnChanges(changes: SimpleChanges): void;
}
