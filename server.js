const express = require('express');
const app = express();
const port = 3000;

const pool = require('./db');
app.get('/api/items',async (req,res) => {
    const limit = Math.min(Number(req.query.limit||20),100);
    const page = Math.max(Number(req.query.page||1),1);
    const offset = (page-1)*limit;
    const starttime = Date.now();
    const {rows} = await pool.query('SELECT * FROM items where user_id = 1189 order by id limit $1 offset $2',[limit,offset]);
    const endtime = Date.now();
    console.log(`查询第${page}页，limit=${limit}，耗时：${endtime-starttime}ms`);
    res.json({page,limit,data:rows});
})
app.listen(port,()=> {
    console.log(`Server listening at http://localhost:${port}`);
})