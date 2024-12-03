import {Injectable} from '@angular/core';
import {QqlSequenceKeyWord, QqlSequenceKeyWord56, QqlToken} from '../models/qql-editor';
import {MonacoService} from './monaco.service';
import IMonarchLanguage = monaco.languages.IMonarchLanguage;
import { AppInfoService } from './app-info.service';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { getAppInfo } from 'src/app/core/store/app/app.selectors';
import { AppState } from 'src/app/core/store';

@Injectable()
export class MonacoQqlTokensService {
  private tokensProvider: IMonarchLanguage;

  private streams: string[] = [];
  private fields: string[] = [];
  private functions: string[] = [];
  private dataTypes: string[] = [];

  private lastState: string;
  private languageKey: string;

  private havingAndRecordsAvailable$: Observable<boolean>;

  constructor(private monacoService: MonacoService, private appInfoService: AppInfoService, private appStore: Store<AppState>) {

    this.havingAndRecordsAvailable$ = this.appStore.pipe(select(getAppInfo))
      .pipe(filter(info => !!info), map((info) => this.appInfoService.checkTimebaseVersion('5.5.83', info)));

    const keywords = [];
    Object.values(QqlSequenceKeyWord).forEach((keyWord) => {
      [keyWord.toLowerCase(), keyWord.toUpperCase()].forEach((kw) => {
        keywords.push(kw);
      });
    });

    const keyWords56 = [];
    Object.values(QqlSequenceKeyWord56).forEach((keyWord) => {
      [keyWord.toLowerCase(), keyWord.toUpperCase()].forEach((kw) => {
        keyWords56.push(kw);
      });
    });

    this.havingAndRecordsAvailable$.subscribe(havingAndRecordsAvailable => {
      this.tokensProvider = {
        tokenizer: {
          root: [
            [this.regExpForWords(keywords), QqlToken.keyword],
            [new RegExp(`^(${keywords.join('|')})(?=(?:)\\s|$)`), QqlToken.keyword],
            [/\*/g, QqlToken.asterisk],
            [/(?:\s)\d+(?=(?:)$|\s|,)/g, QqlToken.integer],
            [/^\d+(?=(?:)$|\s|,)/g, QqlToken.integer],
            [/'[a-z\- A-Z/0-9:.]+'d/g, QqlToken.dateLiteral],
            [/(['])(?:(?=(\\?))\2.)*?\1/g, QqlToken.string], 
            [/\-\-.*/, QqlToken.comment],
            [/\/\*.*?\*\//, QqlToken.multilineComment],    
          ]
        },
        defaultToken: QqlToken.text,
      };

      if (havingAndRecordsAvailable) {
        this.tokensProvider.tokenizer.root.push(
          [this.regExpForWords(keyWords56), QqlToken.keyword56],
          [new RegExp(`^(${keyWords56.join('|')})(?=(?:)\\s|$)`), QqlToken.keyword56],
        )
      }
    })
  }

  init(languageKey: string) {
    this.havingAndRecordsAvailable$.subscribe(havingAndRecordsAvailable => {
      this.languageKey = languageKey;
      this.updateTokens();
      const rules = [
        {token: QqlToken.timeField, foreground: '9876AA'},
        {token: QqlToken.keyword, foreground: 'CC7832'},
        {token: QqlToken.asterisk, foreground: 'FBC36B'},
        {token: QqlToken.stream, foreground: 'A9B7C6'},
        {token: QqlToken.field, foreground: '9876AA'},
        {token: QqlToken.text, foreground: 'FFFFFF'},
        {token: QqlToken.integer, foreground: '6897bb'},
        {token: QqlToken.string, foreground: '6a8759'},
        {token: QqlToken.dateLiteral, foreground: 'ffc66d'},
        {token: QqlToken.dataType, foreground: 'ffc66d'},
        {token: QqlToken.functions, foreground: 'ffc66d'},
        {token: QqlToken.comment, foreground: '6e6e6e'},
        {token: QqlToken.multilineComment, foreground: '6e6e6e'},
      ];

      if (havingAndRecordsAvailable) {
        rules.push( {token: QqlToken.keyword56, foreground: 'CC7832'} );
      }
  
      this.monacoService.defineTheme('qqlTheme', {
        base: 'vs-dark',
        inherit: false,
        colors: {},
        rules,
      });
      this.monacoService.setTokensProvider(this.languageKey, this.tokensProvider);
    })
  }

  setStreams(streams: string[]) {
    this.streams = streams;
    this.updateTokens();
  }

  setDataTypes(dataTypes: string[]) {
    this.dataTypes = dataTypes;
    this.updateTokens();
  }

  setFields(fields: string[]) {
    this.fields = fields;
    this.updateTokens();
  }

  setFunctions(functions: string[]) {
    this.functions = functions;
    this.updateTokens();
  }

  private regExpForWords(keywords: string[], extraAllowedWrap: string[] = [], caseSensitive = false): RegExp {
    const keywordList = caseSensitive ? keywords.filter(w => w !== 'timestamp') : keywords;
    const start = ['\\s', ...extraAllowedWrap];
    const end = ['\\(', '\\s', '$', ...extraAllowedWrap];
    return new RegExp(
      `(?:${start.join('|')})(${keywordList.map(keyword => keyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|')})(?=(?:)${end.join('|')})`,
      'gi',
    );
  }

  private updateTokens() {
    const state = JSON.stringify({
      streams: this.streams,
      fields: this.fields,
      functions: this.functions,
    });
    if (state === this.lastState) {
      return;
    }

    this.lastState = state;
    this.setTokenByKey(
      QqlToken.stream,
      this.streams.length ? this.regExpForWords(this.streams, ['(', ')']) : null,
    );
    // TODO: Add logic to highlight only fields that in current union part
    this.setTokenByKey(
      QqlToken.field,
      this.fields.length ? this.regExpForWords(this.fields, [',', '(', ')']) : null,
    );
    this.setTokenByKey(
      QqlToken.dataType,
      this.dataTypes.length ? this.regExpForWords(this.dataTypes, [',', '(', ')'], true) : null,
    );
    this.setTokenByKey(
      QqlToken.functions,
      this.dataTypes.length ? this.regExpForWords(this.functions, [',', '(', ')']) : null,
    );
    this.havingAndRecordsAvailable$
      .subscribe(() => this.monacoService.setTokensProvider(this.languageKey, this.tokensProvider));
  }

  private setTokenByKey(key: string, value: RegExp | null) {
    let index = this.tokensProvider.tokenizer.root.findIndex((config) => config[1] === key);
    index = index === -1 ? this.tokensProvider.tokenizer.root.length : index;

    if (this.tokensProvider.tokenizer.root[index] && !value) {
      this.tokensProvider.tokenizer.root.splice(index, 1);
    }

    if (!value) {
      return;
    }

    this.tokensProvider.tokenizer.root[index] = [value, key];
  }
}
