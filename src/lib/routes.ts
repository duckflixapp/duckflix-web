export class RouteNode {
    private _parent: RouteNode | null;
    private _id: string;
    private routeOfMemo: Map<string, string> = new Map();
    constructor(
        public readonly name: string,
        public readonly _index: string | null,
        public readonly config?: {
            element?: React.LazyExoticComponent<React.ComponentType<unknown>> | React.ComponentType<unknown>;
            guard?: 'protected' | 'admin' | 'contributor' | 'stepup';
            scope?: string;
            suspenseLabel?: string;
            children?: RouteNode[];
        }
    ) {
        this._id = crypto.randomUUID();
        this._parent = null;
        this.config?.children?.forEach((child) => (child.parent = this));
    }

    public get id() {
        return this._id;
    }

    public set parent(parent: RouteNode) {
        this._parent = parent;
    }

    public get index(): string | undefined {
        return this._index ?? undefined;
    }

    public get path(): string {
        if (this._parent == null) return this.index ?? '';

        const parentPath = this._parent.path ?? '';
        const currentPath = this.index ?? '';

        if (!currentPath) return parentPath;

        return `${parentPath.replace(/\/$/, '')}/${currentPath.replace(/^\//, '')}`;
    }

    // search children and children inside wrappers
    public findChild(name: string): RouteNode | null {
        const childrens = this.config?.children?.flatMap(flatMapWithChildren);
        return childrens?.find((c) => c.name === name) ?? null;
    }

    public getNodeByKeyParts(parts: string[]) {
        return parts.reduce<RouteNode | null>((node, part) => {
            if (!node) return null;
            return node.findChild(part);
        }, this);
    }

    public routeOf(key: string): string {
        if (this.routeOfMemo.has(key)) return this.routeOfMemo.get(key)!;
        const parts = key.split('.');
        const route = this.getNodeByKeyParts(parts)?.path ?? '/not-found';
        this.routeOfMemo.set(key, route);
        return route;
    }
}

const memoizeFlatChildren: Map<string, RouteNode[]> = new Map();
const flatMapWithChildren = (node: RouteNode): RouteNode[] => {
    if (!!node.index) return [node];
    if (memoizeFlatChildren.has(node.id)) return memoizeFlatChildren.get(node.id)!;
    const children = node.config?.children?.flatMap(flatMapWithChildren) ?? [];
    memoizeFlatChildren.set(node.id, children);
    return children;
};
