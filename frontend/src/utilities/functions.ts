export function isEmpty(obj: any) {
    return Object.keys(obj).length === 0;
}

export const delay = (delayInMS: number) => {
    return new Promise(resolve => setTimeout(resolve, delayInMS));
}
