const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function auth(req,res,next){
    const token = req.cookies&&req.cookies.token;
    
    if(!token){
        return res.status(401).json({error:'未登录'});
    }

    try{
        req.userId = jwt.verify(token,process.env.JWT_SECRET).user_id;
        next();
    } catch{
        res.status(401).json({error:'登录失效，请重新登录'});
    }
};