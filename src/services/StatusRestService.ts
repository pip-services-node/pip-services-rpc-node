/** @module services */
import { ContextInfo } from 'pip-services-components-node';
import { Descriptor } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { StringConverter } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';

import { RestService } from './RestService';

export class StatusRestService extends RestService {
    private _startTime: Date = new Date();
    private _references2: IReferences;
    private _contextInfo: ContextInfo;
    private _route: string = "status";

    public constructor() {
        super();
        this._dependencyResolver.put("context-info", new Descriptor("pip-services", "context-info", "default", "*", "1.0"));
    }

    public configure(config: ConfigParams): void {
        super.configure(config);

        this._route = config.getAsStringWithDefault("route", this._route);
    }

    public setReferences(references: IReferences): void {
        this._references2 = references;
        super.setReferences(references);

        this._contextInfo = this._dependencyResolver.getOneOptional<ContextInfo>("context-info");
    }

    public register(): void {
        this.registerRoute("get", this._route, null, (req, res) => { this.status(req, res); });
    }

    private status(req, res): void {
        let id = this._contextInfo != null ? this._contextInfo.contextId : "";
        let name = this._contextInfo != null ? this._contextInfo.name : "Unknown";
        let description = this._contextInfo != null ? this._contextInfo.description : "";
        let uptime = new Date().getTime() - this._startTime.getTime();
        let properties = this._contextInfo != null ? this._contextInfo.properties : "";

        let components = [];
        if (this._references2 != null) {
            for (let locator of this._references2.getAllLocators())
                components.push(locator.toString());
        }

        let status =  {
            id: id,
            name: name,
            description: description,
            start_time: StringConverter.toString(this._startTime),
            current_time: StringConverter.toString(new Date()),
            uptime: uptime,
            properties: properties,
            components: components
        };

        this.sendResult(req, res)(null, status);
    }
}