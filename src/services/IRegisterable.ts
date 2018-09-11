/** @module services */
/**
 * Interface for registering [[HttpEndpoint HTTP endpoints]] in a dynamic discovery service. 
 * 
 * @see [[HttpEndpoint]]
 * 
 * ### Examples ###
 * 
 *     export class MyDataRegisterable implements IRegisterable {
 *         public register(): void {...}
 *         ...
 *     }
 */
export interface IRegisterable {
    /**
     * Abstract method that will contain the logic for registering the current component in a 
     * dynamic discovery service.
     */
    register(): void;
}