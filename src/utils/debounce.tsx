// code generated with ai
interface DebouncedFunc {
    (event: any): void;
    apply?: any;
}

interface DebounceReturn {
    (...args: any[]): void;
}

export default function debounce(func: DebouncedFunc, delay: number = 500): DebounceReturn {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    return function(this: any, ...args: any[]) {
        clearTimeout(timerId as any);
        timerId = setTimeout(() => func.apply(this, args), delay);
    };
}
