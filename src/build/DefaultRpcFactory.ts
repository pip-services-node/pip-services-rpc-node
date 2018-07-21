import { Factory } from 'pip-services-components-node';
import { Descriptor } from 'pip-services-commons-node';

import { HttpEndpoint } from '../rest/HttpEndpoint';
import { HeartbeatRestService } from '../status/HeartbeatRestService';
import { StatusRestService } from '../status/StatusRestService';

export class DefaultRpcFactory extends Factory {
	public static readonly Descriptor: Descriptor = new Descriptor("pip-services", "factory", "net", "default", "1.0");
    public static readonly HttpEndpointDescriptor: Descriptor = new Descriptor("pip-services", "endpoint", "http", "*", "1.0");
    public static readonly StatusServiceDescriptor = new Descriptor("pip-services", "status-service", "http", "*", "1.0");
    public static readonly HeartbeatServiceDescriptor = new Descriptor("pip-services", "heartbeat-service", "http", "*", "1.0");

    public constructor() {
        super();
        this.registerAsType(DefaultRpcFactory.HttpEndpointDescriptor, HttpEndpoint);
        this.registerAsType(DefaultRpcFactory.HeartbeatServiceDescriptor, HeartbeatRestService);
        this.registerAsType(DefaultRpcFactory.StatusServiceDescriptor, StatusRestService);
    }
}
