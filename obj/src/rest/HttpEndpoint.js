"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const HttpResponseSender_1 = require("./HttpResponseSender");
const HttpConnectionResolver_1 = require("../connect/HttpConnectionResolver");
class HttpEndpoint {
    constructor() {
        this._connectionResolver = new HttpConnectionResolver_1.HttpConnectionResolver();
        this._logger = new pip_services_components_node_1.CompositeLogger();
        this._counters = new pip_services_components_node_2.CompositeCounters();
        this._registrations = [];
    }
    configure(config) {
        config = config.setDefaults(HttpEndpoint._defaultConfig);
        this._connectionResolver.configure(config);
    }
    setReferences(references) {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._connectionResolver.setReferences(references);
    }
    isOpened() {
        return this._server != null;
    }
    open(correlationId, callback) {
        if (this.isOpened()) {
            callback(null);
            return;
        }
        this._connectionResolver.resolve(correlationId, (err, connection) => {
            if (err != null) {
                callback(err);
                return;
            }
            this._uri = connection.getUri();
            try {
                // Create instance of express application   
                let restify = require('restify');
                this._server = restify.createServer({}); // options);
                // Configure express application
                this._server.use(restify.acceptParser(this._server.acceptable));
                //this._server.use(restify.authorizationParser());
                this._server.use(restify.CORS());
                this._server.use(restify.dateParser());
                this._server.use(restify.queryParser());
                this._server.use(restify.jsonp());
                this._server.use(restify.gzipResponse());
                this._server.use(restify.bodyParser());
                this._server.use(restify.conditionalRequest());
                //this._server.use(restify.requestExpiry());
                // if (options.get("throttle") != null)
                //     this._server.use(restify.throttle(options.get("throttle")));
                this.performRegistrations();
                this._server.listen(connection.getPort(), connection.getHost(), (err) => {
                    if (err == null) {
                        // Register the service URI
                        this._connectionResolver.register(correlationId, (err) => {
                            this._logger.debug(correlationId, "Opened REST service at %s", this._uri);
                            if (callback)
                                callback(err);
                        });
                    }
                    else {
                        // Todo: Hack!!!
                        console.error(err);
                        err = new pip_services_commons_node_2.ConnectionException(correlationId, "CANNOT_CONNECT", "Opening REST service failed")
                            .wrap(err).withDetails("url", this._uri);
                        if (callback)
                            callback(err);
                    }
                });
            }
            catch (ex) {
                this._server = null;
                let err = new pip_services_commons_node_2.ConnectionException(correlationId, "CANNOT_CONNECT", "Opening REST service failed")
                    .wrap(ex).withDetails("url", this._uri);
                if (callback)
                    callback(err);
            }
        });
    }
    close(correlationId, callback) {
        if (this._server != null) {
            // Eat exceptions
            try {
                this._server.close();
                this._logger.debug(correlationId, "Closed REST service at %s", this._uri);
            }
            catch (ex) {
                this._logger.warn(correlationId, "Failed while closing REST service: %s", ex);
            }
            this._server = null;
            this._uri = null;
        }
        callback(null);
    }
    register(registration) {
        this._registrations.push(registration);
    }
    unregister(registration) {
        this._registrations = _.remove(this._registrations, r => r == registration);
    }
    performRegistrations() {
        for (let registration of this._registrations) {
            registration.register();
        }
    }
    registerRoute(method, route, schema, action) {
        method = method.toLowerCase();
        if (method == 'delete')
            method = 'del';
        // Hack!!! Wrapping action to preserve prototyping context
        let actionCurl = (req, res) => {
            // Perform validation
            if (schema != null) {
                let params = _.extend({}, req.params, { body: req.body });
                let correlationId = params.correlaton_id;
                let err = schema.validateAndReturnException(correlationId, params, false);
                if (err != null) {
                    HttpResponseSender_1.HttpResponseSender.sendError(req, res, err);
                    return;
                }
            }
            // Todo: perform verification?
            action(req, res);
        };
        // Wrapping to preserve "this"
        let self = this;
        this._server[method](route, actionCurl);
    }
}
HttpEndpoint._defaultConfig = pip_services_commons_node_1.ConfigParams.fromTuples("connection.protocol", "http", "connection.host", "0.0.0.0", "connection.port", 3000, "options.request_max_size", 1024 * 1024, "options.connect_timeout", 60000, "options.debug", true);
exports.HttpEndpoint = HttpEndpoint;
//# sourceMappingURL=HttpEndpoint.js.map