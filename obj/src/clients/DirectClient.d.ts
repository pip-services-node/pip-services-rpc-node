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
/**
 * Abstract client that calls controller directly in the same memory space.
 *
 * It is used when multiple microservices are deployed in a single container (monolyth)
 * and communication between them can be done by direct calls rather then through
 * the network.
 *
 * ### Configuration parameters ###
 *
 * dependencies:
 *   controller:            override controller descriptor
 *
 * ### References ###
 *
 * - *:logger:*:*:1.0         (optional) [[ILogger]] components to pass log messages
 * - *:counters:*:*:1.0       (optional) [[ICounters]] components to pass collected measurements
 * - *:controller:*:*:1.0     controller to call business methods
 *
 * ### Example ###
 *
 * class MyDirectClient extends DirectClient<IMyController> implements IMyClient {
 *
 *   public constructor() {
 *       super();
 *       this._dependencyResolver.put('controller', new Descriptor(
 *           "mygroup", "controller", "*", "*", "*"));
 *    }
 *    ...
 *
 *    public getData(correlationId: string, id: string,
 *        callback: (err: any, result: MyData) => void): void {
 *
 *        let timing = this.instrument(correlationId, 'myclient.get_data');
 *        this._controller.getData(correlationId, id, (err, result) => {
 *            timing.endTiming();
 *            callback(err, result);
 *        });
 *    }
 *    ...
 * }
 *
 * let client = new MyDirectClient();
 * client.setReferences(References.fromTuples(
 *     new Descriptor("mygroup","controller","default","default","1.0"), controller
 * ));
 *
 * client.getData("123", "1", (err, result) => {
 *   ...
 * });
 */
export declare abstract class DirectClient<T> implements IConfigurable, IReferenceable, IOpenable {
    /**
     * The controller reference.
     */
    protected _controller: T;
    /**
     * The open flag.
     */
    protected _opened: boolean;
    /**
     * The logger.
     */
    protected _logger: CompositeLogger;
    /**
     * The performance counters
     */
    protected _counters: CompositeCounters;
    /**
     * The dependency resolver to get controller reference.
     */
    protected _dependencyResolver: DependencyResolver;
    /**
     * Creates a new instance of the client.
     */
    constructor();
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config: ConfigParams): void;
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references: IReferences): void;
    /**
     * Adds instrumentation to log calls and measure call time.
     * It returns a Timing object that is used to end the time measurement.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param name              a method name.
     * @returns Timing object to end the time measurement.
     */
    protected instrument(correlationId: string, name: string): Timing;
    /**
     * Checks if the component is opened.
     *
     * @returns true if the component has been opened and false otherwise.
     */
    isOpen(): boolean;
    /**
     * Opens the component.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    open(correlationId: string, callback?: (err: any) => void): void;
    /**
     * Closes component and frees used resources.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    close(correlationId: string, callback?: (err: any) => void): void;
}
