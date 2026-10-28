const router = require('express').Router()
const bcrypt = require('bcrypt')
const pool = require('../db')
const jwt = require('jsonwebtoken')
require('dotenv').config();

router.post('/register',async(req,res)=>{
    const {email,pw} = req.body||{};

    if(!email||!pw||pw.length<8){
        return res.status(400).json({error:'邮箱或密码不合法!'});
    }

    const hash = await bcrypt.hash(pw,10);

    try{
        const {rows} = await pool.query('insert into users (email,pw_hash) values ($1,$2) returning id,email',[email,hash]);
        res.status(201).json(rows[0]);
    }   catch(e){
        if(e.code==='23505'){
            return res.status(409).json({error:'该邮箱已注册！'});
        }
        throw e;
    }
    
})

router.post('/login',async(req,res)=>{
    const {email,pw} = req.body||{};

    if(!email || !pw) return res.status(400).json({error:'邮箱和密码不能为空'});

    const {rows} = await pool.query('select * from users where email=$1',[email]);
    const u = rows[0];

    if(!u||!(await bcrypt.compare(pw,u.pw_hash))){
        return res.status(401).json({error:'邮箱或密码错误，请重新输入!'});
    }
    
    const token = jwt.sign({user_id:u.id},process.env.JWT_SECRET,{expiresIn: '7d'});
    res.cookie('token',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'});
    res.json({id:u.id,email:u.email});
})

router.post('/logout',async(req,res)=>{
    res.clearCookie('token', { httpOnly:true, sameSite:'lax', secure: process.env.NODE_ENV==='production' });
    res.json({ok: true});
})

module.exports = router;