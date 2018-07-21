import { RestService } from './RestService';
export declare abstract class CommandableHttpService extends RestService {
    private _commandSet;
    constructor(baseRoute: string);
    register(): void;
}
