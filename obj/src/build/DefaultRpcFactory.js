"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_commons_node_1 = require("pip-services-commons-node");
const HttpEndpoint_1 = require("../services/HttpEndpoint");
const HeartbeatRestService_1 = require("../services/HeartbeatRestService");
const StatusRestService_1 = require("../services/StatusRestService");
class DefaultRpcFactory extends pip_services_components_node_1.Factory {
    constructor() {
        super();
        this.registerAsType(DefaultRpcFactory.HttpEndpointDescriptor, HttpEndpoint_1.HttpEndpoint);
        this.registerAsType(DefaultRpcFactory.HeartbeatServiceDescriptor, HeartbeatRestService_1.HeartbeatRestService);
        this.registerAsType(DefaultRpcFactory.StatusServiceDescriptor, StatusRestService_1.StatusRestService);
    }
}
DefaultRpcFactory.Descriptor = new pip_services_commons_node_1.Descriptor("pip-services", "factory", "net", "default", "1.0");
DefaultRpcFactory.HttpEndpointDescriptor = new pip_services_commons_node_1.Descriptor("pip-services", "endpoint", "http", "*", "1.0");
DefaultRpcFactory.StatusServiceDescriptor = new pip_services_commons_node_1.Descriptor("pip-services", "status-service", "http", "*", "1.0");
DefaultRpcFactory.HeartbeatServiceDescriptor = new pip_services_commons_node_1.Descriptor("pip-services", "heartbeat-service", "http", "*", "1.0");
exports.DefaultRpcFactory = DefaultRpcFactory;
//# sourceMappingURL=DefaultRpcFactory.js.map