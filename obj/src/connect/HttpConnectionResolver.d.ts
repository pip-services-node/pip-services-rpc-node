import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { ConnectionResolver } from 'pip-services-components-node';
import { ConnectionParams } from 'pip-services-components-node';
/**
 * Helper class to retrieve connections for HTTP-based services abd clients.
 *
 * In addition to regular functions of ConnectionResolver is able to parse http:// URIs
 * and validate connection parameters before returning them.
 *
 * ### Configuration parameters ###
 *
 * connection:
 *   discovery_key:               (optional) a key to retrieve the connection from [[IDiscovery]]
 *   ...                          other connection parameters
 *
 * connections:                   alternative to connection
 *   [connection params 1]:       first connection parameters
 *     ...
 *   [connection params N]:       Nth connection parameters
 *     ...
 *
 * ### References ###
 *
 * - *:discovery:*:*:1.0            (optional) IDiscovery services
 *
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionparams.html ConnectionParams]]
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionresolver.html ConnectionResolver]]
 *
 * ### Example ###
 *
 * let config = ConfigParams.fromTuples(
 *      "connection.host", "10.1.1.100",
 *      "connection.port", 8080
 * );
 *
 * let connectionResolver = new HttpConnectionResolver();
 * connectionResolver.configure(config);
 * connectionResolver.setReferences(references);
 *
 * connectionResolver.resolve("123", (err, connection) => {
 *      // Now use connection...
 * });
 */
export declare class HttpConnectionResolver implements IReferenceable, IConfigurable {
    /**
     * The base connection resolver.
     */
    protected _connectionResolver: ConnectionResolver;
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
    private validateConnection;
    private updateConnection;
    /**
     * Resolves a single component connection. If connections are configured to be retrieved
     * from Discovery service it finds a IDiscovery and resolves the connection there.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives resolved connection or error.
     */
    resolve(correlationId: string, callback: (err: any, connection: ConnectionParams) => void): void;
    /**
     * Resolves all component connection. If connections are configured to be retrieved
     * from Discovery service it finds a IDiscovery and resolves the connection there.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives resolved connections or error.
     */
    resolveAll(correlationId: string, callback: (err: any, connections: ConnectionParams[]) => void): void;
    /**
     * Registers the given connection in all referenced discovery services.
     * This method can be used for dynamic service discovery.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param connection        a connection to register.
     * @param callback          callback function that receives registered connection or error.
     */
    register(correlationId: string, callback: (err: any) => void): void;
}
