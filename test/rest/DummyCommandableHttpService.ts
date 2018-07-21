import { Descriptor } from 'pip-services-commons-node';
import { CommandableHttpService } from '../../src/rest/CommandableHttpService';

export class DummyCommandableHttpService extends CommandableHttpService {
    public constructor() {
        super('dummy');
        this._dependencyResolver.put('controller', new Descriptor('pip-services-dummies', 'controller', 'default', '*', '*'));
    }
}