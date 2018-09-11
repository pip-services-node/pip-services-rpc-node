/** @module build */
import { Factory } from 'pip-services-components-node';
import { Descriptor } from 'pip-services-commons-node';

import { HttpEndpoint } from '../services/HttpEndpoint';
import { HeartbeatRestService } from '../services/HeartbeatRestService';
import { StatusRestService } from '../services/StatusRestService';

/**
 * Contains static read-only descriptors for [[HttpEndpoint]], [[HeartbeatRestService]], and [[StatusRestService]] 
 * (as well as a default "net" factory descriptor).
 * 
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/build.factory.html Factory]]
 * 
 * ### Examples ###
 * 
 *     export class MyDataProcess extends ProcessContainer { 
 *         public constructor(){
 *             super('mydata', 'MyData microservice');
 *
 *             this._factories.add(new MyDataServiceFactory());
 *             this._factories.add(new DefaultRpcFactory());
 *         }
 *      }
 * @see [[ProcessContainer]]
 */
export class DefaultRpcFactory extends Factory {
	public static readonly Descriptor: Descriptor = new Descriptor("pip-services", "factory", "net", "default", "1.0");
    public static readonly HttpEndpointDescriptor: Descriptor = new Descriptor("pip-services", "endpoint", "http", "*", "1.0");
    public static readonly StatusServiceDescriptor = new Descriptor("pip-services", "status-service", "http", "*", "1.0");
    public static readonly HeartbeatServiceDescriptor = new Descriptor("pip-services", "heartbeat-service", "http", "*", "1.0");

    /**
	 * Create a new DefaultRpcFactory object, containing [[HttpEndpoint]], [[HeartbeatRestService]], and [[StatusRestService]] 
     * object factories.
	 * 
	 * @see [[HttpEndpoint]]
     * @see [[HeartbeatRestService]]
     * @see [[StatusRestService]] 
	 */
    public constructor() {
        super();
        this.registerAsType(DefaultRpcFactory.HttpEndpointDescriptor, HttpEndpoint);
        this.registerAsType(DefaultRpcFactory.HeartbeatServiceDescriptor, HeartbeatRestService);
        this.registerAsType(DefaultRpcFactory.StatusServiceDescriptor, StatusRestService);
    }
}
