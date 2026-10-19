let count = 0;
const subs = [];
function subscribeLoading(fn) { subs.push(fn); }
function notify() { subs.forEach(fn => fn(count > 0)); }

async function request(path) {
    count += 1;
    notify();
    try {
        let res;
        try {
            res = await fetch(path);
        } catch {
            throw new Error('服务连接失败，请检查后端是否已启动');
        }
        if (!res.ok) {
            throw new Error(`请求失败（HTTP ${res.status}）`);
        }
        return await res.json();
    } finally {
        count -= 1;
        notify();
    }
}

export { request, subscribeLoading };
export const listItems = (page=1,limit=20)=>{
    return request(`/api/items?page=${page}&limit=${limit}`)
}