import { renderList, renderStatus, renderError } from './ui.js';
import { listItems ,subscribeLoading } from './api.js';
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
