import { DataPage } from 'pip-services-commons-node';
import { FilterParams } from 'pip-services-commons-node';
import { PagingParams } from 'pip-services-commons-node';

import { Dummy } from './Dummy';

export interface IDummyClient {
    getDummies(correlationId: string, filter: FilterParams, paging: PagingParams, callback: (err: any, result: DataPage<Dummy>) => void): void;
    getDummyById(correlationId: string, dummyId: string, callback: (err: any, result: Dummy) => void): void;
    createDummy(correlationId: string, dummy: Dummy, callback: (err: any, result: Dummy) => void): void;
    updateDummy(correlationId: string, dummy: Dummy, callback: (err: any, result: Dummy) => void): void;
    deleteDummy(correlationId: string, dummyId: string, callback: (err: any, result: Dummy) => void): void;
}
