import { Injectable } from '@angular/core';
import { MonacoService } from './monaco.service';
import IMonarchLanguage = monaco.languages.IMonarchLanguage;
import { QqlSequenceKeyWord, QqlToken } from '../models/qql-editor';

@Injectable({
  providedIn: 'root',
})
export class MonacoQqlTokensService {
  private tokensProvider: IMonarchLanguage;

  private streams: string[] = [];
  private fields: string[] = [];
  private dataTypes: string[] = [];

  private lastState: string;

  constructor(private monacoService: MonacoService) {
    const keywords = [];
    Object.values(QqlSequenceKeyWord).forEach(keyWord => {
      [keyWord.toLowerCase(), keyWord.toUpperCase()].forEach(kw => {
        keywords.push(kw);
      });
    });
    
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
        ],
      },
      defaultToken: QqlToken.text,
    };
  }

  init() {
    this.updateTokens();
    this.monacoService.defineTheme('qqlTheme', {
      base: 'vs-dark',
      inherit: false,
      colors: {},
      rules: [
        { token: QqlToken.keyword, foreground: 'CC7832' },
        { token: QqlToken.asterisk, foreground: 'FBC36B' },
        { token: QqlToken.stream, foreground: 'A9B7C6' },
        { token: QqlToken.field, foreground: '9876AA' },
        { token: QqlToken.text, foreground: 'FFFFFF' },
        { token: QqlToken.integer, foreground: '6897bb' },
        { token: QqlToken.string, foreground: '6a8759' },
        { token: QqlToken.dateLiteral, foreground: 'ffc66d' },
        { token: QqlToken.dataType, foreground: 'ffc66d' },
      ],
    });
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
  
  private regExpForWords(keywords: string[], extraAllowedWrap: string[] = []): RegExp {
    const start = ['\\s', ...extraAllowedWrap];
    const end = ['\\(', '\\s', '$', ...extraAllowedWrap];
    return new RegExp(`(?:${start.join('|')})(${keywords.join('|')})(?=(?:)${end.join('|')})`, 'gi');
  }

  private updateTokens() {
    const state = JSON.stringify({ streams: this.streams, fields: this.fields });
    if (state === this.lastState) {
      return;
    }

    this.lastState = state;
    this.setTokenByKey(QqlToken.stream, this.streams.length ? this.regExpForWords(this.streams) : null);
    // TODO: Add logic to highlight only fields that in current union part
    this.setTokenByKey(QqlToken.field, this.fields.length ? this.regExpForWords(this.fields, [',']) : null);
    this.setTokenByKey(QqlToken.dataType, this.dataTypes.length ? this.regExpForWords(this.dataTypes, [',']) : null);
    this.monacoService.setTokensProvider('qql', this.tokensProvider);
  }

  private setTokenByKey(key: string, value: RegExp | null) {
    let index = this.tokensProvider.tokenizer.root.findIndex(config => config[1] === key);
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
