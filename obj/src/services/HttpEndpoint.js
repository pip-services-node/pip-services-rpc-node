"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module services */
/** @hidden */
let _ = require('lodash');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const HttpResponseSender_1 = require("./HttpResponseSender");
const HttpConnectionResolver_1 = require("../connect/HttpConnectionResolver");
/**
 * Used for creating HTTP endpoints. An endpoint is a URL, at which a given service can be accessed by a client.
 *
 * ### Configuration parameters ###
 *
 * Parameters to pass to the [[configure]] method for component configuration:
 *
 * - connection(s) - the connection resolver's connections;
 *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
 *     - "connection.protocol" - the connection's protocol;
 *     - "connection.host" - the target host;
 *     - "connection.port" - the target port;
 *     - "connection.uri" - the target URI.
 *
 * ### References ###
 *
 * A logger, counters, and a connection resolver can be referenced by passing the
 * following references to the object's [[setReferences]] method:
 *
 * - logger: <code>"\*:logger:\*:\*:1.0"</code>;
 * - counters: <code>"\*:counters:\*:\*:1.0"</code>;
 * - discovery: <code>"\*:discovery:\*:\*:1.0"</code> (for the connection resolver).
 *
 * ### Examples ###
 *
 *     public MyMethod(_config: ConfigParams, _references: IReferences) {
 *         let endpoint = new HttpEndpoint();
 *         if (this._config)
 *             endpoint.configure(this._config);
 *         if (this._references)
 *             endpoint.setReferences(this._references);
 *         ...
 *
 *         this._endpoint.open(correlationId, (err) => {
 *                 this._opened = err == null;
 *                 callback(err);
 *             });
 *         ...
 *     }
 */
class HttpEndpoint {
    constructor() {
        this._connectionResolver = new HttpConnectionResolver_1.HttpConnectionResolver();
        this._logger = new pip_services_components_node_1.CompositeLogger();
        this._counters = new pip_services_components_node_2.CompositeCounters();
        this._registrations = [];
    }
    /**
     * Configures this HttpEndpoint using the given configuration parameters.
     *
     * __Configuration parameters:__
     * - __connection(s)__ - the connection resolver's connections;
     *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
     *     - "connection.protocol" - the connection's protocol;
     *     - "connection.host" - the target host;
     *     - "connection.port" - the target port;
     *     - "connection.uri" - the target URI.
     *
     * @param config    configuration parameters, containing a "connection(s)" section.
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
    configure(config) {
        config = config.setDefaults(HttpEndpoint._defaultConfig);
        this._connectionResolver.configure(config);
    }
    /**
     * Sets references to this endpoint's logger, counters, and connection resolver.
     *
     * __References:__
     * - logger: <code>"\*:logger:\*:\*:1.0"</code>
     * - counters: <code>"\*:counters:\*:\*:1.0"</code>
     * - discovery: <code>"\*:discovery:\*:\*:1.0"</code> (for the connection resolver)
     *
     * @param references    an IReferences object, containing references to a logger, counters,
     *                      and a connection resolver.
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/refer.ireferences.html IReferences]] (in the PipServices "Commons" package)
     */
    setReferences(references) {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._connectionResolver.setReferences(references);
    }
    /**
     * @returns whether or not this endpoint is open with an actively listening REST server.
     */
    isOpen() {
        return this._server != null;
    }
    //TODO: check for correct understanding.
    /**
     * Opens a connection using the parameters resolved by the referenced connection
     * resolver and creates a REST server (service) using the set options and parameters.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback          (optional) the function to call once the opening process is complete.
     *                          Will be called with an error if one is raised.
     */
    open(correlationId, callback) {
        if (this.isOpen()) {
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
    /**
     * Closes this endpoint and the REST server (service) that was opened earlier.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback          (optional) the function to call once the closing process is complete.
     *                          Will be called with an error if one is raised.
     */
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
    /**
     * Registers a registerable object for dynamic endpoint discovery.
     *
     * @param registration      the registration to add.
     *
     * @see [[IRegisterable]]
     */
    register(registration) {
        this._registrations.push(registration);
    }
    /**
     * Unregisters a registerable object, so that it is no longer used in dynamic
     * endpoint discovery.
     *
     * @param registration      the registration to remove.
     *
     * @see [[IRegisterable]]
     */
    unregister(registration) {
        this._registrations = _.remove(this._registrations, r => r == registration);
    }
    performRegistrations() {
        for (let registration of this._registrations) {
            registration.register();
        }
    }
    /**
     * Registers an action in this objects REST server (service) by the given method and route.
     *
     * @param method        the HTTP method of the route.
     * @param route         the route to register in this object's REST server (service).
     * @param schema        the schema to use for parameter validation.
     * @param action        the action to perform at the given route.
     */
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