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
    

	public configure(config: ConfigParams): void {
		config = config.setDefaults(HttpEndpoint._defaultConfig);
		this._connectionResolver.configure(config);
	}
		
	public setReferences(references: IReferences): void {
		this._logger.setReferences(references);
		this._counters.setReferences(references);
		this._connectionResolver.setReferences(references);
	}

	public isOpen(): boolean {
		return this._server != null;
	}
	
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

    public register(registration: IRegisterable): void {
        this._registrations.push(registration);
    }

    public unregister(registration: IRegisterable): void {
        this._registrations = _.remove(this._registrations, r => r == registration);
    }

    private performRegistrations(): void {
        for (let registration of this._registrations) {
            registration.register();
        }
    }

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