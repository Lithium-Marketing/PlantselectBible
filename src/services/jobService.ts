import {JobOLD} from "@/helper/Job";
import {Services} from "@/services/index";
import {computed, ComputedRef, reactive, Ref, ref} from "vue";
import {BaseService} from "@/helper/baseService";

export class JobService extends BaseService<any, any> {
    public readonly running: ComputedRef<{ [name: string]: number }>;
    
    private readonly jobs: { cb: (() => number), name: string, percent: number }[];
    private timeout: false | number;
    
    constructor(s: Services<any, any>) {
        super(s);
        
        this.jobs = reactive([]);
        this.timeout = false;
        this.running = computed(() => this.jobs.reduce((a, j) => {
            a[j.name] = j.percent;
            return a;
        }, {}));
    }
    
    public add(cb: (() => number) | Promise<unknown>, name: string) {
        let percent = -2;
        
        if (cb instanceof Promise) {
            let completed = false;
            cb.finally(() => completed = true);
            cb = () => {
                return completed ? 1 : -1;
            };
            percent = -1;
        }
        
        this.jobs.push({cb, name, percent});
        
        if (this.timeout === false)
            this.run();
    }
    
    public run() {
        if (this.timeout !== false)
            return;
        this.timeout = setTimeout(() => {
            const start = Date.now();
            while (Date.now() - start < 50) {
                const percent = this.jobs[0].cb();
                this.jobs[0].percent = percent;
                
                if (percent >= 1)
                    this.jobs.shift();
                
                if (percent <= -1)
                    break;
                
                if (!this.jobs.length) {
                    this.timeout = false;
                    return;
                }
            }
            
            this.timeout = false;
            this.run();
        }) as unknown as number;
    }
}