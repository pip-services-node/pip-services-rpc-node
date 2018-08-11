/** @module services */
/**
 * Interface for registering [[HttpEndpoint HTTP endpoints]] in a dynamic discovery service. 
 * 
 * @see [[HttpEndpoint]]
 */
export interface IRegisterable {
    /**
     * Abstract method that will contain the logic for registering the current component in a 
     * dynamic discovery service.
     */
    register(): void;
}