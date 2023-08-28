import {
  convertDate,
  DENOMINATOR,
  FORMAT_DEFAULT,
  FORMAT_ISO,
  getEndTime,
  getStringByFormat,
  getValueDigit,
  padStart,
  REGULAR_ISO,
  REGULAR_LETTERS,
} from './utils';

export class HdDate {
  private date: Date;
  private nanoSeconds: number = 0;

  constructor();
  constructor(date?: HdDate);
  constructor(isoString?: string);
  constructor(epochMillisNanosFraction?: Array<number>);
  constructor(epochMillis?: number);
  constructor(
    year?: number,
    month?: number,
    day?: number,
    hours?: number,
    min?: number,
    sec?: number,
    mili?: number,
    micro?: number,
    nano?: number,
  );
  constructor(
    values?: string | HdDate | Array<number> | number,
    month?: number,
    day?: number,
    hours?: number,
    min?: number,
    sec?: number,
    mili?: number,
    micro?: number,
    nano?: number,
  ) {
    if (typeof values === 'number' && month == null) {
      this.date = new Date(values);
    } else if (values instanceof Array) {
      this.date = new Date(values[0]);
      this.nanoSeconds = values[1];
    } else if (typeof values === 'string') {
      const date = values.match(REGULAR_ISO);
      if (date != null) {
        this.date = new Date(date[0] + 'Z');
        const length = values[values.length - 1] === 'Z' ? values.length - 1 : values.length;
        const nanoStr = values.substring(date[0].length, length);
        const nano = +nanoStr;
        this.nanoSeconds = nanoStr.length < 4 ? nano * 1000 : nano;
      }
    } else if (values instanceof HdDate) {
      this.date = new Date(values.getEpochMillis());
      this.nanoSeconds = values.nanoSeconds;
    } else if (arguments.length > 1) {
      this.date = new Date(<number>values, month, day, hours, min, sec, mili);
      if (micro != null) {
        this.nanoSeconds = micro * DENOMINATOR;
      }
      if (nano != null) {
        this.nanoSeconds += nano;
      }
    }
    if (this.date == null) {
      this.date = new Date();
    }
  }

  public getTimezoneOffset() {
    return this.date.getTimezoneOffset();
  }

  public getDay(): number {
    return this.date.getDay();
  }

  public getDate(): number {
    return this.date.getDate();
  }

  public getEpochMillis(): number {
    return this.date.getTime();
  }

  public getFullYear(): number {
    return this.date.getFullYear();
  }

  public getHours(): number {
    return this.date.getHours();
  }

  public getMicroseconds(): number {
    return Math.floor(this.nanoSeconds / DENOMINATOR);
  }

  public getTime(): number {
    return this.date.getTime();
  }

  public getMilliseconds(): number {
    return this.date.getMilliseconds();
  }

  public getMinutes(): number {
    return this.date.getMinutes();
  }

  public getMonth(): number {
    return this.date.getMonth();
  }

  public getNanoseconds(): number {
    return this.nanoSeconds - Math.floor(this.nanoSeconds / DENOMINATOR) * DENOMINATOR;
  }

  public getNanosFraction(): number {
    return this.nanoSeconds;
  }

  public getSeconds(): number {
    return this.date.getSeconds();
  }

  public getUTCDate(): number {
    return this.date.getUTCDate();
  }

  public getUTCDay(): number {
    return this.date.getUTCDay();
  }

  public getUTCFullYear(): number {
    return this.date.getUTCFullYear();
  }

  public getUTCHours(): number {
    return this.date.getUTCHours();
  }

  public getUTCMicroseconds(): number {
    return this.getMicroseconds();
  }

  public getUTCMilliseconds(): number {
    return this.date.getUTCMilliseconds();
  }

  public getUTCMinutes(): number {
    return this.date.getUTCMinutes();
  }

  public getUTCMonth(): number {
    return this.date.getUTCMonth();
  }

  public getUTCNanoseconds(): number {
    return this.getNanoseconds();
  }

  public getUTCSeconds(): number {
    return this.date.getUTCSeconds();
  }

  public getWeek() {
    const date = new HdDate(this);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((date.getEpochMillis() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
      )
    );
  }

  public setDate(date: number): void {
    this.date.setDate(date);
  }

  public setEpochMillis(value: number): void {
    this.date = new Date(value);
  }

  public setFullYear(year: number): void {
    this.date.setFullYear(year);
  }

  public setHours(hours: number): void {
    this.date.setHours(hours);
  }

  public setMicroseconds(value: number): void {
    this.nanoSeconds = this.getNanoseconds() + value * DENOMINATOR;
  }

  public setMilliseconds(ms: number): void {
    this.date.setMilliseconds(ms);
  }

  public setMinutes(min: number): void {
    this.date.setMinutes(min);
  }

  public setMonth(month: number): void {
    this.date.setMonth(month);
  }

  public setNanoseconds(value: number): void {
    this.nanoSeconds = value + Math.floor(this.nanoSeconds / DENOMINATOR) * DENOMINATOR;
  }

  public setNanosFraction(value: number): void {
    this.nanoSeconds = value;
  }

  public setSeconds(sec: number): void {
    this.date.setSeconds(sec);
  }

  public setUTCDate(date: number): void {
    this.date.setUTCDate(date);
  }

  public setUTCFullYear(year: number): void {
    this.date.setUTCFullYear(year);
  }

  public setUTCMicroseconds(value: number): void {
    this.setMicroseconds(value);
  }

  public setUTCHours(hours: number): void {
    this.date.setUTCHours(hours);
  }

  public setUTCMilliseconds(ms: number): void {
    this.date.setUTCMilliseconds(ms);
  }

  public setUTCMinutes(min: number): void {
    this.date.setUTCMinutes(min);
  }

  public setUTCMonth(month: number): void {
    this.date.setUTCMonth(month);
  }

  public setUTCNanoseconds(value: number): void {
    this.setNanoseconds(value);
  }

  public setUTCSeconds(sec: number): void {
    this.date.setUTCSeconds(sec);
  }

  public toDateString(): string {
    return this.date.toDateString();
  }

  public toHdTimeString(): string {
    const time = getEndTime(this);
    const timeString = this.date.toTimeString();
    const index = timeString.indexOf(time);
    let HdTimeString = timeString.substring(0, index + 3);
    const nanoFr = this.getNanosFraction().toString();
    const mili = this.getMilliseconds().toString();
    return (
      HdTimeString +
      '.' +
      padStart(3 - mili.length, mili) +
      padStart(6 - nanoFr.length, nanoFr) +
      timeString.substring(index + 3, timeString.length)
    );
  }

  public toHdISOString(): string {
    const ISOString = this.date.toISOString();
    let HdISOString = ISOString;
    let index = ISOString.indexOf('Z');
    if (index > 0) {
      HdISOString = ISOString.substring(0, index);
    }
    const nanoFr = this.getNanosFraction().toString();
    return `${HdISOString}` + padStart(6 - nanoFr.length, nanoFr) + `Z`;
  }

  public toHdLocaleString(): string {
    const time = getEndTime(this);
    const localString = this.date.toLocaleString();
    const index = localString.indexOf(time);
    let HdLocaleString = localString.substring(0, index + 3);
    const nanoFr = this.getNanosFraction().toString();
    const mili = this.getMilliseconds().toString();
    return (
      HdLocaleString +
      '.' +
      padStart(3 - mili.length, mili) +
      padStart(6 - nanoFr.length, nanoFr) +
      localString.substring(index + 3, localString.length)
    );
  }

  public toHdLocaleTimeString(): string {
    const time = getEndTime(this);
    const timeString = this.date.toLocaleTimeString();
    const index = timeString.indexOf(time);
    let HdLocaleTimeString = timeString.substring(0, index + 3);
    const nanoFr = this.getNanosFraction().toString();
    const mili = this.getMilliseconds().toString();
    return (
      HdLocaleTimeString +
      '.' +
      padStart(3 - mili.length, mili) +
      padStart(6 - nanoFr.length, nanoFr) +
      timeString.substring(index + 3, timeString.length)
    );
  }

  public toHdString(): string {
    const time = getEndTime(this);
    const timeString = this.date.toString();
    const index = timeString.indexOf(time);
    let HdString = timeString.substring(0, index + 3);
    const nanoFr = this.getNanosFraction().toString();
    const mili = this.getMilliseconds().toString();
    return (
      HdString +
      '.' +
      padStart(3 - mili.length, mili) +
      padStart(6 - nanoFr.length, nanoFr) +
      timeString.substring(index + 3, timeString.length)
    );
  }

  public toISOString(): string {
    return this.date.toISOString();
  }

  public toJSON(): string {
    return this.date.toJSON();
  }

  public toLocaleDateString(): string {
    return this.date.toLocaleDateString();
  }

  public toLocaleFormat(format: string, locale?: string): string {
    if (!format) {
      return '';
    } else {
      const values = getValueDigit(this, format.match(REGULAR_LETTERS));
      return getStringByFormat(values, format, locale);
    }
  }

  public toLocaleString(): string {
    return this.date.toLocaleString();
  }

  public toLocaleTimeString(): string {
    return this.date.toLocaleTimeString();
  }

  public toString(): string {
    return this.date.toString();
  }

  public toTimeString(): string {
    return this.date.toTimeString();
  }

  public toUTCString(): string {
    return this.date.toUTCString();
  }

  public valueOf(): string {
    return this.toHdISOString();
  }

  public parseIso(isoFormatString: string): string {
    const values = convertDate(isoFormatString, FORMAT_ISO.match(REGULAR_LETTERS));
    const str = getStringByFormat(values, FORMAT_ISO);
    const index = str.indexOf(' ');
    return str.substring(0, index) + 'T' + str.substring(index + 1, str.length) + 'Z';
  }

  public parseFormat(format: string, formatString: string): string {
    const values = convertDate(formatString, format.match(REGULAR_LETTERS));
    return getStringByFormat(values, format, formatString);
  }

  public tryParse(arbitraryString: string): string {
    const values = convertDate(arbitraryString, FORMAT_DEFAULT.match(REGULAR_LETTERS));
    return getStringByFormat(values, FORMAT_DEFAULT, arbitraryString);
  }

  public lt(hdDate: HdDate): boolean {
    return (
      (this.date.getTime() === hdDate.getEpochMillis() &&
        this.nanoSeconds < hdDate.getNanosFraction()) ||
      this.date.getTime() < hdDate.getEpochMillis()
    );
  }

  public lte(hdDate: HdDate): boolean {
    return this.lt(hdDate) || this.eq(hdDate);
  }

  public gt(hdDate: HdDate): boolean {
    return (
      (this.date.getTime() === hdDate.getEpochMillis() &&
        this.nanoSeconds > hdDate.getNanosFraction()) ||
      this.date.getTime() > hdDate.getEpochMillis()
    );
  }

  public gte(hdDate: HdDate): boolean {
    return this.gt(hdDate) || this.eq(hdDate);
  }

  public eq(hdDate: HdDate): boolean {
    return (
      this.date.getTime() === hdDate.getEpochMillis() &&
      this.nanoSeconds === hdDate.getNanosFraction()
    );
  }
}
