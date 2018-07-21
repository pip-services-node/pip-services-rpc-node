import { RestClient } from './RestClient';

export class CommandableHttpClient extends RestClient {
    public constructor(baseRoute: string) {
        super();
        this._baseRoute = baseRoute;
    }

    public callCommand(name: string, correlationId: string, params: any, callback: (err: any, result: any) => void): void {
        let timing = this.instrument(correlationId, this._baseRoute + '.' + name);

        this.call('post', name,
            correlationId,
            {},
            params || {},
            (err, result) => {
                timing.endTiming();
                if (callback) callback(err, result);
            }
        );
    }
}