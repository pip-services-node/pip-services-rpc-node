"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pip_services_commons_node_1 = require("pip-services-commons-node");
const RestService_1 = require("./RestService");
class CommandableHttpService extends RestService_1.RestService {
    constructor(baseRoute) {
        super();
        this._baseRoute = baseRoute;
        this._dependencyResolver.put('controller', 'none');
    }
    register() {
        let controller = this._dependencyResolver.getOneRequired('controller');
        this._commandSet = controller.getCommandSet();
        let commands = this._commandSet.getCommands();
        for (let index = 0; index < commands.length; index++) {
            let command = commands[index];
            let route = command.getName();
            route = route[0] != '/' ? '/' + route : route;
            this.registerRoute('post', route, null, (req, res) => {
                let params = req.body || {};
                let correlationId = req.params.correlation_id;
                let args = pip_services_commons_node_1.Parameters.fromValue(params);
                let timing = this.instrument(correlationId, this._baseRoute + '.' + command.getName());
                command.execute(correlationId, args, (err, result) => {
                    timing.endTiming();
                    this.sendResult(req, res)(err, result);
                });
            });
        }
    }
}
exports.CommandableHttpService = CommandableHttpService;
//# sourceMappingURL=CommandableHttpService.js.map