import { IOpenable } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { CompositeLogger } from 'pip-services-components-node';
import { CompositeCounters } from 'pip-services-components-node';
import { Timing } from 'pip-services-components-node';
import { HttpConnectionResolver } from '../connect/HttpConnectionResolver';
/**
 * Abstract client that calls remove endpoints using HTTP/REST protocol.
 *
 * ### Configuration parameters ###
 *
 * base_route:              base route for remote URI
 * connection(s):
 *   discovery_key:         (optional) a key to retrieve the connection from [[IDiscovery]]
 *   protocol:              connection protocol: http or https
 *   host:                  host name or IP address
 *   port:                  port number
 *   uri:                   resource URI or connection string with all parameters in it
 * options:
 *   retries:               number of retries (default: 3)
 *   connect_timeout:       connection timeout in milliseconds (default: 10 sec)
 *   timeout:               invocation timeout in milliseconds (default: 10 sec)
 *
 * ### References ###
 *
 * - *:logger:*:*:1.0         (optional) ILogger components to pass log messages
 * - *:counters:*:*:1.0         (optional) ICounters components to pass collected measurements
 * - *:discovery:*:*:1.0        (optional) IDiscovery services to resolve connection
 *
 * @see [[RestService]]
 * @see [[CommandableHttpService]]
 *
 * ### Example ###
 *
 * class MyRestClient extends RestClient implements IMyClient {
 *    ...
 *
 *    public getData(correlationId: string, id: string,
 *        callback: (err: any, result: MyData) => void): void {
 *
 *        let timing = this.instrument(correlationId, 'myclient.get_data');
 *        this.call("get", "/get_data" correlationId, { id: id }, null, (err, result) => {
 *            timing.endTiming();
 *            callback(err, result);
 *        });
 *    }
 *    ...
 * }
 *
 * let client = new MyRestClient();
 * client.configure(ConfigParams.fromTuples(
 *     "connection.protocol", "http",
 *     "connection.host", "localhost",
 *     "connection.port", 8080
 * ));
 *
 * client.getData("123", "1", (err, result) => {
 *   ...
 * });
 */
export declare abstract class RestClient implements IOpenable, IConfigurable, IReferenceable {
    private static readonly _defaultConfig;
    /**
     * The HTTP client.
     */
    protected _client: any;
    /**
     * The connection resolver.
     */
    protected _connectionResolver: HttpConnectionResolver;
    /**
     * The logger.
     */
    protected _logger: CompositeLogger;
    /**
     * The performance counters.
     */
    protected _counters: CompositeCounters;
    /**
     * The configuration options.
     */
    protected _options: ConfigParams;
    /**
     * The base route.
     */
    protected _baseRoute: string;
    /**
     * The number of retries.
     */
    protected _retries: number;
    /**
     * The default headers to be added to every request.
     */
    protected _headers: any;
    /**
     * The connection timeout in milliseconds.
     */
    protected _connectTimeout: number;
    /**
     * The invocation timeout in milliseconds.
     */
    protected _timeout: number;
    /**
     * The remote service uri which is calculated on open.
     */
    protected _uri: string;
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
    /**
     * Adds instrumentation to log calls and measure call time.
     * It returns a Timing object that is used to end the time measurement.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param name              a method name.
     * @returns Timing object to end the time measurement.
     */
    protected instrument(correlationId: string, name: string): Timing;
    /**
     * Checks if the component is opened.
     *
     * @returns true if the component has been opened and false otherwise.
     */
    isOpen(): boolean;
    /**
     * Opens the component.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    open(correlationId: string, callback?: (err: any) => void): void;
    /**
     * Closes component and frees used resources.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    close(correlationId: string, callback?: (err: any) => void): void;
    /**
     * Adds a correlation id (correlation_id) to invocation parameter map.
     *
     * @param params            invocation parameters.
     * @param correlationId     (optional) a correlation id to be added.
     * @returns invocation parameters with added correlation id.
     */
    protected addCorrelationId(params: any, correlationId: string): any;
    /**
     * Adds filter parameters (with the same name as they defined)
     * to invocation parameter map.
     *
     * @param params        invocation parameters.
     * @param filter        (optional) filter parameters
     * @returns invocation parameters with added filter parameters.
     */
    protected addFilterParams(params: any, filter: any): void;
    /**
     * Adds paging parameters (skip, take, total) to invocation parameter map.
     *
     * @param params        invocation parameters.
     * @param paging        (optional) paging parameters
     * @returns invocation parameters with added paging parameters.
     */
    protected addPagingParams(params: any, paging: any): void;
    private createRequestRoute;
    /**
     * Calls a remote method via HTTP/REST protocol.
     *
     * @param method            HTTP method: "get", "head", "post", "put", "delete"
     * @param route             a command route. Base route will be added to this route
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param params            (optional) query parameters.
     * @param data              (optional) body object.
     * @param callback          (optional) callback function that receives result object or error.
     */
    protected call(method: string, route: string, correlationId?: string, params?: any, data?: any, callback?: (err: any, result: any) => void): void;
}
