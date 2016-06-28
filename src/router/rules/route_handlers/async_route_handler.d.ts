import { RouteHandler } from './route_handler';
import { RouteData } from '../../instruction';
export declare class AsyncRouteHandler implements RouteHandler {
    private _loader;
    componentType: any;
    data: RouteData;
    constructor(_loader: () => Promise<any>, data?: {
        [key: string]: any;
    });
    resolveComponentType(): Promise<any>;
}