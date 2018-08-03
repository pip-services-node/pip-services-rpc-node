"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
class DirectClient {
    constructor() {
        this._opened = true;
        this._logger = new pip_services_components_node_1.CompositeLogger();
        this._counters = new pip_services_components_node_2.CompositeCounters();
        this._dependencyResolver = new pip_services_commons_node_1.DependencyResolver();
        this._dependencyResolver.put('controller', 'none');
    }
    configure(config) {
        this._dependencyResolver.configure(config);
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._dependencyResolver.setReferences(references);
        this._controller = this._dependencyResolver.getOneRequired('controller');
    }
    instrument(correlationId, name) {
        this._logger.trace(correlationId, "Executing %s method", name);
        return this._counters.beginTiming(name + ".call_time");
    }
    isOpen() {
        return this._opened;
    }
    open(correlationId, callback) {
        if (this._opened) {
            callback(null);
            return;
        }
        if (this._controller == null) {
            let err = new pip_services_commons_node_2.ConnectionException(correlationId, 'NO_CONTROLLER', 'Controller reference is missing');
            if (callback) {
                callback(err);
                return;
            }
            else {
                throw err;
            }
        }
        this._opened = true;
        this._logger.info(correlationId, "Opened direct client");
        callback(null);
    }
    close(correlationId, callback) {
        if (this._opened)
            this._logger.info(correlationId, "Closed direct client");
        this._opened = false;
        callback(null);
    }
}
exports.DirectClient = DirectClient;
//# sourceMappingURL=DirectClient.js.map