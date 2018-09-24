"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module services */
const RestService_1 = require("./RestService");
/**
 * Service returns heartbeat via HTTP/REST protocol.
 *
 * The service responds on /heartbeat route (can be changed)
 * with a string with the current time in UTC.
 *
 * This service route can be used to health checks by loadbalancers and
 * container orchestrators.
 *
 * ### Configuration parameters ###
 *
 * base_route:              base route for remote URI (default: "")
 * route:                   route to heartbeat operation (default: "heartbeat")
 * dependencies:
 *   endpoint:              override for HTTP Endpoint dependency
 * connection(s):
 *   discovery_key:         (optional) a key to retrieve the connection from IDiscovery
 *   protocol:              connection protocol: http or https
 *   host:                  host name or IP address
 *   port:                  port number
 *   uri:                   resource URI or connection string with all parameters in it
 *
 * ### References ###
 *
 * - *:logger:*:*:1.0               (optional) ILogger components to pass log messages
 * - *:counters:*:*:1.0             (optional) ICounters components to pass collected measurements
 * - *:discovery:*:*:1.0            (optional) IDiscovery services to resolve connection
 * - *:endpoint:http:*:1.0          (optional) [[HttpEndpoint]] reference
 *
 * @see [[RestService]]
 * @see [[RestClient]]
 *
 * ### Example ###
 *
 * let service = new HeartbeatService();
 * service.configure(ConfigParams.fromTuples(
 *     "route", "ping",
 *     "connection.protocol", "http",
 *     "connection.host", "localhost",
 *     "connection.port", 8080
 * ));
 *
 * service.open("123", (err) => {
 *    console.log("The Heartbeat service is accessible at http://+:8080/ping");
 * });
 */
class HeartbeatRestService extends RestService_1.RestService {
    /**
     * Creates a new instance of this service.
     */
    constructor() {
        super();
        this._route = "heartbeat";
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        super.configure(config);
        this._route = config.getAsStringWithDefault("route", this._route);
    }
    /**
     * Registers all service routes in HTTP endpoint.
     */
    register() {
        this.registerRoute("get", this._route, null, (req, res) => { this.heartbeat(req, res); });
    }
    /**
     * Handles heartbeat requests
     *
     * @param req   an HTTP request
     * @param res   an HTTP response
     */
    heartbeat(req, res) {
        this.sendResult(req, res)(null, new Date());
    }
}
exports.HeartbeatRestService = HeartbeatRestService;
//# sourceMappingURL=HeartbeatRestService.js.map