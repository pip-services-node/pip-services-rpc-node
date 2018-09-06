/** @module services */
import { RestService } from './RestService';
import { ConfigParams } from 'pip-services-commons-node';

/**
 * REST service that can be used for checking whether or not a service is still up and running.
 * 
 * ### Configuration parameters ###
 * 
 * Parameters to pass to the [[configure]] method for component configuration:
 * 
 * - __connection(s)__ - the configuration parameters to use when creating HTTP endpoints;
 *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
 *     - "connection.protocol" - the connection's protocol;
 *     - "connection.host" - the target host;
 *     - "connection.port" - the target port;
 *     - "connection.uri" - the target URI.
 * - "base_route" - this service's base route;
 * - "route" - the service-specific route;
 * - "dependencies" - section that is used to configure this service's dependency resolver. Should contain 
 * locators to dependencies.
 * 
 * ### References ###
 * 
 * A logger, counters, and HTTP endpoint, can be referenced by passing the 
 * following references to the object's [[setReferences]] method:
 * 
 * - logger: <code>"\*:logger:\*:\*:1.0"</code>;
 * - counters: <code>"\*:counters:\*:\*:1.0"</code>;
 * - endpoint: <code>"\*:endpoint:\*:\*:1.0"</code>;
 * - other references that should be set in this object's dependency resolver.
 */
export class HeartbeatRestService extends RestService {
    private _route: string = "heartbeat";

    /**
     * Creates a new HeartbeatRestService object, which can be used for checking whether or not a 
     * service is still up and running.
     */
    public constructor() {
        super();
    }

    /**
     * Configures this service using the given configuration parameters.
     * 
     * __Configuration parameters:__
     * - __connection(s)__ - the configuration parameters to use when creating HTTP endpoints;
     *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
     *     - "connection.protocol" - the connection's protocol;
     *     - "connection.host" - the target host;
     *     - "connection.port" - the target port;
     *     - "connection.uri" - the target URI.
     * - "base_route" - this service's base route;
     * - "route" - the service-specific route;
     * - "dependencies" - section that is used to configure this service's dependency resolver. Should contain 
     * locators to dependencies.
     * 
     * @param config    the configuration parameters to configure this service with.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
    public configure(config: ConfigParams): void {
        super.configure(config);

        this._route = config.getAsStringWithDefault("route", this._route);
    }

    /**
     * Registers the "get" route, which can be used for querying whether or not this service is still 
     * up and running.
     */
    public register(): void {
        this.registerRoute("get", this._route, null, (req, res) => { this.heartbeat(req, res); });
    }

    private heartbeat(req, res): void {
        this.sendResult(req, res)(null, new Date());
    }
}