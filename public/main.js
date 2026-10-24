import { renderList, renderStatus, renderError } from './ui.js';
import { listItems ,subscribeLoading, createItem, editItem, deleteItem } from './api.js';
import { store, subscribe, setState } from './store.js';

subscribe(() => {
    if(store.error){
        renderError(store.error);
    } else {
        renderList(store.items);
    }
});

subscribeLoading(busy => {
    renderStatus(busy);
});

function debounce(fn,ms){
    let t;
    const wrapped = (...arg)=>{
        clearTimeout(t);
        t = setTimeout(()=>fn(...arg),ms);
    };
    wrapped.cancel = ()=> clearTimeout(t);   // 供外部取消还没触发的防抖
    return wrapped;
}

async function getData(q=''){
    try{
        const {data} = await listItems(1,20,q);
        setState({ items: data,error: ''});
    } catch (error) {
        setState({ items: [],error: error.message });
    }
}
getData();

const form = document.getElementById('create-form');
form.addEventListener('submit',async(e)=>{
    e.preventDefault();

    const name = document.getElementById('name-input').value;
    const result = await createItem(name);

    getData();
    document.getElementById('name-input').value = '';
    console.log({result});
})

document.getElementById('list').addEventListener('click',async(e)=>{
    const btn = e.target.closest('.edit-btn')
    if(!btn) return;

    const id = Number(btn.dataset.id);
    const item = store.items.find(i=>i.id==id);
    const name = prompt("改为什么名字",item.name);
    if(!name||!name.trim()) return;

    await editItem(id,name);
    getData();
})

document.getElementById('list').addEventListener('click',async(e)=>{
    const btn = e.target.closest('.delete-btn')
    if(!btn) return;
    if(!confirm('确定删除吗？')) return;
    const id = Number(btn.dataset.id);

    try{
        await deleteItem(id);
        getData();
    } catch(error){
        alert(`删除失败，错误信息：${error}`);
    }
    
})

const debouncedSearch = debounce((q)=>{
    getData(q);
},300);

document.getElementById("search-input").addEventListener('input',(e)=>{
    debouncedSearch(e.target.value);
});

document.getElementById("search-form").addEventListener('submit',(e)=>{
    e.preventDefault();
    debouncedSearch.cancel();   // 按钮点了，就取消还没触发的防抖，立刻搜
    getData(document.getElementById("search-input").value);
})