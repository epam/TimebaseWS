import { HttpClient, HttpHeaders }                  from '@angular/common/http';
import { Injectable }                  from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TimebaseService {

  currentQuery: string;
  ddlIsUsing = false;

  private baseUrl = 'genai';

  constructor(private httpClient: HttpClient) { }

  generateDDL(inputDDL: string) {
    return this.httpClient.post<GenerateDDLResponce>(`${this.baseUrl}/ddlgen`,
      JSON.stringify( { userInput: inputDDL } ), {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }

  generateQQL(inputDDL: string, streamKeys: string[]) {
    return this.httpClient.post<GenerateDDLResponce>(`${this.baseUrl}/qqlgen`,
      JSON.stringify( { userInput: inputDDL, streamKeys } ), {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }

  saveResult(key: string, value: string) {
    sessionStorage.setItem(key, value);
  }

  getSavedResult(key: string) {
    return JSON.parse(sessionStorage.getItem(key));
  }
}

export interface GenerateDDLResponce {
  errorMessage: string | null,
  resultDDL: string,
  resultIsNotValid: boolean
}