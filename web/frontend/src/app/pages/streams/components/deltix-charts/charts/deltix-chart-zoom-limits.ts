import {ZOOM_PERIODS}                                   from '../../../models/deltix-chart.models';
import { day, hour, minute, month, second, week, year } from './units-in-ms';

export function zoomLimits(barWidth: number, adaptToWidth = true): number[] {
  const config = [
    {
      barWidthRange: [1, minute - 1],
      zoomLimit: [second, day],
    },
    {
      barWidthRange: [minute, hour - 1],
      zoomLimit: [minute, week],
    },
    {
      barWidthRange: [hour, day - 1],
      zoomLimit: [hour, month],
    },
    {
      barWidthRange: [day, month - 1],
      zoomLimit: [day, year],
    },
    {
      barWidthRange: [month, null],
      zoomLimit: [month, null],
    },
  ];

  const limit = [
    ...config.find((entry) => {
      const [from, to] = entry.barWidthRange;
      return (barWidth >= from && barWidth <= to) || to === null;
    }).zoomLimit,
  ];
  if (adaptToWidth) {
    limit[0] = barWidth;
  }
  return limit;
}

export function barWidthDefault(barWidth: number): number {
  const config = [
    {
      barWidthRange: [1, minute - 1],
      default: 5 * minute,
    },
    {
      barWidthRange: [minute, 5 * minute],
      default: 3 * hour,
    },
    {
      barWidthRange: [5 * minute + 1, hour],
      default: 6 * hour,
    },
    {
      barWidthRange: [hour + 1, 4 * hour],
      default: 2 * day,
    },
    {
      barWidthRange: [4 * hour + 1, 12 * hour],
      default: 7 * day,
    },
    {
      barWidthRange: [12 * hour + 1, day],
      default: month,
    },
    {
      barWidthRange: [day + 1, week],
      default: 6 * month,
    },
    {
      barWidthRange: [week + 1, month],
      default: year,
    },
    {
      barWidthRange: [month + 1, null],
      default: 10 * year,
    },
  ];

  return config.find(
    (entry) =>
      entry.barWidthRange[0] <= barWidth &&
      (entry.barWidthRange[1] === null || entry.barWidthRange[1] >= barWidth),
  ).default;
}

export function timestampToDay(timestamp: number): string {
  if (!timestamp) {
    return '';
  }

  let time = timestamp;
  const periods = {year, month, week, day, hour, minute, second};
  const result = {};
  Object.keys(periods).forEach((period) => {
    result[period] = Math.floor(time / periods[period]);
    time -= result[period] * periods[period];
  });

  return Object.keys(result)
    .filter((period) => result[period])
    .map((period) => `${result[period]} ${period}`)
    .join(' ');
}

export function zoomRestrictions(barWidth: number) {
  const limits = zoomLimits(barWidth, false);
  const intervals = {
    [second]: ZOOM_PERIODS.SECOND,
    [minute]: ZOOM_PERIODS.MINUTE,
    [hour]: ZOOM_PERIODS.HOUR,
    [day]: ZOOM_PERIODS.DAY,
    [week]: ZOOM_PERIODS.DAY_7,
    [month]: ZOOM_PERIODS.DAY_30,
    [year]: ZOOM_PERIODS.DAY_365,
    null: ZOOM_PERIODS.BIG_PERIOD,
  };

  return limits.map((limit, index) => (index === 0 ? intervals[limit] - 1 : intervals[limit] + 1));
}
