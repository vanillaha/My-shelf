const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT||3000;
const pool = require('./db');
const path = require('path');
const cookieParser = require('cookie-parser');
const requireAuth = require('./middleware/auth')
const logger = require('./logger');

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {          // ① 响应真正发出去的那一刻才触发
    logger.info({
      method: req.method,
      path:   req.originalUrl,
      status: res.statusCode,
      ms:     Date.now() - start,
      userId: req.userId ?? null     // ② auth 中间件算出来的，此时已经存在了
    }, 'request');                   // 'request' 是这条日志的标签
  });

  next();
});


app.use(cookieParser());
app.use(express.static(path.join(__dirname,'..', 'public')));
app.use(express.json());
app.use('/api/auth',require('./routes/auth'));

app.get('/api/me',requireAuth,(req,res)=>{
    res.json({id: req.userId})
})

app.get('/api/items',requireAuth,async (req,res) => {
    const limit = Math.min(Number(req.query.limit||20),100);
    const page = Math.max(Number(req.query.page||1),1);
    const q = (req.query.q||'').trim();
    const userId = req.userId;

    const offset = (page-1)*limit;
    const starttime = Date.now();
    const {rows} = await pool.query(
        q 
        ? `SELECT * FROM items where user_id=$1 and name ilike $2 order by id desc limit $3 offset $4`
        : 'SELECT * FROM items where user_id=$1 order by id desc limit $2 offset $3',
        q ? [userId,`%${q}%`,limit,offset] : [userId,limit,offset]);
    const endtime = Date.now();
    
    // console.log(`查询第${page}页，limit=${limit}，耗时：${endtime-starttime}ms`);
    res.json({page,limit,data:rows});
})

//插入
app.post('/api/items',requireAuth,async(req,res)=>{
    const {name} = req.body;

    if (!name || !String(name).trim()) {
        return res.status(400).json({ error: '标题不能为空' });
    }

    const {rows} = await pool.query('INSERT INTO items(name,user_id) VALUES($1,$2) RETURNING *',[String(name).trim(),req.userId]);
    res.status(201).json(rows[0]);
})

//编辑
app.patch('/api/items/:id',requireAuth,async(req,res)=>{
    const id = req.params.id;
    if(!Number.isInteger(Number(id))){
        return res.status(400).json({error: 'id不合法'});
    }

    const {name} = req.body||{};
    if(!name||!String(name).trim()){
        return res.status(400).json({error: 'name不能为空'});
    }

    const {rows} = await pool.query('update items set name = $1 where id = $2 and user_id = $3 returning *',[String(name).trim(),id,req.userId]);

    if(rows.length===0){
        return res.status(404).json({error: '找不到记录'});
    }
    res.status(200).json(rows[0])
})

app.delete('/api/items/:id',requireAuth,async(req,res)=>{
    const id = Number(req.params.id);
    if(!Number.isInteger(id)||id<0){
        return res.status(400).json({error: 'id不合法'});
    }
    const {rowCount} = await pool.query('delete from items where id = $1 and user_id = $2',[id,req.userId]);
    
    if(rowCount===0){
        return res.status(404).json({error: '找不到记录'});
    }

    res.status(204).end()
})

app.get('/api/ping',async(req,res)=>{
    res.json({ok:true});
})

app.get('/api/report/summary',requireAuth,async(req,res)=>{
    const userId = req.userId;
    const yearStart = new Date().getFullYear() + '-01-01';

    const [
    big,      // ① 总数 / 平均分 / 看完数
    top5,     // ② 评分最高 5 部
    type,     // ⑤ 类别占比
    status,   // ⑥ 状态分布
    recent,   // ⑦ 今年收藏列表
  ] = await Promise.all([
    pool.query(
        `select count(*) as total,
        round(avg(score),2) as avg_score,
        count(*) filter (where status='看完') as done_count from items
        where user_id=$1`, [userId]),

    pool.query(`select id,name,type,year,score from items
                where user_id=$1 and score is not null
                order by score desc, id asc limit 5`, [userId]),

    pool.query(`select type, count(*) as n from items
                where user_id=$1 group by type order by n desc`, [userId]),

    pool.query(`select status, count(*) as n from items
                where user_id=$1 group by status order by n desc`, [userId]),

    pool.query(`select id,name,type,status,created_at from items
                where user_id=$1 and created_at >= $2
                order by created_at desc`, [userId, yearStart]),
    ]); 

    res.json({
        total: big.rows[0].total,
        avgScore: big.rows[0].avg_score,
        donePct: big.rows[0].total
            ? Math.round(big.rows[0].done_count / big.rows[0].total * 100)
            : 0,
        top5: top5.rows,
        byType: type.rows,
        byStatus: status.rows,
        recent: recent.rows
    });
})

if(require.main===module){
    app.listen(port,()=> {
    console.log(`Server listening at http://localhost:${port}`);
})
}

module.exports = app;