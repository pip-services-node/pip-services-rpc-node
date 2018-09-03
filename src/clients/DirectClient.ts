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
 * A Direct client's references can be set using the [[setReferences]] method, which searchs for and
 * sets references to "logger", "counters", and "controller" components, and sets the dependency resolver's
 * references as well.
 * 
 * Configuration of a Direct clients boils down to the configuration of its dependency resolver, which can 
 * be done by passing configuration parameters with a "dependencies" section to the [[configure]] method.
 * 
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/log.compositelogger.html CompositeLogger]] (in the PipServices "Components" package)
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/count.compositecounters.html CompositeCounters]] (in the PipServices "Components" package)
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
	 * Configures this DirectClient by searching for a "dependencies" section (which should contain 
     * locators to dependencies) and setting dependencies.
	 * 
	 * @param config 	configuration parameters, containing a "dependencies" section.
	 * 
	 * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
	 */
    public configure(config: ConfigParams): void {
        this._dependencyResolver.configure(config);
    }

    /**
     * Sets references to this Direct client's logger, counters, dependency resolver, and controller.
     * 
     * @param references    an IReferences object, containing "logger", "counters", and "controller" references, 
     *                      as well as the references to set for the dependency resolver.
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