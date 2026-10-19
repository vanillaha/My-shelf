const subs = [];
export const store = { items: [],error: ''};
export const subscribe = fn => subs.push(fn);
export const setState = patch=>{
    Object.assign(store,patch);
    subs.forEach(fn => fn());
};