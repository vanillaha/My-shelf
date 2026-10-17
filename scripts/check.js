const pool = require('../db');
(async () => {
    try {
        const {rows} = await pool.query('SELECT count(*)::int as n FROM items');
        console.log("当前记录：",rows[0].n)
    } catch (e){
        console.error(e);
    } finally {
        await pool.end();
    }
})();