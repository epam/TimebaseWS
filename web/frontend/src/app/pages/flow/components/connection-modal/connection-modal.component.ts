import { Component }  from '@angular/core';
import { VizceralConnection } from '../../models/vizceral.extended.models';

@Component({
  selector: 'app-connection-modal',
  templateUrl: './connection-modal.component.html',
  styleUrls: ['./connection-modal.component.scss'],
})
export class ConnectionModalComponent {
  connection: VizceralConnection;
}
