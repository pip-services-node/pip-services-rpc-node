/** @module services */
import { ICommandable } from 'pip-services-commons-node';
import { CommandSet } from 'pip-services-commons-node';
import { Parameters } from 'pip-services-commons-node';

import { RestService } from './RestService';

//TODO: example implementation and example command route.
/**
 * Abstract class for creating commandable HTTP services. Commandable HTTP services register routes for 
 * each command of a controller's command set, which allows the controller's commands to be executed by
 * POSTing input data at the command's registered route.
 * 
 * ### Configuration parameters ###
 * 
 * Parameters to pass to the [[configure]] method for component configuration:
 * 
 * - __connection(s)__ - the configuration parameters to use when creating HTTP endpoints;
 *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
 *     - "connection.protocol" - the connection's protocol;
 *     - "connection.host" - the target host;
 *     - "connection.port" - the target port;
 *     - "connection.uri" - the target URI.
 * - "base_route" - this service's base route;
 * - the dependency resolver's configuration parameters.
 * 
 * ### References ###
 * 
 * A logger, counters, HTTP endpoint, and dependency resolver can be referenced by passing the 
 * following references to the object's [[setReferences]] method:
 * 
 * - logger: <code>"\*:logger:\*:\*:1.0"</code>;
 * - counters: <code>"\*:counters:\*:\*:1.0"</code>;
 * - endpoint: <code>"\*:endpoint:\*:\*:1.0"</code>.
 */
export abstract class CommandableHttpService extends RestService {
    private _commandSet: CommandSet;

    /**
     * Creates a new CommandableHttpService object, which will use the given <code>baseRoute</code>
     * to register the "controller" that is set in this object's dependency resolver.
     * 
     * @param baseRoute the service's base route.
     */
    public constructor(baseRoute: string) {
        super();
        this._baseRoute = baseRoute;
        this._dependencyResolver.put('controller', 'none');
    }

    /**
     * Registers the "controller" that is set in this object's dependency resolver by creating
     * and registering routes for all commands that are included in the controller's command set.
     * 
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/commands.commandset.html CommandSet]] (in the PipServices "Commons" package)
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