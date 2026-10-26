const express = require('express');
const app = express();
const port = 3000;
const pool = require('./db');
const path = require('path');
const cookieParser = require('cookie-parser');

app.use(cookieParser())
app.use(express.static(path.join(__dirname,'..', 'public')));
app.use(express.json())
app.use('/api/auth',require('./routes/auth'))

app.get('/api/items',async (req,res) => {
    const limit = Math.min(Number(req.query.limit||20),100);
    const page = Math.max(Number(req.query.page||1),1);
    const q = (req.query.q||'').trim();

    const offset = (page-1)*limit;
    const starttime = Date.now();
    const {rows} = await pool.query(
        q 
        ? `SELECT * FROM items where name ilike $1 order by id desc limit $2 offset $3`
        : 'SELECT * FROM items order by id desc limit $1 offset $2',
        q ? [`%${q}%`,limit,offset] : [limit,offset]);
    const endtime = Date.now();
    
    console.log(`查询第${page}页，limit=${limit}，耗时：${endtime-starttime}ms`);
    res.json({page,limit,data:rows});
})

//插入
app.post('/api/items',async(req,res)=>{
    const {name} = req.body;
    const TEMP_USER_ID = 1189;
    const {rows} = await pool.query('INSERT INTO items(name,user_id) VALUES($1,$2) RETURNING *',[name,TEMP_USER_ID]);
    res.status(201).json(rows[0]);
})

//编辑
app.patch('/api/items/:id',async(req,res)=>{
    const id = req.params.id;
    if(!Number.isInteger(Number(id))){
        return res.status(400).json({error: 'id不合法'});
    }

    const {name} = req.body||{};
    if(!name||!String(name).trim()){
        return res.status(400).json({error: 'name不能为空'});
    }

    const {rows} = await pool.query('update items set name = $1 where id = $2 returning *',[String(name).trim(),id]);
    res.status(201).json(rows[0])
})

app.delete('/api/items/:id',async(req,res)=>{
    const id = Number(req.params.id);
    if(!Number.isInteger(id)||id<0){
        return res.status(400).json({error: 'id不合法'});
    }
    const {rowCount} = await pool.query('delete from items where id = $1',[id]);
    
    if(rowCount===0){
        return res.status(404).json({error: '找不到记录'});
    }

    res.status(204).end()
})

app.listen(port,()=> {
    console.log(`Server listening at http://localhost:${port}`);
})