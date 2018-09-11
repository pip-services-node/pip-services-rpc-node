/** @module clients */
/** @hidden */
let _ = require('lodash');
/** @hidden */
let querystring = require('querystring');

import { IOpenable } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { CompositeLogger } from 'pip-services-components-node';
import { CompositeCounters } from 'pip-services-components-node';
import { Timing } from 'pip-services-components-node';
import { ApplicationExceptionFactory } from 'pip-services-commons-node';
import { ConnectionException } from 'pip-services-commons-node';
import { UnknownException } from 'pip-services-commons-node';

import { HttpConnectionResolver } from '../connect/HttpConnectionResolver';

//TODO: did I use "REST API" appropriately (above protected methods)?
/**
 * Abstract class that can be used for creating RESTful clients. REST clients are typically used when 
 * there exists a necessity to call services that are written in various diffent langauges. Since direct 
 * method calls to the service's controller are not possible, REST is used for "message transfer" calls, 
 * which can be received by a [[CommandableHttpService]] and converted to the service's native method calls.
 * 
 * Performance counters and a logger can be referenced from a REST client for added functionality. 
 * A "counters" reference must be set to use the [[instrument]] method, which times method execution.
 * 
 * 
 * ### Configuration parameters ###
 * 
 * Parameters to pass to the [[configure]] method for component configuration:
 * 
 * - "base_route" - the base route;
 * - __connection(s)__ - the connection resolver's connections;
 *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
 *     - "connection.protocol" - the connection's protocol;
 *     - "connection.host" - the target host;
 *     - "connection.port" - the target port;
 *     - "connection.uri" - the target URI.
 * - __options__
 *     - "options.retries" - the retry limit (default is 3);
 *     - "options.connect_timeout" - the connection attempt's timeout (default is 10000);
 *     - "options.timeout" - the connection's timeout (default is 10000).
 * 
 * ### References ###
 * 
 * A logger, counters, and a connection resolver can be referenced by passing the 
 * following references to the object's [[setReferences]] method:
 * 
 * - logger: <code>"\*:logger:\*:\*:1.0"</code>
 * - counters: <code>"\*:counters:\*:\*:1.0"</code>
 * - discovery: <code>"\*:discovery:\*:\*:1.0"</code> (for the connection resolver)
 * 
 * @see [[CommandableHttpService]]
 * 
 * ### Examples ###
 * 
 *     export class MyHttpClient extends RestClient {
 *         ...
 * 
 *         public callCommand(name: string, correlationId: string, params: any, 
 *                 callback: (err: any, result: any) => void): void {
 *             let timing = this.instrument(correlationId, this._baseRoute + '.' + name);
 *             this.call('post', name, correlationId, 
 *                 {}, params || {},
 *                 (err, result) => {
 *                     timing.endTiming();
 *                     if (callback) callback(err, result);
 *                 });
 *         }
 *         ...
 *     }
 */
export abstract class RestClient implements IOpenable, IConfigurable, IReferenceable {

    private static readonly _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        "connection.protocol", "http",
        "connection.host", "0.0.0.0",
        "connection.port", 3000,

        "options.request_max_size", 1024*1024,
        "options.connect_timeout", 10000,
        "options.timeout", 10000,
        "options.retries", 3,
        "options.debug", true
    );

    /**
     * The REST client to use for remote procedure calling.
     */
    protected _client: any;
    /**
     * The connection resolver that is referenced by this object. 
     * Resolves the ConnectionParams that are to be used.
     * @see [[HttpConnectionResolver]]
     */
    protected _connectionResolver: HttpConnectionResolver = new HttpConnectionResolver();
    /** 
     * The logger that is referenced by this object.
     * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/log.compositelogger.html CompositeLogger]] (in the PipServices "Components" package)
     */
    protected _logger: CompositeLogger = new CompositeLogger();
    /** 
     * The performance counters that are referenced by this object.
     * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/count.compositecounters.html CompositeCounters]]
     */
    protected _counters: CompositeCounters = new CompositeCounters();
    /** This REST client's options. Set during [[configure configuration]]. */
    protected _options: ConfigParams = new ConfigParams();
    /** The base route to use for calling methods. For example "/quotes". */
    protected _baseRoute: string;
    /** The number of retry attempts. */
    protected _retries: number = 1;
    /** The REST headers to use. */
    protected _headers: any = {};
    /** The connection's timeout interval. */
    protected _connectTimeout: number = 10000;
    /** The request's timeout interval. */
    protected _timeout: number = 10000;
    /** The remote commandable service's URI. */
	protected _uri: string;

    /**
     * Sets references to this REST client's logger, counters, and connection resolver.
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
	public setReferences(references: IReferences): void {
		this._logger.setReferences(references);
		this._counters.setReferences(references);
		this._connectionResolver.setReferences(references);
	}

    //TODO: check - did I miss any defaults?
    /**
     * Configures this REST client using the given configuration parameters.
     * 
     * __Configuration parameters:__
     * - "base_route" - the base route;
     * - __connection(s)__ - the connection resolver's connections;
     *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
     *     - "connection.protocol" - the connection's protocol;
     *     - "connection.host" - the target host;
     *     - "connection.port" - the target port;
     *     - "connection.uri" - the target URI.
     * - __options__
     *     - "options.retries" - the retry limit (default is 3);
     *     - "options.connect_timeout" - the connection attempt's timeout (default is 10000);
     *     - "options.timeout" - the connection's timeout (default is 10000).
     * 
     * @param config    the configuration parameters to configure this REST client with.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
	public configure(config: ConfigParams): void {
		config = config.setDefaults(RestClient._defaultConfig);
		this._connectionResolver.configure(config);
        this._options = this._options.override(config.getSection("options"));

        this._retries = config.getAsIntegerWithDefault("options.retries", this._retries);
        this._connectTimeout = config.getAsIntegerWithDefault("options.connect_timeout", this._connectTimeout);
        this._timeout = config.getAsIntegerWithDefault("options.timeout", this._timeout);

        this._baseRoute = config.getAsStringWithDefault("base_route", this._baseRoute);
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
		return this._counters.beginTiming(name + ".call_time");
	}

    /**
     * @returns whether no not this object is currently open 
     *          (has a set client).
     */
	public isOpen(): boolean {
		return this._client != null;
	}
    
    /**
     * Opens a connection to the REST service that is resolved by the referenced connection
     * resolver and creates a REST client for this object using the set options and parameters.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          the function to call once the opening process is complete.
     *                          Will be called with an error if one is raised.
     */
	public open(correlationId: string, callback?: (err: any) => void): void {
        if (this.isOpen()) {
            if (callback) callback(null);
            return;
        }
    	
		this._connectionResolver.resolve(correlationId, (err, connection) => {
            if (err) {
                if (callback) callback(err);
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
                
                if (callback) callback(null);
            } catch (err) {
                this._client = null;            
                let ex = new ConnectionException(correlationId, "CANNOT_CONNECT", "Connection to REST service failed")
                    .wrap(err).withDetails("url", this._uri);
                if (callback) callback(ex);
            }
        });
		
    }

    /**
     * Closes this object by unsetting the REST client and the URI.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          the function to call once the closing process is complete.
     *                          Will be called with an error if one is raised.
     */
    public close(correlationId: string, callback?: (err: any) => void): void {
        if (this._client != null) {
            // Eat exceptions
            try {
                this._logger.debug(correlationId, "Closed REST service at %s", this._uri);
            } catch (ex) {
                this._logger.warn(correlationId, "Failed while closing REST service: %s", ex);
            }

            this._client = null;
            this._uri = null;
        }

        if (callback) callback(null);
    }

    /**
     * Adds a correlation id to a method call's parameters before sending them to 
     * another service over the REST API.
     * 
     * @param params            the method call parameters to add a correlation id to.
     * @param correlationId     unique business transaction id to trace calls across components.
     * @returns parameters with an added correlation id.
     */
    protected addCorrelationId(params: any, correlationId: string): any {
        // Automatically generate short ids for now
        if (correlationId == null)
            //correlationId = IdGenerator.nextShort();
            return params;

        params = params || {};
        params.correlation_id = correlationId;
        return params;
    }

    /**
     * Adds filter parameters to a method call's parameters before sending them to 
     * another service over the REST API.
     * 
     * @param params        the method call parameters to add a correlation id to.
     * @param filter        the object, whose properties are to be added to the 
     *                      method call parameters for filtering results.
     * @returns parameters with added filter parameters.
     */
    protected addFilterParams(params: any, filter: any): void {
        params = params || {};

        if (filter) {       
            for (let prop in filter) {
                if (filter.hasOwnProperty(prop))
                    params[prop] = filter[prop];
            }
        }

        return params;
    }

    /**
     * Adds paging parameters to a method call's parameters before sending them to 
     * another service over the REST API.
     * 
     * @param params        the method call parameters to add a correlation id to.
     * @param paging        paging parameters, containing "total", "skip", and/or 
     *                      "take" properties.
     * @returns parameters with added paging parameters.
     */
    protected addPagingParams(params: any, paging: any): void {
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

    /**
     * Creates a request route using the set base route and the given command's
     * route.
     * 
     * @param route     the route to the target command (without a base route, 
     *                  for example: "get_random_quote").
     * @returns the created request route. Example request route: "/quotes/get_random_quote".
     */
    private createRequestRoute(route: string): string {
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

    //TODO: I didn't quite understand what the "callback.call" with 3x parameters does.
    /**
     * Calls a remote service's method using the given method, the resolved URI, 
     * the set base path, the given route, and the parameters and/or data that was 
     * passed.
     * 
     * @param method            the HTTP method to use ("get", "head", "post", "put", "delete").
     * @param route             the route to the target command (without a base route, 
     *                          for example: "get_random_quote").
     * @param correlationId     (optional) unique business transaction id to trace calls across components.
     * @param params            the parameters to pass to the called method.
     * @param data              (optional) the data to pass to the called method. If a function is passed, 
     *                          it will be called with the result, instead of the callback.
     * @param callback          (optional) the function to call with the result of the execution 
     *                          (or with an error, if one is raised). If omitted - errors will be 
     *                          thrown instead.
     * 
     * @throws an [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/errors.unknownexception.html UnknownException]] 
     *          if an unknown <code>method</code> is given.
     */
    protected call(method: string, route: string, correlationId?: string, params: any = {}, data?: any, 
        callback?: (err: any, result: any) => void): void {
        
        method = method.toLowerCase();
                
        if (_.isFunction(data)) {
            callback = data;
            data = {};
        }

        route = this.createRequestRoute(route);

        params = this.addCorrelationId(params, correlationId)
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
                        err = ApplicationExceptionFactory.create(data).withCause(err);
                    callback.call(self, err, null);  
                }
            };
        }
        
        if (method == 'get') this._client.get(route, action);
        else if (method == 'head') this._client.head(route, action);
        else if (method == 'post') this._client.post(route, data, action);
        else if (method == 'put') this._client.put(route, data, action);
        else if (method == 'delete') this._client.del(route, action);
        else {
            let error = new UnknownException(correlationId, 'UNSUPPORTED_METHOD', 'Method is not supported by REST client')
                .withDetails('verb', method);

            if (callback) callback(error, null)
            else throw error;
        }
    }    

}