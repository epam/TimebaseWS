export class NotificationModel {
  public type?: 'success' | 'info' | 'warning' | 'danger';
  public message: string;
  public closeInterval?: number;
  public dismissible?: boolean;
  public closeAction?: () => void;
  public requestDialogParams?: {
    closeIntervalType?: 'success' | 'cancel';
    closeActions: {
      onSuccess: () => void;
      onCancel?: () => void;
    };
    buttonsTextLinks?: {
      success: string;
      cancel: string;
    };
  };

  public alias?: string;

  constructor(notification: NotificationModel) {
    Object.assign(this, notification || {});
    this.type = notification.type || 'info';
    this.dismissible = notification.dismissible || false;
    if (notification.closeAction) this.closeAction = notification.closeAction;
    if (notification.closeInterval) this.closeInterval = notification.closeInterval;
    if (notification.requestDialogParams && !notification.requestDialogParams.closeActions.onCancel)
      this.requestDialogParams.closeActions.onCancel = () => {};
  }
}
