// Browser stub for Node built-ins that only the local CLI path of filestore uses.
const stub = {};
export default stub;
export const readFile = undefined;
export const writeFile = undefined;
export const mkdir = undefined;
export const join = (...parts: string[]) => parts.join("/");
