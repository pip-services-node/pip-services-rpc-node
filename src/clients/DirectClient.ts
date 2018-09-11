/** @module clients */
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

/**
 * Abstract class that can be used for creating Direct clients. Direct clients are clients that 
 * are written in the same language as the service that is being called, which allows the client 
 * to call the controller's methods directly.
 * 
 * Performance counters and a logger can be referenced from a DirectClient for added functionality. 
 * A "counters" reference must be set to use the [[instrument]] method, which times method execution.
 * 
 * ### Configuration parameters ###
 * 
 * - "dependencies" - section that is used to configure this service's dependency resolver. Should contain 
 * locators to dependencies.
 * 
 * 
 * ### References ###
 * 
 * A logger, counters, and a controller can be referenced by passing the 
 * following references to the object's [[setReferences]] method:
 * 
 * - logger: <code>"\*:logger:\*:\*:1.0"</code>;
 * - counters: <code>"\*:counters:\*:\*:1.0"</code>;
 * - controller: <code>"\*:controller:\*:\*:1.0"</code>;
 * - other references that should be set in this object's dependency resolver.
 * 
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/log.compositelogger.html CompositeLogger]] (in the PipServices "Components" package)
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/count.compositecounters.html CompositeCounters]] (in the PipServices "Components" package)
 * 
 * ### Examples ###
 * 
 *     export class MyDataDirectClient extends DirectClient<IMyDataController> implements IMyDataClient{
 *         public constructor() {
 *             super();
 *             this._dependencyResolver.put('controller', new Descriptor("pip-services-mydata", "controller", "*", "*", "*"))
 *         }
 *         ...
 * 
 *         public getDummyById(correlationId: string, myDataId: string, callback: (err: any, result: MyData) => void): void {
 *             let timing = this.instrument(correlationId, 'mydata.get_one_by_id');
 *             this._controller.getOneById(
 *                 correlationId,
 *                 myDataId, 
 *                 (err, result) => {
 *                     timing.endTiming();
 *                     callback(err, result);
 *                 }
 *             );        
 *         }
 *         ...
 *     }
 */
export abstract class DirectClient<T> implements IConfigurable, IReferenceable, IOpenable {
    /** 
     * The referenced controller that is to be called directly. 
     */
    protected _controller: T;
    /** 
     * Stores information about whether or not the client was opened. 
     */
    protected _opened: boolean = true;
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
    /** 
     * The DependencyResolver that is referenced by this object. 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/refer.dependencyresolver.html DependencyResolver]]
     */
    protected _dependencyResolver: DependencyResolver = new DependencyResolver();
            
    /**
     * Creates a new DirectClient. Use [[configure]] and [[setReferences]] to 
     * set dependencies and references.
     */
    public constructor() {
        this._dependencyResolver.put('controller', 'none');
    }

    /**
     * Configures this DirectClient using the given configuration parameters.
     * 
     * __Configuration parameters:__
     * - "dependencies" - section that is used to configure this DirectClient's
     * dependency resolver. Should contain locators to dependencies.
     * 
     * @param config    the configuration parameters to configure this DirectClient with.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
    public configure(config: ConfigParams): void {
        this._dependencyResolver.configure(config);
    }

    /**
     * Sets references to this Direct client's logger, counters, and controller and adds references 
     * to this object's dependency resolver.
     * 
     * __References:__
     * - logger: <code>"\*:logger:\*:\*:1.0"</code>;
     * - counters: <code>"\*:counters:\*:\*:1.0"</code>;
     * - controller: <code>"\*:controller:\*:\*:1.0"</code>;
     * - other references that should be set in this object's dependency resolver.
     * 
     * @param references    an IReferences object, containing references to a logger, counters, 
     *                      a controller, and the references that should be set in this object's 
     *                      dependency resolver.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/refer.ireferences.html IReferences]] (in the PipServices "Commons" package)
     */
	public setReferences(references: IReferences): void {
		this._logger.setReferences(references);
		this._counters.setReferences(references);
        this._dependencyResolver.setReferences(references);
        this._controller = this._dependencyResolver.getOneRequired<T>('controller');
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
     * @returns whether or not this client is currently open.
     */
	public isOpen(): boolean {
        return this._opened;
    }
    
    /**
     * Opens this Direct client. For a Direct client to be successfully opened, a reference to a 
     * controller must be set.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once the opening process is
     *                          complete. Will be called with an error if no contoller is referenced.
     * 
     * @see [[setReferences]]
     */
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

    /**
     * Closes this Direct client.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          (optional) the function to call once the closing process is
     *                          complete.
     */
    public close(correlationId: string, callback?: (err: any) => void): void {
        if (this._opened)
            this._logger.info(correlationId, "Closed direct client");

        this._opened = false;

        callback(null);
    }

}