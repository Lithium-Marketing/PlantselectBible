export class JobOLD {
    private cb: () => boolean;
    private limit: number;
    private timeout: any;
    public readonly promise: Promise<void>;
    private resolve: (value: (PromiseLike<void> | void)) => void;
    private reject: (reason?: any) => void;
    
    constructor(cb: () => boolean, limit = 100000) {
        this.cb = cb;
        this.limit = limit;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        })
    }
    
    start() {
        if (this.timeout)
            clearTimeout(this.timeout);
        
        this.timeout = setTimeout(() => {
            const start = Date.now();
            while (Date.now() - start < 50)
                if (this.cb())
                    return this.resolve();
                else if (this.limit-- <= 0)
                    return this.reject(new Error("limit reached"))
            
            this.timeout = false;
            this.start();
        }, 0);
        
        return this.promise;
    }
}
