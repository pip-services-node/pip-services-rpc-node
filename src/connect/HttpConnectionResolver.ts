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

export class HttpConnectionResolver implements IReferenceable, IConfigurable {
    protected _connectionResolver: ConnectionResolver = new ConnectionResolver();

    public setReferences(references: IReferences): void {
        this._connectionResolver.setReferences(references);
    }

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

    public resolve(correlationId: string, callback: (err: any, connection: ConnectionParams) => void): void {
        this._connectionResolver.resolve(correlationId, (err: any, connection: ConnectionParams) => {
            if (err == null)
                err = this.validateConnection(correlationId, connection);

            if (err == null && connection != null)
                this.updateConnection(connection);
    
            callback(err, connection);
        });
    }

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
