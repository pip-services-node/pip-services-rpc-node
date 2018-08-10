/** @module services */
//TODO: only HTTP endpoints?
/**
 * Interface for classes that can be added to an [[HttpEndpoint HTTP endpoint]] and that are to
 * register themselves when the HTTP endpoint is opened.
 * 
 * @see [[HttpEndpoint]]
 */
export interface IRegisterable {
    /**
     * Abstract method that will contain the logic for registering the current component in an 
     * HTTP endpoint
     */
    register(): void;
}