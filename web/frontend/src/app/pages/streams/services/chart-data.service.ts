import { HttpClient }                   from '@angular/common/http';
import { Injectable }                   from '@angular/core';
import { select, Store }                from '@ngrx/store';
import { Observable, of }               from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { AppState }                     from '../../../core/store';
import { getAppSettings }               from '../../../core/store/app/app.selectors';
import { AppSettingsModel }             from '../../../shared/models/app.settings.model';
import { ChartModel, ChartTypes }       from '../models/chart.model';
import { TabModel }                     from '../models/tab.model';
import * as fromStreams                 from '../store/streams-list/streams.reducer';
import { getActiveOrFirstTab }          from '../store/streams-tabs/streams-tabs.selectors';


@Injectable()
export class ChartDataService {

  constructor(
    private httpClient: HttpClient,
    private streamsStore: Store<fromStreams.FeatureState>,
    private appStore: Store<AppState>,
  ) {
  }

  public getNewData(
    startDate: string,
    endDate: string,
    symbols: string[],
    isTail = false,
    pointsRate = 1): Observable<{ response: ChartModel[] | boolean, type: string | null }> {
    return this.appStore
      .pipe(
        select(getActiveOrFirstTab),
        take(1),
        switchMap(activeTab => this.appStore
          .select(getAppSettings)
          .pipe(
            filter(settings => !!settings),
            take(1),
            map(settings => [activeTab, settings]),
          )),
        switchMap(([activeTab, settings]: [TabModel, AppSettingsModel]) => {
          const type: ChartTypes = activeTab.filter.chart_type || (activeTab.chartType && activeTab.chartType[0]);
          const maxPoints = this.getMaxPointsCount(settings, isTail, pointsRate, activeTab.filter['levels']);
          let response$: Observable<ChartModel[] | boolean>;
          if (maxPoints >= 10) {

            const params = {
              startTime: startDate,
              endTime: endDate,
              symbols: symbols,
              levels: activeTab.filter['levels'] + '',
              maxPoints: maxPoints.toString(),
              ...(activeTab.space ? {space: activeTab.space} : {}),
              type,
            };

            response$ = this.httpClient
              .get<ChartModel[]>(`charting/${encodeURIComponent(activeTab.stream)}`, {
                params,
                headers: {
                  customError: 'true',
                },
              });
          } else {
            response$ = of(true);
          }

          return response$.pipe(map(response => ({response, type})));
        }),
      );
  }

  private getMaxPointsCount(settings: AppSettingsModel, isTail, pointsRate: number, levels: number): number {
    let maxPointsCount: number;
    if (isTail) {
      maxPointsCount = (settings.chartMaxPoints - settings.chartMaxVisiblePoints) / 2;
    } else {
      pointsRate = 1;
      maxPointsCount = settings.chartMaxVisiblePoints;
    }

    return Math.round((maxPointsCount / levels) * pointsRate);
  }
}
