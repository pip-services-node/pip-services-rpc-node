let assert = require('chai').assert;
let restify = require('restify');
let async = require('async');

import { Descriptor } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { References } from 'pip-services-commons-node';

import { HeartbeatRestService } from '../../src/status/HeartbeatRestService';

var restConfig = ConfigParams.fromTuples(
    "connection.protocol", "http",
    "connection.host", "localhost",
    "connection.port", 3000
);

suite('HeartbeatRestService', ()=> {
    let service: HeartbeatRestService;
    let rest: any;

    suiteSetup((done) => {
        service = new HeartbeatRestService();
        service.configure(restConfig);

        service.open(null, done);
    });
    
    suiteTeardown((done) => {
        service.close(null, done);
    });

    setup(() => {
        let url = 'http://localhost:3000';
        rest = restify.createJsonClient({ url: url, version: '*' });
    });
    
    test('Status', (done) => {
        rest.get('/heartbeat',
            (err, req, res, result) => {
                assert.isNull(err);
                
                assert.isNotNull(result);

                done();
            }
        );
    });

});
