import { IOpenable } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { DependencyResolver } from 'pip-services-commons-node';
import { CompositeLogger } from 'pip-services-components-node';
import { CompositeCounters } from 'pip-services-components-node';
import { ConfigParams } from 'pip-services-commons-node';
import { Timing } from 'pip-services-components-node';
export declare abstract class DirectClient<T> implements IConfigurable, IReferenceable, IOpenable {
    protected _controller: T;
    protected _opened: boolean;
    protected _logger: CompositeLogger;
    protected _counters: CompositeCounters;
    protected _dependencyResolver: DependencyResolver;
    constructor();
    configure(config: ConfigParams): void;
    setReferences(references: IReferences): void;
    protected instrument(correlationId: string, name: string): Timing;
    isOpen(): boolean;
    open(correlationId: string, callback?: (err: any) => void): void;
    close(correlationId: string, callback?: (err: any) => void): void;
}
