let _ = require('lodash');
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

	protected _client: any;
	protected _connectionResolver: HttpConnectionResolver = new HttpConnectionResolver();
	protected _logger: CompositeLogger = new CompositeLogger();
	protected _counters: CompositeCounters = new CompositeCounters();
    protected _options: ConfigParams = new ConfigParams();
    protected _baseRoute: string;
    protected _retries: number = 1;
    protected _headers: any = {};
    protected _connectTimeout: number = 10000;
    protected _timeout: number = 10000;

	protected _uri: string;

	public setReferences(references: IReferences): void {
		this._logger.setReferences(references);
		this._counters.setReferences(references);
		this._connectionResolver.setReferences(references);
	}

	public configure(config: ConfigParams): void {
		config = config.setDefaults(RestClient._defaultConfig);
		this._connectionResolver.configure(config);
        this._options = this._options.override(config.getSection("options"));

        this._retries = config.getAsIntegerWithDefault("options.retries", this._retries);
        this._connectTimeout = config.getAsIntegerWithDefault("options.connect_timeout", this._connectTimeout);
        this._timeout = config.getAsIntegerWithDefault("options.timeout", this._timeout);

        this._baseRoute = config.getAsStringWithDefault("base_route", this._baseRoute);
	}
		
	protected instrument(correlationId: string, name: string): Timing {
		this._logger.trace(correlationId, "Executing %s method", name);
		return this._counters.beginTiming(name + ".call_time");
	}

	public isOpen(): boolean {
		return this._client != null;
	}
	
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

    protected addCorrelationId(params: any, correlationId: string): any {
        // Automatically generate short ids for now
        if (correlationId == null)
            //correlationId = IdGenerator.nextShort();
            return params;

        params = params || {};
        params.correlation_id = correlationId;
        return params;
    }

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