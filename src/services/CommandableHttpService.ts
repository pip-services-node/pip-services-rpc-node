/** @module services */
import { ICommandable } from 'pip-services-commons-node';
import { CommandSet } from 'pip-services-commons-node';
import { Parameters } from 'pip-services-commons-node';

import { RestService } from './RestService';

export abstract class CommandableHttpService extends RestService {
    private _commandSet: CommandSet;

    public constructor(baseRoute: string) {
        super();
        this._baseRoute = baseRoute;
        this._dependencyResolver.put('controller', 'none');
    }

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