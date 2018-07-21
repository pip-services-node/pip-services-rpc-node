"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const RestService_1 = require("../rest/RestService");
class StatusRestService extends RestService_1.RestService {
    constructor() {
        super();
        this._startTime = new Date();
        this._route = "status";
        this._dependencyResolver.put("context-info", new pip_services_commons_node_1.Descriptor("pip-services", "context-info", "default", "*", "1.0"));
    }
    configure(config) {
        super.configure(config);
        this._route = config.getAsStringWithDefault("route", this._route);
    }
    setReferences(references) {
        this._references2 = references;
        super.setReferences(references);
        this._contextInfo = this._dependencyResolver.getOneOptional("context-info");
    }
    register() {
        this.registerRoute("get", this._route, null, (req, res) => { this.status(req, res); });
    }
    status(req, res) {
        let id = this._contextInfo != null ? this._contextInfo.contextId : "";
        let name = this._contextInfo != null ? this._contextInfo.name : "Unknown";
        let description = this._contextInfo != null ? this._contextInfo.description : "";
        let uptime = new Date().getTime() - this._startTime.getTime();
        let properties = this._contextInfo != null ? this._contextInfo.properties : "";
        let components = [];
        if (this._references2 != null) {
            for (let locator of this._references2.getAllLocators())
                components.push(locator.toString());
        }
        let status = {
            id: id,
            name: name,
            description: description,
            start_time: pip_services_commons_node_2.StringConverter.toString(this._startTime),
            current_time: pip_services_commons_node_2.StringConverter.toString(new Date()),
            uptime: uptime,
            properties: properties,
            components: components
        };
        this.sendResult(req, res)(null, status);
    }
}
exports.StatusRestService = StatusRestService;
//# sourceMappingURL=StatusRestService.js.map