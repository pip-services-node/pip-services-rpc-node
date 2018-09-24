/** @module services */
import { ICommandable } from 'pip-services-commons-node';
import { CommandSet } from 'pip-services-commons-node';
import { Parameters } from 'pip-services-commons-node';

import { RestService } from './RestService';

/**
 * Abstract service that receives remove calls via HTTP/REST protocol
 * to operations automatically generated for commands defined in ICommandable components.
 * Each command is exposed as POST operation that receives all parameters in body object.
 * 
 * Commandable services require only 3 lines of code to implement a robust external
 * HTTP-based remote interface.
 * 
 * ### Configuration parameters ###
 * 
 * base_route:              base route for remote URI
 * dependencies:
 *   endpoint:              override for HTTP Endpoint dependency
 *   controller:            override for Controller dependency
 * connection(s):           
 *   discovery_key:         (optional) a key to retrieve the connection from IDiscovery
 *   protocol:              connection protocol: http or https
 *   host:                  host name or IP address
 *   port:                  port number
 *   uri:                   resource URI or connection string with all parameters in it
 * 
 * ### References ###
 * 
 * - *:logger:*:*:1.0               (optional) ILogger components to pass log messages
 * - *:counters:*:*:1.0             (optional) ICounters components to pass collected measurements
 * - *:discovery:*:*:1.0            (optional) IDiscovery services to resolve connection
 * - *:endpoint:http:*:1.0          (optional) [[HttpEndpoint]] reference
 * 
 * @see [[CommandableHttpClient]]
 * @see [[RestService]]
 * 
 * ### Example ###
 * 
 * class MyCommandableHttpService extends CommandableHttpService {
 *    public constructor() {
 *       base();
 *       this._dependencyResolver.put(
 *           "controller",
 *           new Descriptor("mygroup","controller","*","*","1.0")
 *       );
 *    }
 * }
 * 
 * let service = new MyCommandableHttpService();
 * service.configure(ConfigParams.fromTuples(
 *     "connection.protocol", "http",
 *     "connection.host", "localhost",
 *     "connection.port", 8080
 * ));
 * service.setReferences(References.fromTuples(
 *    new Descriptor("mygroup","controller","default","default","1.0"), controller
 * ));
 * 
 * service.open("123", (err) => {
 *    console.log("The REST service is running on port 8080");
 * });
 */
export abstract class CommandableHttpService extends RestService {
    private _commandSet: CommandSet;

    /**
     * Creates a new instance of the service.
     * 
     * @param baseRoute a service base route.
     */
    public constructor(baseRoute: string) {
        super();
        this._baseRoute = baseRoute;
        this._dependencyResolver.put('controller', 'none');
    }

    /**
     * Registers all service routes in HTTP endpoint.
     */
    public register(): void {
        let controller: ICommandable = this._dependencyResolver.getOneRequired<ICommandable>('controller');
        this._commandSet = controller.getCommandSet();

        let commands = this._commandSet.getCommands();
        for (let index = 0; index < commands.length; index++) {
            let command = commands[index];

            let route = command.getName();
            route = route[0] != '/' ? '/' + route : route;

            this.registerRoute('post', route, null, (req, res) => {
                let params = req.body || {};
                let correlationId = req.params.correlation_id;
                let args = Parameters.fromValue(params);
                let timing = this.instrument(correlationId, this._baseRoute + '.' + command.getName());

                command.execute(correlationId, args, (err, result) => {
                    timing.endTiming();
                    this.sendResult(req, res)(err, result);
                })
            });
        }
    }
}