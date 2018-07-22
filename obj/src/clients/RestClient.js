"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
let querystring = require('querystring');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const pip_services_commons_node_3 = require("pip-services-commons-node");
const pip_services_commons_node_4 = require("pip-services-commons-node");
const HttpConnectionResolver_1 = require("../connect/HttpConnectionResolver");
class RestClient {
    constructor() {
        this._connectionResolver = new HttpConnectionResolver_1.HttpConnectionResolver();
        this._logger = new pip_services_components_node_1.CompositeLogger();
        this._counters = new pip_services_components_node_2.CompositeCounters();
        this._options = new pip_services_commons_node_1.ConfigParams();
        this._retries = 1;
        this._headers = {};
        this._connectTimeout = 10000;
        this._timeout = 10000;
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._connectionResolver.setReferences(references);
    }
    configure(config) {
        config = config.setDefaults(RestClient._defaultConfig);
        this._connectionResolver.configure(config);
        this._options = this._options.override(config.getSection("options"));
        this._retries = config.getAsIntegerWithDefault("options.retries", this._retries);
        this._connectTimeout = config.getAsIntegerWithDefault("options.connect_timeout", this._connectTimeout);
        this._timeout = config.getAsIntegerWithDefault("options.timeout", this._timeout);
        this._baseRoute = config.getAsStringWithDefault("base_route", this._baseRoute);
    }
    instrument(correlationId, name) {
        this._logger.trace(correlationId, "Executing %s method", name);
        return this._counters.beginTiming(name + ".call_time");
    }
    isOpened() {
        return this._client != null;
    }
    open(correlationId, callback) {
        if (this.isOpened()) {
            if (callback)
                callback(null);
            return;
        }
        this._connectionResolver.resolve(correlationId, (err, connection) => {
            if (err) {
                if (callback)
                    callback(err);
                return;
            }
            try {
                this._uri = connection.getUri();
                let restify = require('restify');
                this._client = restify.createJsonClient({
                    url: this._uri,
                    connectTimeout: this._connectTimeout,
                    requestTimeout: this._timeout,
                    headers: this._headers,
                    retry: {
                        minTimeout: this._timeout,
                        maxTimeout: Infinity,
                        retries: this._retries
                    },
                    version: '*'
                });
                if (callback)
                    callback(null);
            }
            catch (err) {
                this._client = null;
                let ex = new pip_services_commons_node_3.ConnectionException(correlationId, "CANNOT_CONNECT", "Connection to REST service failed")
                    .wrap(err).withDetails("url", this._uri);
                if (callback)
                    callback(ex);
            }
        });
    }
    close(correlationId, callback) {
        if (this._client != null) {
            // Eat exceptions
            try {
                this._logger.debug(correlationId, "Closed REST service at %s", this._uri);
            }
            catch (ex) {
                this._logger.warn(correlationId, "Failed while closing REST service: %s", ex);
            }
            this._client = null;
            this._uri = null;
        }
        if (callback)
            callback(null);
    }
    addCorrelationId(params, correlationId) {
        // Automatically generate short ids for now
        if (correlationId == null)
            //correlationId = IdGenerator.nextShort();
            return params;
        params = params || {};
        params.correlation_id = correlationId;
        return params;
    }
    addFilterParams(params, filter) {
        params = params || {};
        if (filter) {
            for (let prop in filter) {
                if (filter.hasOwnProperty(prop))
                    params[prop] = filter[prop];
            }
        }
        return params;
    }
    addPagingParams(params, paging) {
        params = params || {};
        if (paging) {
            if (paging.total)
                params.total = paging.total;
            if (paging.skip)
                params.skip = paging.skip;
            if (paging.take)
                params.take = paging.take;
        }
        return params;
    }
    createRequestRoute(route) {
        let builder = "";
        if (this._baseRoute != null && this._baseRoute.length > 0) {
            if (this._baseRoute[0] != "/")
                builder += "/";
            builder += this._baseRoute;
        }
        if (route[0] != "/")
            builder += "/";
        builder += route;
        return builder;
    }
    call(method, route, correlationId, params = {}, data, callback) {
        method = method.toLowerCase();
        if (_.isFunction(data)) {
            callback = data;
            data = {};
        }
        route = this.createRequestRoute(route);
        params = this.addCorrelationId(params, correlationId);
        if (!_.isEmpty(params))
            route += '?' + querystring.stringify(params);
        let self = this;
        let action = null;
        if (callback) {
            action = (err, req, res, data) => {
                // Handling 204 codes
                if (res && res.statusCode == 204)
                    callback.call(self, null, null);
                else if (err == null)
                    callback.call(self, null, data);
                else {
                    // Restore application exception
                    if (data != null)
                        err = pip_services_commons_node_2.ApplicationExceptionFactory.create(data).withCause(err);
                    callback.call(self, err, null);
                }
            };
        }
        if (method == 'get')
            this._client.get(route, action);
        else if (method == 'head')
            this._client.head(route, action);
        else if (method == 'post')
            this._client.post(route, data, action);
        else if (method == 'put')
            this._client.put(route, data, action);
        else if (method == 'delete')
            this._client.del(route, action);
        else {
            let error = new pip_services_commons_node_4.UnknownException(correlationId, 'UNSUPPORTED_METHOD', 'Method is not supported by REST client')
                .withDetails('verb', method);
            if (callback)
                callback(error, null);
            else
                throw error;
        }
    }
}
RestClient._defaultConfig = pip_services_commons_node_1.ConfigParams.fromTuples("connection.protocol", "http", "connection.host", "0.0.0.0", "connection.port", 3000, "options.request_max_size", 1024 * 1024, "options.connect_timeout", 10000, "options.timeout", 10000, "options.retries", 3, "options.debug", true);
exports.RestClient = RestClient;
//# sourceMappingURL=RestClient.js.map