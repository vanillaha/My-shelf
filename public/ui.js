 export function renderList(items) {
    document.getElementById('list').innerHTML = items.map(i => `<li>${i.name}.${i.year}</li>`).join('');
 }

 export function renderStatus(loading) {
    document.getElementById('status').textContent = loading ? '加载中…' : '';
 }

 export function renderError(message) {
    document.getElementById('list').innerHTML = `<li>${message}</li>`;
 }