let count = 0;
const subs = [];
function subscribeLoading(fn) { subs.push(fn); }
function notify() { subs.forEach(fn => fn(count > 0)); }

async function request(path,options={}) {
    count += 1;
    notify();
    try {
        let res;
        try {
            res = await fetch(path,{
                headers: {
                    'content-type': 'application/json'
                },
                ...options
            });
        } catch {
            throw new Error('服务连接失败，请检查后端是否已启动');
        }
        if (!res.ok) {
            throw new Error(`请求失败（HTTP ${res.status}）`);
        }

        if(res.status===204){
            return null;
        }

        return await res.json();
    } finally {
        count -= 1;
        notify();
    }
}

export { subscribeLoading };
export const listItems = (page=1,limit=20,q='')=>{
    return request(`/api/items?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`)
}

export const createItem = (name)=>{
    return request('/api/items',{method:'POST',body:JSON.stringify({name})})
}

export const editItem = (id,name)=>{
    return request(`/api/items/${id}`,{method:'PATCH',body:JSON.stringify({name})})
}

export const deleteItem = (id)=>{
    return request(`/api/items/${id}`,{method:'DELETE'})
}

