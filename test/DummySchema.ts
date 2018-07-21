import { TypeCode } from 'pip-services-commons-node';
import { ObjectSchema } from 'pip-services-commons-node';

export class DummySchema extends ObjectSchema {

    public constructor() {
        super();
        this.withOptionalProperty("id", TypeCode.String);
        this.withRequiredProperty("key", TypeCode.String);
        this.withOptionalProperty("content", TypeCode.String);
    }

}
