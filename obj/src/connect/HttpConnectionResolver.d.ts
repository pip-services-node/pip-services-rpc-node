import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { ConnectionResolver } from 'pip-services-components-node';
import { ConnectionParams } from 'pip-services-components-node';
export declare class HttpConnectionResolver implements IReferenceable, IConfigurable {
    protected _connectionResolver: ConnectionResolver;
    setReferences(references: IReferences): void;
    configure(config: ConfigParams): void;
    private validateConnection;
    private updateConnection;
    resolve(correlationId: string, callback: (err: any, connection: ConnectionParams) => void): void;
    resolveAll(correlationId: string, callback: (err: any, connections: ConnectionParams[]) => void): void;
    register(correlationId: string, callback: (err: any) => void): void;
}
