/** @module services */
/** @hidden */
let _ = require('lodash');

import { ApplicationException } from 'pip-services-commons-node';

/**
 * Class that contains static methods for sending various HTTP responses.
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

    //TODO: is this right?
    /**
     * Sends a response, indicating that the result was created.
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

    //TODO: is this right?
    /**
     * Sends a response, indicating that the result was deleted.
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
