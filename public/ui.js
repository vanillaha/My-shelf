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

 export function renderReportsummary(d){
   const el = document.getElementById('report');
   if(!d || !d.total){
      el.innerHTML = '<p class="report-empty">还没有数据，先去添加几条收藏</p>';
      return;
   }

  // 取最大值，用于把横条画成"占最大值的百分比"
  const typeMax = Math.max(1, ...(d.byType || []).map(r => r.n));
  const statusMax = Math.max(1, ...(d.byStatus || []).map(r => r.n));

  // 评分最高的 5 部：榜单，前三名高亮
  const top5 = (d.top5 || []).map((i, k) =>
    `<li class="rank-item${k < 3 ? ' top' : ''}">
       <span class="rank-no">${k + 1}</span>
       <span class="rank-name">${i.name}</span>
       <span class="rank-meta">${i.type || '?'} · ${i.year || '—'}</span>
       <span class="rank-score">${i.score}</span>
     </li>`
  ).join('');

  // 类别占比：横条图
  const byType = (d.byType || []).map(r =>
    `<li class="bar-row">
       <span class="bar-label">${r.type || '未分类'}</span>
       <span class="bar-track"><span class="bar-fill" style="width:${Math.round(r.n / typeMax * 100)}%"></span></span>
       <span class="bar-num">${r.n}</span>
     </li>`
  ).join('');

  // 状态分布：横条图
  const byStatus = (d.byStatus || []).map(r =>
    `<li class="bar-row">
       <span class="bar-label">${r.status || '无状态'}</span>
       <span class="bar-track"><span class="bar-fill" style="width:${Math.round(r.n / statusMax * 100)}%"></span></span>
       <span class="bar-num">${r.n}</span>
     </li>`
  ).join('');

  // 今年新增：只取前 10 条，避免列表太长
  const recent = (d.recent || []).slice(0, 10).map(i =>
    `<li class="recent-item">${i.name}<span class="recent-type">${i.type || ''}</span></li>`
  ).join('');

  el.innerHTML = `
    <div class="report-card">
      <p class="report-kicker">MY SHELF · 年度报告</p>
      <h2 class="report-title">我的年度收藏报告</h2>

      <div class="report-big">
        <div class="big-cell">
          <span class="big-key">总收藏</span>
          <span class="big-val">${d.total}<small> 条</small></span>
        </div>
        <div class="big-cell">
          <span class="big-key">平均评分</span>
          <span class="big-val">${d.avgScore ?? '—'}<small> /10</small></span>
        </div>
        <div class="big-cell">
          <span class="big-key">已看完</span>
          <span class="big-val">${d.donePct}<small> %</small></span>
        </div>
      </div>

      <div class="report-sec">
        <h3>评分最高 Top5</h3>
        <ol class="rank-list">${top5}</ol>
      </div>

      <div class="report-sec">
        <h3>类别占比</h3>
        <ul class="bar-list">${byType}</ul>
      </div>

      <div class="report-sec">
        <h3>状态分布</h3>
        <ul class="bar-list">${byStatus}</ul>
      </div>

      <div class="report-sec">
        <h3>今年新增</h3>
        <ul class="recent-list">${recent || '<li class="recent-item">暂无</li>'}</ul>
      </div>

      <div class="report-tools">
        <button id="btn-export">导出为图片</button>
      </div>
    </div>
  `;
  document.getElementById('btn-export').addEventListener('click', exportReport);
 }

 export async function exportReport(){
   const el = document.getElementById('report');
   const convas = await html2canvas(el);
   const a = document.createElement('a');
   a.href = convas.toDataURL('image/png');
   a.download = 'My-Shelf-Report.png';
   a.click();
 }