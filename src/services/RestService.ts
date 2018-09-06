/** @module services */
/** @hidden */
let _ = require('lodash');

import { IOpenable, IUnreferenceable, InvalidStateException } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { DependencyResolver } from 'pip-services-commons-node';
import { CompositeLogger } from 'pip-services-components-node';
import { CompositeCounters } from 'pip-services-components-node';
import { Timing } from 'pip-services-components-node';
import { Schema } from 'pip-services-commons-node';

import { HttpEndpoint } from './HttpEndpoint';
import { IRegisterable } from './IRegisterable';
import { HttpResponseSender } from './HttpResponseSender';

/**
 * Abstract class for implementing RESTful services.
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
 * - "dependencies" - section that is used to configure this service's dependency resolver. Should contain 
 * locators to dependencies.
 * 
 * ### References ###
 * 
 * A logger, counters, and HTTP endpoint can be referenced by passing the 
 * following references to the object's [[setReferences]] method:
 * 
 * - logger: <code>"\*:logger:\*:\*:1.0"</code>;
 * - counters: <code>"\*:counters:\*:\*:1.0"</code>;
 * - endpoint: <code>"\*:endpoint:\*:\*:1.0"</code>;
 * - other references that should be set in this object's dependency resolver.
 */
export abstract class RestService implements IOpenable, IConfigurable, IReferenceable,
    IUnreferenceable, IRegisterable {

    private static readonly _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        "base_route", "",
        "dependencies.endpoint", "pip-services:endpoint:http:*:1.0"
    );

    private _config: ConfigParams;
    private _references: IReferences;
    private _localEndpoint: boolean;
    private _opened: boolean;

    /**
     * The REST service's base route. For example: "v1/demos".
     */
    protected _baseRoute: string;
    /**
     * The REST service's HTTP endpoint.
     */
    protected _endpoint: HttpEndpoint;    
    /**
     * The dependency resolver to use for finding component references.
     */
    protected _dependencyResolver: DependencyResolver = new DependencyResolver(RestService._defaultConfig);
    /**
     * The logger to use for outputting helpful information, regarding this service.
     */
    protected _logger: CompositeLogger = new CompositeLogger();
    /**
     * The service's performance counters.
     */
	protected _counters: CompositeCounters = new CompositeCounters();

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
     * - "dependencies" - section that is used to configure this service's
     * dependency resolver. Should contain locators to dependencies.
     * 
     * @param config    the configuration parameters to configure this service with.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
	public configure(config: ConfigParams): void {
        config = config.setDefaults(RestService._defaultConfig);

        this._config = config;
        this._dependencyResolver.configure(config);

        this._baseRoute = config.getAsStringWithDefault("base_route", this._baseRoute);
	}

    /**
     * Sets references to this service's logger, counters, and HTTP endpoint and adds references 
     * to this object's dependency resolver.
     * 
     * Additionally stores the given references to pass them later on to newly created HTTP endpoints.
     * 
     * __References:__
     * - logger: <code>"\*:logger:\*:\*:1.0"</code>;
     * - counters: <code>"\*:counters:\*:\*:1.0"</code>;
     * - endpoint: <code>"\*:endpoint:\*:\*:1.0"</code>;
     * - other references that should be set in this object's dependency resolver.
     * 
     * @param references    an IReferences object, containing references to a logger, counters, an HTTP endpoint, 
     *                      the references to set in the dependency resolver, and the references to use for endpoint 
     *                      creation.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/refer.ireferences.html IReferences]] (in the PipServices "Commons" package)
     */
	public setReferences(references: IReferences): void {
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
        } else {
            this._localEndpoint = false;
        }
        // Add registration callback to the endpoint
        this._endpoint.register(this);
    }
    
    /**
     * Remove the endpoint that this object references and removes 
     * the registration callback from the endpoint.
     * 
     * Needed when using a dynamic endpoint discovery service.
     */
    public unsetReferences(): void {
        // Remove registration callback from endpoint
        if (this._endpoint != null) {
            this._endpoint.unregister(this);
            this._endpoint = null;
        }
    }

    private createEndpoint(): HttpEndpoint {
        let endpoint = new HttpEndpoint();
        
        if (this._config)
            endpoint.configure(this._config);
        
        if (this._references)
            endpoint.setReferences(this._references);
            
        return endpoint;
    }

    /**
     * Starts a Timing for the method with the given name. Does not call the method itself and is 
     * used only as an instrument to measure execution time.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param name              the name of the method call that is to be timed.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/count.timing.html Timing]]
     */
	protected instrument(correlationId: string, name: string): Timing {
		this._logger.trace(correlationId, "Executing %s method", name);
		return this._counters.beginTiming(name + ".exec_time");
	}

    /**
     * @returns whether or not this service is currently open.
     */
	public isOpen(): boolean {
		return this._opened;
	}
    
    /**
     * Opens this service by making sure that an HTTP endpoint is set. If one was not referenced earlier, 
     * a local endpoint will be created using the configuration parameters and references that were passed 
     * to this object's [[configure]] and [[setReferences]] methods.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once the connection has been opened.
     *                          Will be called with an error, if one is raised.
     * 
     * @see [[HttpEndpoint]]
     * @see [[configure]]
     * @see [[setReferences]]
     */
	public open(correlationId: string, callback?: (err: any) => void): void {
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
        } else {
            this._opened = true;
            callback(null);
        }
    }

    //TODO (note for Sergey): callback is optional, but error is not thrown...
    /**
     * Closes this service by closing its HTTP endpoint (if the endpoint is a local endpoint).
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once disconnected from the MongoDB server. 
     *                          Will be called with an error if one is raised.
     */
    public close(correlationId: string, callback?: (err: any) => void): void {
    	if (!this._opened) {
            callback(null);
            return;
        }

        if (this._endpoint == null) {
            callback(new InvalidStateException(correlationId, 'NO_ENDPOINT', 'HTTP endpoint is missing'));
            return;
        }
        
        if (this._localEndpoint) {
            this._endpoint.close(correlationId, (err) => {
                this._opened = false;
                callback(err);
            });
        } else {
            this._opened = false;
            callback(null);
        }
    }

    /**
     * Sends the result of the given request.
     * 
     * @param req       the request.
     * @param res       the request's result.
     */
    protected sendResult(req, res): (err: any, result: any) => void {
        return HttpResponseSender.sendResult(req, res);
    }

    /**
     * Sends a response, indicating that the request has been fulfilled, resulting in 
     * the creation of a new resource (HTTP result code 201 - Created).
     * 
     * @param req       the request.
     * @param res       the request's result.
     */
    protected sendCreatedResult(req, res): (err: any, result: any) => void {
        return HttpResponseSender.sendCreatedResult(req, res);
    }

    //TODO (note for Sergey): didn't find any mention of a 2xx HTTP code for deletion...
    /**
     * Sends a response, indicating that the request has been fulfilled, resulting in 
     * the deletion of a resource
     * 
     * @param req       the request.
     * @param res       the request's result.
     */
    protected sendDeletedResult(req, res): (err: any, result: any) => void {
        return HttpResponseSender.sendDeletedResult(req, res);
    }

    /**
     * Sends an HTTP error response.
     * 
     * @param req       the request.
     * @param res       the request's result.
     * @param error     the error that was raised.
     */
    protected sendError(req, res, error): void {
        HttpResponseSender.sendError(req, res, error);
    }

    /**
     * Registers an action in this objects REST server (service) by the given method and route.
     * 
     * @param method        the HTTP method of the route.
     * @param route         the route to register in this object's REST server (service). If a 
     *                      base 
     * @param schema        the schema to use for parameter validation.
     * @param action        the action to perform at the given route.
     */
    protected registerRoute(method: string, route: string, schema: Schema,
        action: (req: any, res: any) => void): void {
        if (this._endpoint == null) return;

        if (this._baseRoute != null && this._baseRoute.length > 0) {
            let baseRoute = this._baseRoute;
            if (baseRoute[0] != '/') baseRoute = '/' + baseRoute;
            route = baseRoute + route;
        }

        this._endpoint.registerRoute(
            method, route, schema,
            (req, res) => {
                action.call(this, req, res);
            }
        );
    }    
    
    public register(): void {}

}