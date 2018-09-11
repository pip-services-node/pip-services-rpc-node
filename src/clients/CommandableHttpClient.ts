/** @module clients */
import { RestClient } from './RestClient';

/**
 * Basic implementation of the abstract [[RestClient]] class.
 * 
 * ### Examples ###
 *     export class MyDataHttpClientV1 extends CommandableHttpClient {
 *         public constructor() {
 *             super('v1/mydata');
 *         }
 * 
 *         public getMyData(correlationId: string, filter: FilterParams, paging: PagingParams,
 *             callback: (err: any, page: DataPage<MyData>) => void): void {
 *             this.callCommand(
 *                 'get_mydata',
 *                 correlationId,
 *                 { filter: filter, pagin: paging },
 *                 callback
 *             );
 *         }
 * 
 *         public calculateResult(correlationId: string, value1: string, value2: string,
 *             callback: (err: any, result: any) => void): void {
 *             this.callCommand(
 *                 'calculate_result',
 *                 correlationId,
 *                 {
 *                     value_1: value1,
 *                     value_2: value2
 *                 },
 *                 callback
 *             );    
 *         }
 *     }
 */
export class CommandableHttpClient extends RestClient {
    /**
     * Creates a new CommandableHttpClient, which can call a 
     * [[CommandableHttpService CommandableHttpService's]] methods
     * over the REST API, using the given base route.
     * 
     * @param baseRoute     the base route to use for calling methods. 
     *                      For example "/quotes".
     */
    public constructor(baseRoute: string) {
        super();
        this._baseRoute = baseRoute;
    }

    /**
     * Calls the command, whose name is given name, with the parameters passed using the POST 
     * HTTP method.
     * 
     * Additionally sets a timing by calling this the inherited [[instrument]] method, which 
     * times method execution.
     * 
     * @param name              the name of the command to call.
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param params            the parameters to pass to the called method.
     * @param callback          the function to call with the result of the execution 
     *                          (or with an error, if one is raised).
     * 
     * @see [[call]]
     * @see [[instrument]]
     */
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