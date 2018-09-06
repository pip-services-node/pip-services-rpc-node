/** @module services */
/** @hidden */
let _ = require('lodash');

import { IOpenable } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { CompositeLogger } from 'pip-services-components-node';
import { CompositeCounters } from 'pip-services-components-node';
import { ConnectionException } from 'pip-services-commons-node';
import { Schema } from 'pip-services-commons-node';

import { HttpResponseSender } from './HttpResponseSender';
import { HttpConnectionResolver } from '../connect/HttpConnectionResolver';
import { IRegisterable } from './IRegisterable';

/**
 * Used for creating HTTP endpoints. An endpoint is a URL, at which a given service can be accessed by a client. 
 * 
 * ### Configuration parameters ###
 * 
 * Parameters to pass to the [[configure]] method for component configuration:
 * 
 * - __connection(s)__ - the connection resolver's connections;
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
 */
export class HttpEndpoint implements IOpenable, IConfigurable, IReferenceable {

    private static readonly _defaultConfig: ConfigParams = ConfigParams.fromTuples(
        "connection.protocol", "http",
        "connection.host", "0.0.0.0",
        "connection.port", 3000,

        "options.request_max_size", 1024*1024,
        "options.connect_timeout", 60000,
        "options.debug", true
    );

	private _server: any;
	private _connectionResolver: HttpConnectionResolver = new HttpConnectionResolver();
	private _logger: CompositeLogger = new CompositeLogger();
	private _counters: CompositeCounters = new CompositeCounters();
    private _uri: string;
    private _registrations: IRegisterable[] = [];
    
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
	public configure(config: ConfigParams): void {
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
	public setReferences(references: IReferences): void {
		this._logger.setReferences(references);
		this._counters.setReferences(references);
		this._connectionResolver.setReferences(references);
	}

    /**
     * @returns whether or not this endpoint is open with an actively listening REST server.
     */
	public isOpen(): boolean {
		return this._server != null;
	}
    
    //TODO: check for correct understanding.
    /**
     * Opens a connection using the parameters resolved by the referenced connection
     * resolver and creates a REST server (service) using the set options and parameters.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once the opening process is complete.
     *                          Will be called with an error if one is raised.
     */
	public open(correlationId: string, callback?: (err: any) => void): void {
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

                this._server.listen(
                    connection.getPort(), 
                    connection.getHost(),
                    (err) => {
                        if (err == null) {
                            // Register the service URI
                            this._connectionResolver.register(correlationId, (err) => {
                                this._logger.debug(correlationId, "Opened REST service at %s", this._uri);
                                
                                if (callback) callback(err);
                            });
                        } else {
                            // Todo: Hack!!!
                            console.error(err);

                            err = new ConnectionException(correlationId, "CANNOT_CONNECT", "Opening REST service failed")
                                .wrap(err).withDetails("url", this._uri);

                            if (callback) callback(err);
                        }
                    }
                );
            } catch (ex) {
                this._server = null;
                let err = new ConnectionException(correlationId, "CANNOT_CONNECT", "Opening REST service failed")
                    .wrap(ex).withDetails("url", this._uri);
                if (callback) callback(err);
            }
        });
		
    }

    /**
     * Closes this endpoint and the REST server (service) that was opened earlier.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once the closing process is complete.
     *                          Will be called with an error if one is raised.
     */
    public close(correlationId: string, callback?: (err: any) => void): void {
        if (this._server != null) {
            // Eat exceptions
            try {
                this._server.close();
                this._logger.debug(correlationId, "Closed REST service at %s", this._uri);
            } catch (ex) {
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
    public register(registration: IRegisterable): void {
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
    public unregister(registration: IRegisterable): void {
        this._registrations = _.remove(this._registrations, r => r == registration);
    }

    private performRegistrations(): void {
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
    public registerRoute(method: string, route: string, schema: Schema,
        action: (req: any, res: any) => void): void {
        method = method.toLowerCase();
        if (method == 'delete') method = 'del';

        // Hack!!! Wrapping action to preserve prototyping context
        let actionCurl = (req, res) => { 
            // Perform validation
            if (schema != null) {
                let params = _.extend({}, req.params, { body: req.body });
                let correlationId = params.correlaton_id;
                let err = schema.validateAndReturnException(correlationId, params, false);
                if (err != null) {
                    HttpResponseSender.sendError(req, res, err);
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