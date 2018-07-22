export declare class HttpResponseSender {
    static sendError(req: any, res: any, error: any): void;
    static sendResult(req: any, res: any): (err: any, result: any) => void;
    static sendEmptyResult(req: any, res: any): (err: any) => void;
    static sendCreatedResult(req: any, res: any): (err: any, result: any) => void;
    static sendDeletedResult(req: any, res: any): (err: any, result: any) => void;
}
