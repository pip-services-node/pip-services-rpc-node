"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RestService_1 = require("./RestService");
class HeartbeatRestService extends RestService_1.RestService {
    constructor() {
        super();
        this._route = "heartbeat";
    }
    configure(config) {
        super.configure(config);
        this._route = config.getAsStringWithDefault("route", this._route);
    }
    register() {
        this.registerRoute("get", this._route, null, (req, res) => { this.heartbeat(req, res); });
    }
    heartbeat(req, res) {
        this.sendResult(req, res)(null, new Date());
    }
}
exports.HeartbeatRestService = HeartbeatRestService;
//# sourceMappingURL=HeartbeatRestService.js.map