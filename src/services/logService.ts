type LogGroup = {
    group: string | false
    logs: (LogEntry | LogGroup)[]
}

enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    TRACE = 'trace'
}

type LogEntry = {
    type: LogLevel
    prefix?: string
    val: any
    logger?: string
}

export class LogService {
    
    public static readonly outputLogLevel: Record<LogLevel, boolean> = {
        [LogLevel.ERROR]: true,
        [LogLevel.WARN]: true,
        [LogLevel.INFO]: true,
        [LogLevel.DEBUG]: true,
        [LogLevel.TRACE]: true,
    };
    
    /**
     * undefined = true
     */
    public static readonly outputLoggers: Record<string, boolean> = {};
    
    private static stack: LogGroup[] = [{
        group: false,
        logs: []
    }];
    
    private static readonly loggers: Record<string, Logger> = {}
    
    static logger(config: LoggerConfig): Logger {
        Object.freeze(config)
        if (this.loggers[config.name])
            throw new Error(`Logger with name '${config.name}' already created.`);
        
        const l = this;
        const times = {};
        const groups = [];
        
        function _log(val: any, type: LogLevel) {
            l.add({
                type,
                prefix: config.name,
                val: typeof val === 'string' ? val : JSON.stringify(val),
                logger: config.name
            });
        }
        
        return this.loggers[config.name] = {
            trace(...args) {
                _log(args, LogLevel.TRACE);
            },
            warn(...args) {
                _log(args, LogLevel.WARN);
            },
            debug(...args) {
                _log(args, LogLevel.DEBUG);
            },
            info(...args) {
                _log(args, LogLevel.INFO);
            },
            log(...args) {
                _log(args, LogLevel.DEBUG);
            },
            error(...args) {
                _log(args, LogLevel.ERROR);
            },
            time(name) {
                times[name] = performance.now()
            },
            timeEnd(name) {
                if (!times[name])
                    throw new Error(`No timer with name '${name}' was created`);
                
                const time = performance.now() - times[name];
                const l = Math.floor(Math.log10(time));
                
                delete times[name];
                
                if (l > 3) {
                    _log(`[Timer: ${name}] ${time / 1000} s`, LogLevel.DEBUG);
                    return;
                }
                _log(`[Timer: ${name}] ${time} ms`, LogLevel.DEBUG);
            },
            group(name: string) {
                groups.push(l.begin(name));
            },
            groupEnd() {
                groups.pop()();
            }
        };
    }
    
    /**
     * @param name of the group
     * @return function to be called when closing group
     */
    static begin(name: string) {
        const log: LogGroup = {
            group: name,
            logs: []
        };
        this.stack[this.stack.length - 1].logs.push(log);
        this.stack.push(log);
        
        let closed = false;
        return () => {
            if (closed)
                return;
            closed = true;
            
            while (this.stack[this.stack.length - 1] !== log) {
                this.add({type: LogLevel.WARN, val: "Log group was not closed. Closing."});
                this.stack.pop();
                
                if (this.stack.length === 0)
                    throw new Error();
            }
            
            this.stack.pop();
        }
    }
    
    static add(log: LogEntry) {
        this.stack[this.stack.length - 1].logs.push(log);
        
        const txt = [
            this.stack[this.stack.length - 1].group ? `<${this.stack[this.stack.length - 1].group}>` : '',
            log.prefix ? `[${log.prefix}]` : "",
            log.val
        ];
        if (LogService.outputLogLevel[log.type] && LogService.outputLoggers[log.logger]!==false)
            switch (log.type) {
                case LogLevel.ERROR:
                    console.error(...txt);
                    break;
                case LogLevel.WARN:
                    console.warn(...txt);
                    break;
                case LogLevel.INFO:
                    console.info(...txt);
                    break;
                case LogLevel.DEBUG:
                    console.log(...txt);
                    break;
                case LogLevel.TRACE:
                    console.trace(...txt);
                    break;
            }
    }
    
    static json(){
        return JSON.stringify(this.stack[0]);
    }
}


export interface Logger {
    error(...args);
    
    warn(...args);
    
    info(...args);
    
    debug(...args);
    
    /**
     * same as debug
     * @param args
     */
    log(...args);
    
    trace(...args);
    
    time(name: string);
    
    timeEnd(name: string);
    
    group(name: string);
    
    groupEnd();
}

export interface LoggerConfig {
    name: string
}

declare global {
    interface Window { LogService: typeof LogService; }
}

window.LogService = window.LogService || LogService;
