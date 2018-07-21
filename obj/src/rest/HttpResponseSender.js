"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _ = require('lodash');
const pip_services_commons_node_1 = require("pip-services-commons-node");
class HttpResponseSender {
    static sendError(req, res, error) {
        error = error || {};
        error = pip_services_commons_node_1.ApplicationException.unwrapError(error);
        let result = _.pick(error, 'code', 'status', 'name', 'details', 'component', 'message', 'stack', 'cause');
        result = _.defaults(result, { code: 'Undefined', status: 500, message: 'Unknown error' });
        res.status(result.status);
        res.json(result);
    }
    static sendResult(req, res) {
        return function (err, result) {
            if (err) {
                HttpResponseSender.sendError(req, res, err);
                return;
            }
            if (result == null)
                res.send(204);
            else
                res.json(result);
        };
    }
    static sendEmptyResult(req, res) {
        return function (err) {
            if (err) {
                HttpResponseSender.sendError(req, res, err);
                return;
            }
            res.send(204);
        };
    }
    static sendCreatedResult(req, res) {
        return function (err, result) {
            if (err) {
                HttpResponseSender.sendError(req, res, err);
                return;
            }
            if (result == null)
                res.status(204);
            else {
                res.status(201);
                res.json(result);
            }
        };
    }
    static sendDeletedResult(req, res) {
        return function (err, result) {
            if (err) {
                HttpResponseSender.sendError(req, res, err);
                return;
            }
            if (result == null)
                res.status(204);
            else {
                res.status(200);
                res.json(result);
            }
        };
    }
}
exports.HttpResponseSender = HttpResponseSender;
//# sourceMappingURL=HttpResponseSender.js.map