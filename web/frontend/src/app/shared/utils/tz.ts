import {HdDate} from '@deltix/hd-date';
import {DateTime} from 'luxon';

export const tzStr =
  'Africa/Abidjan,Africa/Bamako,Africa/Banjul,Africa/Conakry,Africa/Dakar,Africa/Freetown,Africa/Lome,Africa/Nouakchott,Africa/Ouagadougou,Africa/Timbuktu,Atlantic/St_Helena|Africa/Accra|Africa/Nairobi,Africa/Addis_Ababa,Africa/Asmara,Africa/Dar_es_Salaam,Africa/Djibouti,Africa/Kampala,Africa/Mogadishu,Indian/Antananarivo,Indian/Comoro,Indian/Mayotte|Africa/Algiers|Africa/Lagos,Africa/Bangui,Africa/Brazzaville,Africa/Douala,Africa/Kinshasa,Africa/Libreville,Africa/Luanda,Africa/Malabo,Africa/Niamey,Africa/Porto-Novo,Africa/Sao_Tome|Africa/Bissau|Africa/Maputo,Africa/Blantyre,Africa/Bujumbura,Africa/Gaborone,Africa/Harare,Africa/Kigali,Africa/Lubumbashi,Africa/Lusaka|Africa/Cairo|Africa/Casablanca|Africa/Ceuta|Africa/El_Aaiun|Africa/Johannesburg,Africa/Maseru,Africa/Mbabane|Africa/Juba|Africa/Khartoum|Africa/Monrovia|Africa/Ndjamena|Africa/Tripoli|Africa/Tunis|Africa/Windhoek|America/Adak,America/Atka|America/Anchorage|America/Port_of_Spain,America/Anguilla,America/Antigua,America/Dominica,America/Grenada,America/Guadeloupe,America/Marigot,America/Montserrat,America/St_Barthelemy,America/St_Kitts,America/St_Lucia,America/St_Thomas,America/St_Vincent,America/Tortola,America/Virgin|America/Araguaina|America/Argentina/Buenos_Aires,America/Buenos_Aires|America/Argentina/Catamarca,America/Argentina/ComodRivadavia,America/Catamarca|America/Argentina/Cordoba,America/Cordoba,America/Rosario|America/Argentina/Jujuy,America/Jujuy|America/Argentina/La_Rioja|America/Argentina/Mendoza,America/Mendoza|America/Argentina/Rio_Gallegos|America/Argentina/Salta|America/Argentina/San_Juan|America/Argentina/San_Luis|America/Argentina/Tucuman|America/Argentina/Ushuaia|America/Curacao,America/Aruba,America/Kralendijk,America/Lower_Princes|America/Asuncion|America/Atikokan,America/Coral_Harbour|America/Bahia|America/Bahia_Banderas|America/Barbados|America/Belem|America/Belize|America/Blanc-Sablon|America/Boa_Vista|America/Bogota|America/Boise|America/Cambridge_Bay|America/Campo_Grande|America/Cancun|America/Caracas|America/Cayenne|America/Panama,America/Cayman|America/Chicago|America/Chihuahua|America/Costa_Rica|America/Creston|America/Cuiaba|America/Danmarkshavn|America/Dawson|America/Dawson_Creek|America/Denver,America/Shiprock|America/Detroit|America/Edmonton|America/Eirunepe|America/El_Salvador|America/Tijuana,America/Ensenada,America/Santa_Isabel|America/Fort_Nelson|America/Indiana/Indianapolis,America/Fort_Wayne,America/Indianapolis|America/Fortaleza|America/Glace_Bay|America/Godthab|America/Goose_Bay|America/Grand_Turk|America/Guatemala|America/Guayaquil|America/Guyana|America/Halifax|America/Havana|America/Hermosillo|America/Indiana/Knox,America/Knox_IN|America/Indiana/Marengo|America/Indiana/Petersburg|America/Indiana/Tell_City|America/Indiana/Vevay|America/Indiana/Vincennes|America/Indiana/Winamac|America/Inuvik|America/Iqaluit|America/Jamaica|America/Juneau|America/Kentucky/Louisville,America/Louisville|America/Kentucky/Monticello|America/La_Paz|America/Lima|America/Los_Angeles|America/Maceio|America/Managua|America/Manaus|America/Martinique|America/Matamoros|America/Mazatlan|America/Menominee|America/Merida|America/Metlakatla|America/Mexico_City|America/Miquelon|America/Moncton|America/Monterrey|America/Montevideo|America/Toronto,America/Montreal|America/Nassau|America/New_York|America/Nipigon|America/Nome|America/Noronha|America/North_Dakota/Beulah|America/North_Dakota/Center|America/North_Dakota/New_Salem|America/Ojinaga|America/Pangnirtung|America/Paramaribo|America/Phoenix|America/Port-au-Prince|America/Rio_Branco,America/Porto_Acre|America/Porto_Velho|America/Puerto_Rico|America/Punta_Arenas|America/Rainy_River|America/Rankin_Inlet|America/Recife|America/Regina|America/Resolute|America/Santarem|America/Santiago|America/Santo_Domingo|America/Sao_Paulo|America/Scoresbysund|America/Sitka|America/St_Johns|America/Swift_Current|America/Tegucigalpa|America/Thule|America/Thunder_Bay|America/Vancouver|America/Whitehorse|America/Winnipeg|America/Yakutat|America/Yellowknife|Antarctica/Casey|Antarctica/Davis|Antarctica/DumontDUrville|Antarctica/Macquarie|Antarctica/Mawson|Pacific/Auckland,Antarctica/McMurdo,Antarctica/South_Pole|Antarctica/Palmer|Antarctica/Rothera|Antarctica/Syowa|Antarctica/Troll|Antarctica/Vostok|Europe/Oslo,Arctic/Longyearbyen,Atlantic/Jan_Mayen|Asia/Riyadh,Asia/Aden,Asia/Kuwait|Asia/Almaty|Asia/Amman|Asia/Anadyr|Asia/Aqtau|Asia/Aqtobe|Asia/Ashgabat,Asia/Ashkhabad|Asia/Atyrau|Asia/Baghdad|Asia/Qatar,Asia/Bahrain|Asia/Baku|Asia/Bangkok,Asia/Phnom_Penh,Asia/Vientiane|Asia/Barnaul|Asia/Beirut|Asia/Bishkek|Asia/Brunei|Asia/Kolkata,Asia/Calcutta|Asia/Chita|Asia/Choibalsan|Asia/Shanghai,Asia/Chongqing,Asia/Chungking,Asia/Harbin|Asia/Colombo|Asia/Dhaka,Asia/Dacca|Asia/Damascus|Asia/Dili|Asia/Dubai,Asia/Muscat|Asia/Dushanbe|Asia/Famagusta|Asia/Gaza|Asia/Hebron|Asia/Ho_Chi_Minh,Asia/Saigon|Asia/Hong_Kong|Asia/Hovd|Asia/Irkutsk|Europe/Istanbul,Asia/Istanbul|Asia/Jakarta|Asia/Jayapura|Asia/Jerusalem,Asia/Tel_Aviv|Asia/Kabul|Asia/Kamchatka|Asia/Karachi|Asia/Urumqi,Asia/Kashgar|Asia/Kathmandu,Asia/Katmandu|Asia/Khandyga|Asia/Krasnoyarsk|Asia/Kuala_Lumpur|Asia/Kuching|Asia/Macau,Asia/Macao|Asia/Magadan|Asia/Makassar,Asia/Ujung_Pandang|Asia/Manila|Asia/Novokuznetsk|Asia/Novosibirsk|Asia/Omsk|Asia/Oral|Asia/Pontianak|Asia/Pyongyang|Asia/Qyzylorda|Asia/Yangon,Asia/Rangoon|Asia/Sakhalin|Asia/Samarkand|Asia/Seoul|Asia/Singapore|Asia/Srednekolymsk|Asia/Taipei|Asia/Tashkent|Asia/Tbilisi|Asia/Tehran|Asia/Thimphu,Asia/Thimbu|Asia/Tokyo|Asia/Tomsk|Asia/Ulaanbaatar,Asia/Ulan_Bator|Asia/Ust-Nera|Asia/Vladivostok|Asia/Yakutsk|Asia/Yekaterinburg|Asia/Yerevan|Atlantic/Azores|Atlantic/Bermuda|Atlantic/Canary|Atlantic/Cape_Verde|Atlantic/Faroe,Atlantic/Faeroe|Atlantic/Madeira|Atlantic/Reykjavik|Atlantic/South_Georgia|Atlantic/Stanley|Australia/Adelaide|Australia/Brisbane|Australia/Broken_Hill,Australia/Yancowinna|Australia/Sydney,Australia/Canberra|Australia/Currie|Australia/Darwin|Australia/Eucla|Australia/Hobart|Australia/Lindeman|Australia/Lord_Howe|Australia/Melbourne|Australia/Perth|Etc/GMT,Etc/GMT+0,Etc/GMT0,Etc/GMT-0,GMT|Etc/GMT+1|Etc/GMT+10|Etc/GMT+11|Etc/GMT+12|Etc/GMT+2|Etc/GMT+3|Etc/GMT+4|Etc/GMT+5|Etc/GMT+6|Etc/GMT+7|Etc/GMT+8|Etc/GMT+9|Etc/GMT-1|Etc/GMT-10|Etc/GMT-11|Etc/GMT-12|Etc/GMT-13|Etc/GMT-14|Etc/GMT-2|Etc/GMT-3|Etc/GMT-4|Etc/GMT-5|Etc/GMT-6|Etc/GMT-7|Etc/GMT-8|Etc/GMT-9|Etc/UTC,UTC|Europe/Amsterdam|Europe/Andorra|Europe/Astrakhan|Europe/Athens|Europe/London,Europe/Belfast,Europe/Guernsey,Europe/Isle_of_Man,Europe/Jersey|Europe/Belgrade,Europe/Ljubljana,Europe/Podgorica,Europe/Sarajevo,Europe/Skopje,Europe/Zagreb|Europe/Berlin|Europe/Prague,Europe/Bratislava|Europe/Brussels|Europe/Bucharest|Europe/Budapest|Europe/Zurich,Europe/Busingen,Europe/Vaduz|Europe/Chisinau,Europe/Tiraspol|Europe/Copenhagen|Europe/Dublin|Europe/Gibraltar|Europe/Helsinki,Europe/Mariehamn|Europe/Kaliningrad|Europe/Kiev|Europe/Kirov|Europe/Lisbon|Europe/Luxembourg|Europe/Madrid|Europe/Malta|Europe/Minsk|Europe/Monaco|Europe/Moscow|Asia/Nicosia|Europe/Paris|Europe/Riga|Europe/Rome,Europe/San_Marino,Europe/Vatican|Europe/Samara|Europe/Saratov|Europe/Simferopol|Europe/Sofia|Europe/Stockholm|Europe/Tallinn|Europe/Tirane|Europe/Ulyanovsk|Europe/Uzhgorod|Europe/Vienna|Europe/Vilnius|Europe/Volgograd|Europe/Warsaw|Europe/Zaporozhye|Indian/Chagos|Indian/Christmas|Indian/Cocos|Indian/Kerguelen|Indian/Mahe|Indian/Maldives|Indian/Mauritius|Indian/Reunion|Pacific/Apia|Pacific/Bougainville|Pacific/Chatham|Pacific/Chuuk,Pacific/Truk,Pacific/Yap|Pacific/Easter|Pacific/Efate|Pacific/Enderbury|Pacific/Fakaofo|Pacific/Fiji|Pacific/Funafuti|Pacific/Galapagos|Pacific/Gambier|Pacific/Guadalcanal|Pacific/Guam,Pacific/Saipan|Pacific/Honolulu,Pacific/Johnston|Pacific/Kiritimati|Pacific/Kosrae|Pacific/Kwajalein|Pacific/Majuro|Pacific/Marquesas|Pacific/Pago_Pago,Pacific/Midway,Pacific/Samoa|Pacific/Nauru|Pacific/Niue|Pacific/Norfolk|Pacific/Noumea|Pacific/Palau|Pacific/Pitcairn|Pacific/Pohnpei,Pacific/Ponape|Pacific/Port_Moresby|Pacific/Rarotonga|Pacific/Tahiti|Pacific/Tarawa|Pacific/Tongatapu|Pacific/Wake|Pacific/Wallis';

export class TimeZone {
  constructor(public name: string, public offset: number, public alias = false) {}
}

export const getTimeZoneOffset = (
  tz: string,
  dateDef?: Date | number | string | HdDate,
): number => {
  let date: Date;
  if (dateDef instanceof Date) {
    date = dateDef;
  } else if (dateDef == null) {
    date = new Date();
  } else {
    date = new Date(<any>dateDef);
  }

  const d = DateTime.local(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  const tzDate2 = d.setZone(tz);
  const utcDate2 = d.setZone('UTC');

  return tzDate2.offset - utcDate2.offset;
};

const initTzList = (): TimeZone[] => {
  const tzList: TimeZone[] = [];
  const list = tzStr.split('|');

  for (const tz of list) {
    const tzWithAliases = tz.split(',');
    const name = tzWithAliases[0];
    const offset = getTimeZoneOffset(name);

    if (offset != null) {
      tzList.push(new TimeZone(name, offset));
      if (tzWithAliases.length > 1) {
        for (let i = 1; i < tzWithAliases.length; i++) {
          if (tzWithAliases[i]) {
            tzList.push(new TimeZone(tzWithAliases[i], offset, true));
          }
        }
      }
    }
  }

  return tzList.sort((tz1, tz2) => tz2.offset - tz1.offset);
};

export const timeZoneOffsetToString = (offset: number) => {
  const total = Math.abs(offset);
  const minutes = total % 60;
  const hours = (total - minutes) / 60;

  return (
    (offset >= 0 ? '+' : '-') +
    `${(hours + '').padStart(2, '0')}:${(minutes + '').padStart(2, '0')}`
  );
};

export const TIME_ZONE_LIST: Array<TimeZone> = initTzList();
