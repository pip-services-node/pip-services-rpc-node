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

    protected _baseRoute: string;
    protected _endpoint: HttpEndpoint;    
    protected _dependencyResolver: DependencyResolver = new DependencyResolver(RestService._defaultConfig);
	protected _logger: CompositeLogger = new CompositeLogger();
	protected _counters: CompositeCounters = new CompositeCounters();

	public configure(config: ConfigParams): void {
        config = config.setDefaults(RestService._defaultConfig);

        this._config = config;
        this._dependencyResolver.configure(config);

        this._baseRoute = config.getAsStringWithDefault("base_route", this._baseRoute);
	}
		
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

	protected instrument(correlationId: string, name: string): Timing {
		this._logger.trace(correlationId, "Executing %s method", name);
		return this._counters.beginTiming(name + ".exec_time");
	}

	public isOpened(): boolean {
		return this._opened;
	}
	
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

    protected sendResult(req, res): (err: any, result: any) => void {
        return HttpResponseSender.sendResult(req, res);
    }

    protected sendCreatedResult(req, res): (err: any, result: any) => void {
        return HttpResponseSender.sendCreatedResult(req, res);
    }

    protected sendDeletedResult(req, res): (err: any, result: any) => void {
        return HttpResponseSender.sendDeletedResult(req, res);
    }

    protected sendError(req, res, error): void {
        HttpResponseSender.sendError(req, res, error);
    }

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