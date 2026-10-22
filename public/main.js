import { renderList, renderStatus, renderError } from './ui.js';
import { listItems ,subscribeLoading, createItem, editItem } from './api.js';
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

async function getData(){
    try{
        const {data} = await listItems();
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