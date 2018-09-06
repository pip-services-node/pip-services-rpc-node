/** @module services */
import { ContextInfo } from 'pip-services-components-node';
import { Descriptor } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { StringConverter } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';

import { RestService } from './RestService';

/**
 * REST service that can be used for checking the status of a service.
 * 
 * A service's status consists of:
 * - the component locators that were set using this class's [[setReferences]] method
 * - the service's ID
 * - the service's name
 * - the service's description
 * - the service's start time
 * - the current time
 * - the service's uptime
 * - the service's properties
 * - the service's components
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
 * - "dependencies" - section that is used to configure this service's
 * dependency resolver. Should contain locators to dependencies.
 * 
 * ### References ###
 * 
 * A logger, counters, HTTP endpoint, and context info can be referenced by 
 * passing the following references to the object's [[setReferences]] method:
 * 
 * - logger: <code>"\*:logger:\*:\*:1.0"</code>;
 * - counters: <code>"\*:counters:\*:\*:1.0"</code>;
 * - endpoint: <code>"\*:endpoint:\*:\*:1.0"</code>;
 * - context info: <code>"\*:context-info:\*:\*:1.0"</code>;
 * - other references that should be set in this object's dependency resolver.
 */
export class StatusRestService extends RestService {
    private _startTime: Date = new Date();
    private _references2: IReferences;
    private _contextInfo: ContextInfo;
    private _route: string = "status";

    /**
     * Creates a new StatusRestService object and adds a "default" "context-info" reference 
     * to this object. Use [[setReferences]] to change the "context-info" reference.
     */
    public constructor() {
        super();
        this._dependencyResolver.put("context-info", new Descriptor("pip-services", "context-info", "default", "*", "1.0"));
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
     * - "dependencies" - section that is used to configure this service's
     * dependency resolver. Should contain locators to dependencies.
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
     * Sets references to this service's logger, counters, HTTP endpoint, and context info and adds references 
     * to this object's dependency resolver.
     * 
     * Additionally stores the given references to pass them later on to newly created HTTP endpoints.
     * 
     * __References:__
     * - logger: <code>"\*:logger:\*:\*:1.0"</code>;
     * - counters: <code>"\*:counters:\*:\*:1.0"</code>;
     * - endpoint: <code>"\*:endpoint:\*:\*:1.0"</code>;
     * - context info: <code>"\*:context-info:\*:\*:1.0"</code>;
     * - other references that should be set in this object's dependency resolver.
     * 
     * @param references    an IReferences object, containing references to a logger, counters, an HTTP endpoint,
     *                      the context info, the references to set in the dependency resolver, and the references 
     *                      to use for endpoint creation.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/refer.ireferences.html IReferences]] (in the PipServices "Commons" package)
     */
    public setReferences(references: IReferences): void {
        this._references2 = references;
        super.setReferences(references);

        this._contextInfo = this._dependencyResolver.getOneOptional<ContextInfo>("context-info");
    }

    /**
     * Registers the "get" route, which can be used to query this service's status.
     */
    public register(): void {
        this.registerRoute("get", this._route, null, (req, res) => { this.status(req, res); });
    }

    private status(req, res): void {
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

        let status =  {
            id: id,
            name: name,
            description: description,
            start_time: StringConverter.toString(this._startTime),
            current_time: StringConverter.toString(new Date()),
            uptime: uptime,
            properties: properties,
            components: components
        };

        this.sendResult(req, res)(null, status);
    }
}