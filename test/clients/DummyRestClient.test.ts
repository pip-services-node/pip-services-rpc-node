import { Descriptor } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { References } from 'pip-services-commons-node';

import { DummyController } from '../DummyController';
import { DummyRestService } from '../services/DummyRestService';
import { DummyRestClient } from './DummyRestClient';
import { DummyClientFixture } from './DummyClientFixture';

var restConfig = ConfigParams.fromTuples(
    "connection.protocol", "http",
    "connection.host", "localhost",
    "connection.port", 3000
);

suite('DummyRestClient', ()=> {
    let service: DummyRestService;
    let client: DummyRestClient;

    let rest: any;
    let fixture: DummyClientFixture;

    suiteSetup((done) => {
        let ctrl = new DummyController();

        service = new DummyRestService();
        service.configure(restConfig);

        let references: References = References.fromTuples(
            new Descriptor('pip-services-dummies', 'controller', 'default', 'default', '1.0'), ctrl,
            new Descriptor('pip-services-dummies', 'service', 'rest', 'default', '1.0'), service
        );
        service.setReferences(references);

        service.open(null, done);
    });
    
    suiteTeardown((done) => {
        service.close(null, done);
    });

    setup((done) => {
        client = new DummyRestClient();
        fixture = new DummyClientFixture(client);

        client.configure(restConfig);
        client.setReferences(new References());
        client.open(null, done);
    });

    test('CRUD Operations', (done) => {
        fixture.testCrudOperations(done);
    });

});
