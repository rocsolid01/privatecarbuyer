declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}

declare module 'react' {
    export var useState: any;
    export var useEffect: any;
    export var useMemo: any;
    export var useCallback: any;
    export var useRef: any;
    export var createContext: any;
    export var useContext: any;
    export type ReactNode = any;
    export type FC<T = any> = any;
    export type FormEvent = any;
    export type ChangeEvent<T = any> = any;
}

declare module 'lucide-react' {
    export var Save: any;
    export var MapPin: any;
    export var Target: any;
    export var Bell: any;
    export var Zap: any;
    export var TrendingUp: any;
    export var Play: any;
    export var Loader2: any;
    export var Clock: any;
    export var X: any;
    export var ArrowRight: any;
    export var ExternalLink: any;
    export var Car: any;
    export var Ruler: any;
    export var DollarSign: any;
    export var Calendar: any;
    export var MessageSquare: any;
    export var Send: any;
    export var Trash2: any;
    export var Archive: any;
    export var CheckCircle2: any;
}

declare module 'next/server' {
    export type NextRequest = any;
    export type NextResponse = any;
}

declare module 'next/navigation' {
    export var useRouter: any;
    export var useParams: any;
    export var usePathname: any;
}

declare module 'next/link' {
    var Link: any;
    export default Link;
}
