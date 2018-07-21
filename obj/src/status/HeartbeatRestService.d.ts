import { RestService } from '../rest/RestService';
import { ConfigParams } from 'pip-services-commons-node';
export declare class HeartbeatRestService extends RestService {
    private _route;
    constructor();
    configure(config: ConfigParams): void;
    register(): void;
    private heartbeat;
}
