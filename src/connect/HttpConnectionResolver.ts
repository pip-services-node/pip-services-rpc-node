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
 * Helper class that resolves connection parameters for HTTP connections.
 * 
 * ### Configuration parameters ###
 * 
 * Parameters to pass to the [[configure]] method for component configuration:
 * 
 * - __connection(s)__ - the connection resolver's connections;
 *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
 *     - "connection.protocol" - the connection's protocol;
 *     - "connection.host" - the target host;
 *     - "connection.port" - the target port;
 *     - "connection.uri" - the target URI.
 * 
 * ### References ###
 * 
 * A a connection resolver can be referenced by passing the 
 * following reference to the object's [[setReferences]] method:
 * 
 * - discovery: <code>"\*:discovery:\*:\*:1.0"</code>
 * 
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionparams.html ConnectionParams]] (in the PipServices "Components" package)
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionresolver.html ConnectionResolver]] (in the PipServices "Components" package)
 */
export class HttpConnectionResolver implements IReferenceable, IConfigurable {
    /** 
     * The [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionresolver.html ConnectionResolver]] 
     * to use for resolving connection parameters.
     */
    protected _connectionResolver: ConnectionResolver = new ConnectionResolver();

    /**
     * Sets a reference to the connection resolver's discovery service.
     * 
     * __References:__
     * 
     * - discovery: <code>"\*:discovery:\*:\*:1.0"</code>
     * 
     * @param references    an IReferences object, containing a discovery reference.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/refer.ireferences.html IReferences]] (in the PipServices "Commons" package)
     */
    public setReferences(references: IReferences): void {
        this._connectionResolver.setReferences(references);
    }

    /**
     * Configures this HttpConnectionResolver using the given configuration parameters.
     * 
     * __Configuration parameters:__
     * - __connection(s)__ - the connection resolver's connections;
     *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
     *     - "connection.protocol" - the connection's protocol;
     *     - "connection.host" - the target host;
     *     - "connection.port" - the target port;
     *     - "connection.uri" - the target URI.
     * 
     * @param config    configuration parameters, containing a "connection(s)" section.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
    public configure(config: ConfigParams): void {
        this._connectionResolver.configure(config);
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
     * Resolves connection parameters for an HTTP connection using the referenced connection resolver.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          the function to call with the resolved ConnectionParams 
     *                          (or with an error, if one is raised).
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionparams.html ConnectionParams]] (in the PipServices "Components" package)
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
     * Resolves all existing connection parameters for an HTTP connection using the referenced connection resolver.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          the function to call with the resolved list of ConnectionParams 
     *                          (or with an error, if one is raised).
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionparams.html ConnectionParams]] (in the PipServices "Components" package)
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
    
    //TODO: I didn't quite understand what this method does.
    /**
     * Resolves a connection, checks that it is valid, and, if it is, registers it in the 
     * referenced connection resolver.
     * 
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          the function to call once the connection has been validated and 
     *                          registered. Will be called with an error if one is raised.
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
