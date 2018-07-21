import { RestClient } from './RestClient';
export declare class CommandableHttpClient extends RestClient {
    constructor(baseRoute: string);
    callCommand(name: string, correlationId: string, params: any, callback: (err: any, result: any) => void): void;
}
