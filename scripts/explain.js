const pool = require('../src/db');
const userId = Number(process.argv[2]||6);
const keyword = process.argv[3]||'列车';

(async()=>{
    const sql = `select * from items where user_id=$1 and name ilike $2 order by id desc limit 20`;
    const {rows} = await pool.query('explain(analyze,buffers) '+sql,[userId,`%${keyword}%`]);
    console.log(`--- user=${userId} keyword=${keyword} ---`);
    rows.forEach(r => console.log(r['QUERY PLAN']));
    await pool.end();
})()