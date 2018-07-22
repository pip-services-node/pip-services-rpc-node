import { IReferences } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { RestService } from './RestService';
export declare class StatusRestService extends RestService {
    private _startTime;
    private _references2;
    private _contextInfo;
    private _route;
    constructor();
    configure(config: ConfigParams): void;
    setReferences(references: IReferences): void;
    register(): void;
    private status;
}
