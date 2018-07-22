"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let url = require('url');
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_commons_node_1 = require("pip-services-commons-node");
class HttpConnectionResolver {
    constructor() {
        this._connectionResolver = new pip_services_components_node_1.ConnectionResolver();
    }
    setReferences(references) {
        this._connectionResolver.setReferences(references);
    }
    configure(config) {
        this._connectionResolver.configure(config);
    }
    validateConnection(correlationId, connection) {
        if (connection == null)
            return new pip_services_commons_node_1.ConfigException(correlationId, "NO_CONNECTION", "HTTP connection is not set");
        let uri = connection.getUri();
        if (uri != null)
            return null;
        let protocol = connection.getProtocol("http");
        if ("http" != protocol) {
            return new pip_services_commons_node_1.ConfigException(correlationId, "WRONG_PROTOCOL", "Protocol is not supported by REST connection")
                .withDetails("protocol", protocol);
        }
        let host = connection.getHost();
        if (host == null)
            return new pip_services_commons_node_1.ConfigException(correlationId, "NO_HOST", "Connection host is not set");
        let port = connection.getPort();
        if (port == 0)
            return new pip_services_commons_node_1.ConfigException(correlationId, "NO_PORT", "Connection port is not set");
        return null;
    }
    updateConnection(connection) {
        if (connection == null)
            return;
        let uri = connection.getUri();
        if (uri == null || uri == "") {
            let protocol = connection.getProtocol('http');
            let host = connection.getHost();
            let port = connection.getPort();
            uri = protocol + "://" + host;
            if (port != 0)
                uri += ':' + port;
            connection.setUri(uri);
        }
        else {
            let address = url.parse(uri);
            let protocol = ("" + address.protocol).replace(':', '');
            connection.setProtocol(protocol);
            connection.setHost(address.hostname);
            connection.setPort(address.port);
        }
    }
    resolve(correlationId, callback) {
        this._connectionResolver.resolve(correlationId, (err, connection) => {
            if (err == null)
                err = this.validateConnection(correlationId, connection);
            if (err == null && connection != null)
                this.updateConnection(connection);
            callback(err, connection);
        });
    }
    resolveAll(correlationId, callback) {
        this._connectionResolver.resolveAll(correlationId, (err, connections) => {
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
    register(correlationId, callback) {
        this._connectionResolver.resolve(correlationId, (err, connection) => {
            // Validate connection
            if (err == null)
                err = this.validateConnection(correlationId, connection);
            if (err == null)
                this._connectionResolver.register(correlationId, connection, callback);
            else
                callback(err);
        });
    }
}
exports.HttpConnectionResolver = HttpConnectionResolver;
//# sourceMappingURL=HttpConnectionResolver.js.map