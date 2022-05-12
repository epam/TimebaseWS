import { PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
export declare class SafeHtmlPipe implements PipeTransform {
    private sanitizer;
    constructor(sanitizer: DomSanitizer);
    transform(value: any, ...args: any[]): any;
}
