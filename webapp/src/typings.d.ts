// For JSX syntax
declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}

// For CSS modules
declare module '*.css' {
    const classes: { [key: string]: string };
    export default classes;
}

declare module '*.scss' {
    const classes: { [key: string]: string };
    export default classes;
}
