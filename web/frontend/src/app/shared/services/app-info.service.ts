import { Injectable } from "@angular/core";
import { AppInfoModel } from "../models/app.info.model";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class AppInfoService {
  appInfo: AppInfoModel;

  constructor(private http: HttpClient) {}

  checkTimebaseVersion(version: string, appInfo: AppInfoModel) {
    if (appInfo?.timebases?.[0]?.clientVersion) {
      const timebaseVersion = appInfo.timebases[0].clientVersion.split('.').map(num => +num);
      const targetVersion = version.split('.').map(num => +num);
  
      return timebaseVersion[0] > targetVersion[0] || 
        (timebaseVersion[0] === targetVersion[0] && timebaseVersion[1] > targetVersion[1]) ||
        (timebaseVersion[1] === targetVersion[1] && timebaseVersion[2] >= targetVersion[2]);
      }
    }

    getAppInfo(): Observable<AppInfoModel> {
      return this.http.get<AppInfoModel>('/v');
    }
}
