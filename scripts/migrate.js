const fs = require('fs');
const path = require('path');
const pool =require('../src/db');

const dir = path.join(__dirname, '..', 'migrations');

(async () => {
    try {
        const files =fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
        for(const f of files){
            const sql = fs.readFileSync(path.join(dir,f),'utf-8');
            await pool.query(sql);
            console.log(`执行迁移文件：${f}`);
        }
        console.log('已执行迁移共', files.length, '个文件');
        process.exit(0);
    }
    catch (e){
        console.error('执行迁移时出错：', e);
        process.exit(1);
    }
})();