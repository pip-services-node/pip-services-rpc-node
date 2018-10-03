"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module services */
/** @hidden */
let _ = require('lodash');
const pip_services_commons_node_1 = require("pip-services-commons-node");
const pip_services_commons_node_2 = require("pip-services-commons-node");
const pip_services_commons_node_3 = require("pip-services-commons-node");
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_components_node_2 = require("pip-services-components-node");
const HttpEndpoint_1 = require("./HttpEndpoint");
const HttpResponseSender_1 = require("./HttpResponseSender");
/**
 * Abstract service that receives remove calls via HTTP/REST protocol.
 *
 * ### Configuration parameters ###
 *
 * - base_route:              base route for remote URI
 * - dependencies:
 *   - endpoint:              override for HTTP Endpoint dependency
 *   - controller:            override for Controller dependency
 * - connection(s):
 *   - discovery_key:         (optional) a key to retrieve the connection from [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]]
 *   - protocol:              connection protocol: http or https
 *   - host:                  host name or IP address
 *   - port:                  port number
 *   - uri:                   resource URI or connection string with all parameters in it
 *
 * ### References ###
 *
 * - <code>\*:logger:\*:\*:1.0</code>               (optional) [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/interfaces/log.ilogger.html ILogger]] components to pass log messages
 * - <code>\*:counters:\*:\*:1.0</code>             (optional) [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/interfaces/count.icounters.html ICounters]] components to pass collected measurements
 * - <code>\*:discovery:\*:\*:1.0</code>            (optional) [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]] services to resolve connection
 * - <code>\*:endpoint:http:\*:1.0</code>          (optional) [[HttpEndpoint]] reference
 *
 * @see [[RestClient]]
 *
 * ### Example ###
 *
 *     class MyRestService extends RestService {
 *        private _controller: IMyController;
 *        ...
 *        public constructor() {
 *           base();
 *           this._dependencyResolver.put(
 *               "controller",
 *               new Descriptor("mygroup","controller","*","*","1.0")
 *           );
 *        }
 *
 *        public setReferences(references: IReferences): void {
 *           base.setReferences(references);
 *           this._controller = this._dependencyResolver.getRequired<IMyController>("controller");
 *        }
 *
 *        public register(): void {
 *            registerRoute("get", "get_mydata", null, (req, res) => {
 *                let correlationId = req.param("correlation_id");
 *                let id = req.param("id");
 *                this._controller.getMyData(correlationId, id, this.sendResult(req, res));
 *            });
 *            ...
 *        }
 *     }
 *
 *     let service = new MyRestService();
 *     service.configure(ConfigParams.fromTuples(
 *         "connection.protocol", "http",
 *         "connection.host", "localhost",
 *         "connection.port", 8080
 *     ));
 *     service.setReferences(References.fromTuples(
 *        new Descriptor("mygroup","controller","default","default","1.0"), controller
 *     ));
 *
 *     service.open("123", (err) => {
 *        console.log("The REST service is running on port 8080");
 *     });
 */
class RestService {
    constructor() {
        /**
         * The dependency resolver.
         */
        this._dependencyResolver = new pip_services_commons_node_3.DependencyResolver(RestService._defaultConfig);
        /**
         * The logger.
         */
        this._logger = new pip_services_components_node_1.CompositeLogger();
        /**
         * The performance counters.
         */
        this._counters = new pip_services_components_node_2.CompositeCounters();
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        config = config.setDefaults(RestService._defaultConfig);
        this._config = config;
        this._dependencyResolver.configure(config);
        this._baseRoute = config.getAsStringWithDefault("base_route", this._baseRoute);
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
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
    /**
     * Unsets (clears) previously set references to dependent components.
     */
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
    /**
     * Adds instrumentation to log calls and measure call time.
     * It returns a Timing object that is used to end the time measurement.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param name              a method name.
     * @returns Timing object to end the time measurement.
     */
    instrument(correlationId, name) {
        this._logger.trace(correlationId, "Executing %s method", name);
        return this._counters.beginTiming(name + ".exec_time");
    }
    /**
     * Checks if the component is opened.
     *
     * @returns true if the component has been opened and false otherwise.
     */
    isOpen() {
        return this._opened;
    }
    /**
     * Opens the component.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
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
    /**
     * Closes component and frees used resources.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
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
    /**
     * Creates a callback function that sends result as JSON object.
     * That callack function call be called directly or passed
     * as a parameter to business logic components.
     *
     * If object is not null it returns 200 status code.
     * For null results it returns 204 status code.
     * If error occur it sends ErrorDescription with approproate status code.
     *
     * @param req       a HTTP request object.
     * @param res       a HTTP response object.
     * @param callback function that receives execution result or error.
     */
    sendResult(req, res) {
        return HttpResponseSender_1.HttpResponseSender.sendResult(req, res);
    }
    /**
     * Creates a callback function that sends newly created object as JSON.
     * That callack function call be called directly or passed
     * as a parameter to business logic components.
     *
     * If object is not null it returns 201 status code.
     * For null results it returns 204 status code.
     * If error occur it sends ErrorDescription with approproate status code.
     *
     * @param req       a HTTP request object.
     * @param res       a HTTP response object.
     * @param callback function that receives execution result or error.
     */
    sendCreatedResult(req, res) {
        return HttpResponseSender_1.HttpResponseSender.sendCreatedResult(req, res);
    }
    /**
     * Creates a callback function that sends deleted object as JSON.
     * That callack function call be called directly or passed
     * as a parameter to business logic components.
     *
     * If object is not null it returns 200 status code.
     * For null results it returns 204 status code.
     * If error occur it sends ErrorDescription with approproate status code.
     *
     * @param req       a HTTP request object.
     * @param res       a HTTP response object.
     * @param callback function that receives execution result or error.
     */
    sendDeletedResult(req, res) {
        return HttpResponseSender_1.HttpResponseSender.sendDeletedResult(req, res);
    }
    /**
     * Sends error serialized as ErrorDescription object
     * and appropriate HTTP status code.
     * If status code is not defined, it uses 500 status code.
     *
     * @param req       a HTTP request object.
     * @param res       a HTTP response object.
     * @param error     an error object to be sent.
     */
    sendError(req, res, error) {
        HttpResponseSender_1.HttpResponseSender.sendError(req, res, error);
    }
    /**
     * Registers a route in HTTP endpoint.
     *
     * @param method        HTTP method: "get", "head", "post", "put", "delete"
     * @param route         a command route. Base route will be added to this route
     * @param schema        a validation schema to validate received parameters.
     * @param action        an action function that is called when operation is invoked.
     */
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
}
RestService._defaultConfig = pip_services_commons_node_2.ConfigParams.fromTuples("base_route", "", "dependencies.endpoint", "*:endpoint:http:*:1.0");
exports.RestService = RestService;
//# sourceMappingURL=RestService.js.map