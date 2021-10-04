export class WSLiveModel {
    messageType?: string;
    fromTimestamp: string;
    symbols?: string[];
  space?: string;
  types?: string[];

    constructor(obj: WSLiveModel | {}) {
        Object.assign(this, obj);
    }

}
