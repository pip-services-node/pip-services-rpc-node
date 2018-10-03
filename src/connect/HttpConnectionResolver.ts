/** @module connect */
/** @hidden */
let url = require('url');

import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { ConnectionResolver } from 'pip-services-components-node';
import { ConnectionParams } from 'pip-services-components-node';
import { ConfigException } from 'pip-services-commons-node';

/**
 * Helper class to retrieve connections for HTTP-based services abd clients.
 * 
 * In addition to regular functions of ConnectionResolver is able to parse http:// URIs
 * and validate connection parameters before returning them.
 * 
 * ### Configuration parameters ###
 * 
 * - connection:    
 *   - discovery_key:               (optional) a key to retrieve the connection from [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]]
 *   - ...                          other connection parameters
 * 
 * - connections:                   alternative to connection
 *   - [connection params 1]:       first connection parameters
 *   -  ...
 *   - [connection params N]:       Nth connection parameters
 *   -  ...
 * 
 * ### References ###
 * 
 * - <code>\*:discovery:\*:\*:1.0</code>            (optional) [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]] services
 * 
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionparams.html ConnectionParams]] 
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionresolver.html ConnectionResolver]] 
 * 
 * ### Example ###
 * 
 *     let config = ConfigParams.fromTuples(
 *          "connection.host", "10.1.1.100",
 *          "connection.port", 8080
 *     );
 * 
 *     let connectionResolver = new HttpConnectionResolver();
 *     connectionResolver.configure(config);
 *     connectionResolver.setReferences(references);
 * 
 *     connectionResolver.resolve("123", (err, connection) => {
 *          // Now use connection...
 *     });
 */
export class HttpConnectionResolver implements IReferenceable, IConfigurable {
    /** 
     * The base connection resolver.
     */
    protected _connectionResolver: ConnectionResolver = new ConnectionResolver();

    /**
     * Configures component by passing configuration parameters.
     * 
     * @param config    configuration parameters to be set.
     */
    public configure(config: ConfigParams): void {
        this._connectionResolver.configure(config);
    }

    /**
	 * Sets references to dependent components.
	 * 
	 * @param references 	references to locate the component dependencies. 
     */
    public setReferences(references: IReferences): void {
        this._connectionResolver.setReferences(references);
    }

    private validateConnection(correlationId: string, connection: ConnectionParams): any {
        if (connection == null)
            return new ConfigException(correlationId, "NO_CONNECTION", "HTTP connection is not set");

        let uri = connection.getUri();
        if (uri != null) return null;

        let protocol: string = connection.getProtocol("http");
        if ("http" != protocol) {
            return new ConfigException(
                correlationId, "WRONG_PROTOCOL", "Protocol is not supported by REST connection")
                .withDetails("protocol", protocol);
        }

        let host = connection.getHost();
        if (host == null)
            return new ConfigException(correlationId, "NO_HOST", "Connection host is not set");

        let port = connection.getPort();
        if (port == 0)
            return new ConfigException(correlationId, "NO_PORT", "Connection port is not set");

        return null;
    }

    private updateConnection(connection: ConnectionParams): void {
        if (connection == null) return;

        let uri = connection.getUri();

        if (uri == null || uri == "") {
            let protocol = connection.getProtocol('http');
            let host = connection.getHost();
            let port = connection.getPort();

            uri = protocol + "://" + host;
            if (port != 0)
                uri += ':' + port;
            connection.setUri(uri);
        } else {
            let address = url.parse(uri);            
            let protocol = ("" + address.protocol).replace(':', '');

            connection.setProtocol(protocol);
            connection.setHost(address.hostname);
            connection.setPort(address.port);
        }
    }

    /**
     * Resolves a single component connection. If connections are configured to be retrieved
     * from Discovery service it finds a IDiscovery and resolves the connection there.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives resolved connection or error.
     */
    public resolve(correlationId: string, callback: (err: any, connection: ConnectionParams) => void): void {
        this._connectionResolver.resolve(correlationId, (err: any, connection: ConnectionParams) => {
            if (err == null)
                err = this.validateConnection(correlationId, connection);

            if (err == null && connection != null)
                this.updateConnection(connection);
    
            callback(err, connection);
        });
    }

    /**
     * Resolves all component connection. If connections are configured to be retrieved
     * from Discovery service it finds a IDiscovery and resolves the connection there.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives resolved connections or error.
     */
    public resolveAll(correlationId: string, callback: (err: any, connections: ConnectionParams[]) => void): void {
        this._connectionResolver.resolveAll(correlationId, (err: any, connections: ConnectionParams[]) => {
            connections = connections || [];
            
            for (let connection of connections) {
                if (err == null)
                    err = this.validateConnection(correlationId, connection);

                if (err == null && connection != null)
                    this.updateConnection(connection);
            }
    
            callback(err, connections);
        });
    }
    
    /**
     * Registers the given connection in all referenced discovery services.
     * This method can be used for dynamic service discovery.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param connection        a connection to register.
     * @param callback          callback function that receives registered connection or error.
     */
    public register(correlationId: string, callback: (err: any) => void): void {
        this._connectionResolver.resolve(correlationId, (err: any, connection: ConnectionParams) => {
            // Validate connection
            if (err == null)
                err = this.validateConnection(correlationId, connection);

            if (err == null) 
                this._connectionResolver.register(correlationId, connection, callback);
            else callback(err);
        });
    }

}
