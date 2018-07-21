import { Factory } from 'pip-services-components-node';
import { Descriptor } from 'pip-services-commons-node';
export declare class DefaultRpcFactory extends Factory {
    static readonly Descriptor: Descriptor;
    static readonly HttpEndpointDescriptor: Descriptor;
    static readonly StatusServiceDescriptor: Descriptor;
    static readonly HeartbeatServiceDescriptor: Descriptor;
    constructor();
}
