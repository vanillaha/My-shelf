const url = 'http://localhost:3000/api/items?q=列车&page=1';
const warmup=3;
const N=50;

(async()=>{
    const time = [];
    const login = await fetch('http://localhost:3000/api/auth/login',{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email:'bench@myshelf.com',pw:'bench123'})
    });
    const cookie = login.headers.getSetCookie()[0].split(';')[0];
    
    for(let i=0;i<warmup;i++){
        await fetch(url,{ headers: { Cookie: cookie }});
    }
    for(let i=0;i<N;i++){
        const start = Date.now();
        await fetch(url,{ headers: { Cookie: cookie }});
        const end = Date.now();
        time.push(end-start);
    }
    time.sort((a,b)=>a-b);
    const p50 = time[Math.floor(N*0.5)];
    const p95 = time[Math.floor(N*0.95)];
    const ave = time.reduce((a,b)=>a+b,0)/N;
    console.log(`50%分位数：${p50}ms，95%分位数：${p95}ms，平均值：${ave.toFixed(2)}ms`);
})();