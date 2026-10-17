const fs = require('fs');
const pool = require('../db');

const dir = fs.readFileSync('E:\\Project\\myshelf\\data\\books_10000.csv','utf-8').split('\r\n').filter(l => l.trim()!='').slice(1);
//console.log(dir);
const Batch = 1000;
(async () => {
    for(let i=0;i<dir.length;i+=Batch){
        const batch = dir.slice(i,i+Batch);
        //console.log(batch);
        const group = [];
        const params = [];
        batch.forEach((line,j) => {
            const b=line.split(',');
            const c=j*7;
            group.push(`($${c+1},$${c+2},$${c+3},$${c+4},$${c+5},$${c+6},$${c+7})`);
            params.push(Number(b[1]),b[2],b[3],Number(b[4]),b[5],b[6],b[7]);
        });
        await pool.query(`insert into items(user_id, name, type, year, score, tag, status) values ${group.join(',')}`,params);
    }
    process.exit(0);
 })();