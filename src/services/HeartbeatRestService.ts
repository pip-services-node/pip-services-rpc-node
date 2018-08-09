/** @module services */
import { RestService } from './RestService';
import { ConfigParams } from 'pip-services-commons-node';

export class HeartbeatRestService extends RestService {
    private _route: string = "heartbeat";

    public constructor() {
        super();
    }

    public configure(config: ConfigParams): void {
        super.configure(config);

        this._route = config.getAsStringWithDefault("route", this._route);
    }

    public register(): void {
        this.registerRoute("get", this._route, null, (req, res) => { this.heartbeat(req, res); });
    }

    private heartbeat(req, res): void {
        this.sendResult(req, res)(null, new Date());
    }
}