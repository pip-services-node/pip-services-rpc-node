/** @module services */
/** @hidden */
let _ = require('lodash');

import { ApplicationException } from 'pip-services-commons-node';

/**
 * Class that contains static methods for sending various HTTP responses.
 * 
 * ### Examples ###
 * 
 *     public MyMethod() {
 *         let req: any;
 *         let res: any;
 *         let error: any;
 *         ...
 * 
 *         HttpResponseSender.sendError(req, res, error);
 *         ...
 * 
 *         HttpResponseSender.sendResult(req, res);
 *     }
 */
export class HttpResponseSender {
    /**
     * Sends an HTTP error response.
     * 
     * @param req       the request.
     * @param res       the request's result.
     * @param error     the error that was raised.
     */
    public static sendError(req: any, res: any, error: any): void {
        error = error || {};
        error = ApplicationException.unwrapError(error);
        
        let result = _.pick(error, 'code', 'status', 'name', 'details', 'component', 'message', 'stack', 'cause');
        result = _.defaults(result, { code: 'Undefined', status: 500, message: 'Unknown error' });

        res.status(result.status);
        res.json(result);
    }

    /**
     * Sends the result of the given request.
     * 
     * @param req       the request.
     * @param res       the request's result.
     */
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

    /**
     * Sends an empty result (204 no content status) in response to 
     * the given request.
     * 
     * @param req       the request.
     * @param res       the request's result.
     */
    public static sendEmptyResult(req: any, res: any): (err: any) => void {
        return function (err) {
            if (err) {
                HttpResponseSender.sendError(req, res, err);
                return;
            }
            res.send(204);
        }
    }

    /**
     * Sends a response, indicating that the request has been fulfilled, resulting in 
     * the creation of a new resource (HTTP result code 201 - Created).
     * 
     * @param req       the request.
     * @param res       the request's result.
     */
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

    //TODO (note for Sergey): didn't find any mention of a 2xx HTTP code for deletion...
    /**
     * Sends a response, indicating that the request has been fulfilled, resulting in 
     * the deletion of a resource
     * 
     * @param req       the request.
     * @param res       the request's result.
     */
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
