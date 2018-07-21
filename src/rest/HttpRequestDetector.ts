export class HttpRequestDetector {

    public static detectPlatform(req: any): string {
        let ua = req.headers['user-agent'];
        let version;

        if (/mobile/i.test(ua)) {
            return 'mobile';
        }
        if (/like Mac OS X/.test(ua)) {
            version = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/.exec(ua)[2].replace(/_/g, '.');
            if (/iPhone/.test(ua)) {
                return 'iphone ' + version;
            }
            if (/iPad/.test(ua)) {
                return 'ipad ' + version;
            }
            return 'macosx ' + version;
        }
        if (/Android/.test(ua)) {
            version = /Android ([0-9\.]+)[\);]/.exec(ua)[1];
            return 'android ' + version;
        }
        if (/webOS\//.test(ua)) {
            version = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];
            return 'webos ' + version;
        }
        if (/(Intel|PPC) Mac OS X/.test(ua)) {
            version = /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/.exec(ua)[2].replace(/_/g, '.');
            return 'mac ' + version;
        }

        if (/Windows NT/.test(ua)) {
            version = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];
            return 'windows ' + version;
        }
        return 'unknown';
    }

    public static detectBrowser(req: any): string {
        let ua = req.headers['user-agent'];

        if (/chrome/i.test(ua))
            return 'chrome'
        if (/msie/i.test(ua))
            return 'msie';
        if (/firefox/i.test(ua))
            return 'firefox';
        if (/safari/i.test(ua))
            return 'safari';

        return ua || 'unknown';
    }

    public static detectAddress(req: any): string {
        let ip = null;

        if (req.headers['x-forwarded-for']) {
            ip = req.headers['x-forwarded-for'].split(',')[0]
        }

        if (ip == null && req.ip) {
            ip = req.ip;
        }

        if (ip == null && req.connection) {
            ip = req.connection.remoteAddress;
            if (!ip && req.connection.socket) {
                ip = req.connection.socket.remoteAddress;
            }
        }

        if (ip == null && req.socket) {
            ip = req.socket.remoteAddress;
        }

        // Remove port
        if (ip != null) {
            ip = ip.toString();
            var index = ip.indexOf(':');
            if (index > 0) {
                ip = ip.substring(0, index);
            }
        }

        return ip;
    }

    public static detectServerHost(req: any): string {
        return req.host;
    }

    public static detectServerPort(req) {
        var
            host = req.get('host'),
            index = host.indexOf(':');

        if (index > 0) {
            return parseInt(host.substring(index + 1)) || 80;
        }

        return 80;
    }

}
