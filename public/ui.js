 export function renderList(items) {
   if(items.length===0){
      document.getElementById('list').innerHTML = '<li>没有找到结果</li>';
      return;
   }
    document.getElementById('list').innerHTML = items.map(i => `<li>${i.name}${i.year ? '·' + i.year: ''}
      <button class = "edit-btn" data-id = "${i.id}">改</button>
      <button class = "delete-btn" data-id = "${i.id}">删除</button>
      </li>`)
      .join('');
 }

 export function renderStatus(loading) {
    document.getElementById('status').textContent = loading ? '加载中…' : '';
 }

 export function renderError(message) {
    document.getElementById('list').innerHTML = `<li>${message}</li>`;
 }