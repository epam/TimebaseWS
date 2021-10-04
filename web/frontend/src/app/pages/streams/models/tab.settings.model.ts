export interface TabSettingsModel {
  showProps?: boolean;
  showMessageInfo?: boolean;
  messageJSONType?: boolean;
  chartConfig?: { [key: string]: any };
  _showOnCloseAlerts?: boolean;
}
