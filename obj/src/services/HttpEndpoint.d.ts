import { IOpenable } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { Schema } from 'pip-services-commons-node';
import { IRegisterable } from './IRegisterable';
export declare class HttpEndpoint implements IOpenable, IConfigurable, IReferenceable {
    private static readonly _defaultConfig;
    private _server;
    private _connectionResolver;
    private _logger;
    private _counters;
    private _uri;
    private _registrations;
    configure(config: ConfigParams): void;
    setReferences(references: IReferences): void;
    isOpened(): boolean;
    open(correlationId: string, callback?: (err: any) => void): void;
    close(correlationId: string, callback?: (err: any) => void): void;
    register(registration: IRegisterable): void;
    unregister(registration: IRegisterable): void;
    private performRegistrations;
    registerRoute(method: string, route: string, schema: Schema, action: (req: any, res: any) => void): void;
}
