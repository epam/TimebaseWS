import { Observable, ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import IMonarchLanguage = monaco.languages.IMonarchLanguage;
import LanguageConfiguration = monaco.languages.LanguageConfiguration;
import IStandaloneThemeData = monaco.editor.IStandaloneThemeData;
import ITextModel = monaco.editor.ITextModel;
import IPosition = monaco.IPosition;
import CompletionList = monaco.languages.CompletionList;

type CompletionFunc = (model: ITextModel, position: IPosition) => Observable<CompletionList>;

@Injectable({
  providedIn: 'root',
})
export class MonacoService {
  static monacoLoad$ = new ReplaySubject<any>(1);

  private completionProviders = new Map<string, CompletionFunc>();
  private registeredProviders = new Set();

  static onMonacoLoadHandler() {
    MonacoService.monacoLoad$.next(window.monaco);
  }

  private getMonaco(): Observable<any> {
    return MonacoService.monacoLoad$.pipe(take(1));
  }

  registerLanguage(languageId: string, config: LanguageConfiguration) {
    this.getMonaco().subscribe(monaco => {
      monaco.languages.register({ id: languageId });
      monaco.languages.setLanguageConfiguration(languageId, config);
    });
  }

  defineTheme(themeId: string, config: IStandaloneThemeData) {
    this.getMonaco().subscribe(monaco => monaco.editor.defineTheme(themeId, config));
  }

  setAutoCompleteProvider(language: string, provider: CompletionFunc) {
    this.completionProviders.set(language, provider);
    if (!this.registeredProviders.has(language)) {
      this.registeredProviders.add(language);
      this.getMonaco().subscribe(monaco => {
        monaco.languages.registerCompletionItemProvider(language, {
          provideCompletionItems: (model: ITextModel, position: IPosition) => this.getCompletion(language, model, position).toPromise(),
        });
      });
    }
  }

  setTokensProvider(language: string, provider: IMonarchLanguage) {
    this.getMonaco().subscribe(monaco => monaco.languages.setMonarchTokensProvider(language, provider));
  }

  private getCompletion(language, model, position): Observable<CompletionList> {
    const func = this.completionProviders.get(language);
    return func(model, position);
  }
}
