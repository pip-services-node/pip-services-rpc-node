/** @module services */
/** @hidden */
let _ = require('lodash');

import { ApplicationException } from 'pip-services-commons-node';

export class HttpResponseSender {
    
    public static sendError(req: any, res: any, error: any): void {
        error = error || {};
        error = ApplicationException.unwrapError(error);
        
        let result = _.pick(error, 'code', 'status', 'name', 'details', 'component', 'message', 'stack', 'cause');
        result = _.defaults(result, { code: 'Undefined', status: 500, message: 'Unknown error' });

        res.status(result.status);
        res.json(result);
    }

    public static sendResult(req: any, res: any): (err: any, result: any) => void {
        return function (err, result) {
            if (err) {
                HttpResponseSender.sendError(req, res, err);
                return;
            }
            if (result == null) res.send(204);
            else res.json(result);
        }
    }

    public static sendEmptyResult(req: any, res: any): (err: any) => void {
        return function (err) {
            if (err) {
                HttpResponseSender.sendError(req, res, err);
                return;
            }
            res.send(204);
        }
    }

    public static sendCreatedResult(req: any, res: any): (err: any, result: any) => void {
        return function (err, result) {
            if (err) {
                HttpResponseSender.sendError(req, res, err);
                return;
            }
            if (result == null) res.status(204)
            else {
                res.status(201)
                res.json(result);
            }
        }
    }

    public static sendDeletedResult(req: any, res: any): (err: any, result: any) => void {
        return function (err, result) {
            if (err) {
                HttpResponseSender.sendError(req, res, err);
                return;
            }
            if (result == null) res.status(204)
            else {
                res.status(200)
                res.json(result);
            }
        }
    }
}
