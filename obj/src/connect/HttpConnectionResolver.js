"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module connect */
/** @hidden */
let url = require('url');
const pip_services_components_node_1 = require("pip-services-components-node");
const pip_services_commons_node_1 = require("pip-services-commons-node");
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
class HttpConnectionResolver {
    constructor() {
        /**
         * The base connection resolver.
         */
        this._connectionResolver = new pip_services_components_node_1.ConnectionResolver();
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        this._connectionResolver.configure(config);
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references) {
        this._connectionResolver.setReferences(references);
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
    /**
     * Resolves a single component connection. If connections are configured to be retrieved
     * from Discovery service it finds a IDiscovery and resolves the connection there.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives resolved connection or error.
     */
    resolve(correlationId, callback) {
        this._connectionResolver.resolve(correlationId, (err, connection) => {
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
    /**
     * Registers the given connection in all referenced discovery services.
     * This method can be used for dynamic service discovery.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param connection        a connection to register.
     * @param callback          callback function that receives registered connection or error.
     */
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