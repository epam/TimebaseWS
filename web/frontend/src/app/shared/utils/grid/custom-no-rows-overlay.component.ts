import { INoRowsOverlayComp, INoRowsOverlayParams } from 'ag-grid-community';

export class CustomNoRowOverlayComponent implements INoRowsOverlayComp {
  public init(params: INoRowsOverlayParams) {
    if ((params as any).api) {
      const filters = (params as any).api.getFilterModel();
      const rows = (params as any).api.rowRenderer.rowCompsByIndex;
      (this as any).eGui = document.createElement('div');
      const span = document.createElement('span');
      span.className = 'ag-overlay-no-rows-center';
      if (Array.from(Object.keys(filters)).length > 0 && Array.from(Object.keys(rows)).length === 0) {
        span.textContent = 'All data is filtered out';
      } else {
        span.textContent = 'No data to show';
      }
      (this as any).eGui.appendChild(span);
    }
  }

  public getGui() {
    return (this as any).eGui;
  }
}
