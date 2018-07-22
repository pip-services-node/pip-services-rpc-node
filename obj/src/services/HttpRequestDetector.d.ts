export declare class HttpRequestDetector {
    static detectPlatform(req: any): string;
    static detectBrowser(req: any): string;
    static detectAddress(req: any): string;
    static detectServerHost(req: any): string;
    static detectServerPort(req: any): number;
}
