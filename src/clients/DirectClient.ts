import { IOpenable } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { DependencyResolver } from 'pip-services-commons-node';
import { CompositeLogger } from 'pip-services-components-node';
import { CompositeCounters } from 'pip-services-components-node';
import { ConfigParams } from 'pip-services-commons-node';
import { Timing } from 'pip-services-components-node';
import { ConnectionException } from 'pip-services-commons-node';

export abstract class DirectClient<T> implements IConfigurable, IReferenceable, IOpenable {
    protected _controller: T;
    protected _opened: boolean = true;
	protected _logger: CompositeLogger = new CompositeLogger();
	protected _counters: CompositeCounters = new CompositeCounters();
    protected _dependencyResolver: DependencyResolver = new DependencyResolver();
            
    public constructor() {
        this._dependencyResolver.put('controller', 'none');
    }

    public configure(config: ConfigParams): void {
        this._dependencyResolver.configure(config);
    }

	public setReferences(references: IReferences): void {
		this._logger.setReferences(references);
		this._counters.setReferences(references);
        this._dependencyResolver.setReferences(references);
        this._controller = this._dependencyResolver.getOneRequired<T>('controller');
	}
		
	protected instrument(correlationId: string, name: string): Timing {
		this._logger.trace(correlationId, "Executing %s method", name);
		return this._counters.beginTiming(name + ".call_time");
	}

	public isOpen(): boolean {
        return this._opened;
    }
	
	public open(correlationId: string, callback?: (err: any) => void): void {
        if (this._opened) {
            callback(null);
            return;
        }
    	
        if (this._controller == null) {
            let err = new ConnectionException(correlationId, 'NO_CONTROLLER', 'Controller reference is missing');
            if (callback) {
                callback(err);
                return;
            } else {
                throw err;
            }
        } 

        this._opened = true;

        this._logger.info(correlationId, "Opened direct client");
        callback(null);
    }

    public close(correlationId: string, callback?: (err: any) => void): void {
        if (this._opened)
            this._logger.info(correlationId, "Closed direct client");

        this._opened = false;

        callback(null);
    }

}