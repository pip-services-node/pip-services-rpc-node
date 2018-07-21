"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RestClient_1 = require("./RestClient");
class CommandableHttpClient extends RestClient_1.RestClient {
    constructor(baseRoute) {
        super();
        this._baseRoute = baseRoute;
    }
    callCommand(name, correlationId, params, callback) {
        let timing = this.instrument(correlationId, this._baseRoute + '.' + name);
        this.call('post', name, correlationId, {}, params || {}, (err, result) => {
            timing.endTiming();
            if (callback)
                callback(err, result);
        });
    }
}
exports.CommandableHttpClient = CommandableHttpClient;
//# sourceMappingURL=CommandableHttpClient.js.map