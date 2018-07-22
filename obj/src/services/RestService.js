"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const pip_services_commons_node_3 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
const HttpEndpoint_1 = require("./HttpEndpoint");
const HttpResponseSender_1 = require("./HttpResponseSender");
class RestService {
    constructor() {
        this._dependencyResolver = new pip_services_commons_node_3.DependencyResolver(RestService._defaultConfig);
        this._logger = new pip_services_components_node_1.CompositeLogger();
        this._counters = new pip_services_components_node_2.CompositeCounters();
    }
    configure(config) {
        config = config.setDefaults(RestService._defaultConfig);
        this._config = config;
        this._dependencyResolver.configure(config);
        this._baseRoute = config.getAsStringWithDefault("base_route", this._baseRoute);
    }
    setReferences(references) {
        this._references = references;
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._dependencyResolver.setReferences(references);
        // Get endpoint
        this._endpoint = this._dependencyResolver.getOneOptional('endpoint');
        // Or create a local one
        if (this._endpoint == null) {
            this._endpoint = this.createEndpoint();
            this._localEndpoint = true;
        }
        else {
            this._localEndpoint = false;
        }
        // Add registration callback to the endpoint
        this._endpoint.register(this);
    }
    unsetReferences() {
        // Remove registration callback from endpoint
        if (this._endpoint != null) {
            this._endpoint.unregister(this);
            this._endpoint = null;
        }
    }
    createEndpoint() {
        let endpoint = new HttpEndpoint_1.HttpEndpoint();
        if (this._config)
            endpoint.configure(this._config);
        if (this._references)
            endpoint.setReferences(this._references);
        return endpoint;
    }
    instrument(correlationId, name) {
        this._logger.trace(correlationId, "Executing %s method", name);
        return this._counters.beginTiming(name + ".exec_time");
    }
    isOpened() {
        return this._opened;
    }
    open(correlationId, callback) {
        if (this._opened) {
            callback(null);
            return;
        }
        if (this._endpoint == null) {
            this._endpoint = this.createEndpoint();
            this._endpoint.register(this);
            this._localEndpoint = true;
        }
        if (this._localEndpoint) {
            this._endpoint.open(correlationId, (err) => {
                this._opened = err == null;
                callback(err);
            });
        }
        else {
            this._opened = true;
            callback(null);
        }
    }
    close(correlationId, callback) {
        if (!this._opened) {
            callback(null);
            return;
        }
        if (this._endpoint == null) {
            callback(new pip_services_commons_node_1.InvalidStateException(correlationId, 'NO_ENDPOINT', 'HTTP endpoint is missing'));
            return;
        }
        if (this._localEndpoint) {
            this._endpoint.close(correlationId, (err) => {
                this._opened = false;
                callback(err);
            });
        }
        else {
            this._opened = false;
            callback(null);
        }
    }
    sendResult(req, res) {
        return HttpResponseSender_1.HttpResponseSender.sendResult(req, res);
    }
    sendCreatedResult(req, res) {
        return HttpResponseSender_1.HttpResponseSender.sendCreatedResult(req, res);
    }
    sendDeletedResult(req, res) {
        return HttpResponseSender_1.HttpResponseSender.sendDeletedResult(req, res);
    }
    sendError(req, res, error) {
        HttpResponseSender_1.HttpResponseSender.sendError(req, res, error);
    }
    registerRoute(method, route, schema, action) {
        if (this._endpoint == null)
            return;
        if (this._baseRoute != null && this._baseRoute.length > 0) {
            let baseRoute = this._baseRoute;
            if (baseRoute[0] != '/')
                baseRoute = '/' + baseRoute;
            route = baseRoute + route;
        }
        this._endpoint.registerRoute(method, route, schema, (req, res) => {
            action.call(this, req, res);
        });
    }
    register() { }
}
RestService._defaultConfig = pip_services_commons_node_2.ConfigParams.fromTuples("base_route", "", "dependencies.endpoint", "pip-services:endpoint:http:*:1.0");
exports.RestService = RestService;
//# sourceMappingURL=RestService.js.map