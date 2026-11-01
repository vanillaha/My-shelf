import {test,expect} from 'vitest';
import request from 'supertest';
import app from '../src/server'

async function createUserAndGetCookie(tag) {
    // tag 用来让邮箱唯一，比如 'a'、'b'、'crud'
    const email = `test-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ email, pw: '12345678' });
    const login = await agent.post('/api/auth/login').send({ email, pw: '12345678' });
    expect(login.status).toBe(200);      // 前置条件：没登录成功就别往下测了
    return { agent, email, userId: login.body.id };
}

async function createItem(agent, name) {
    const res = await agent.post('/api/items').send({ name });
    expect(res.status).toBe(201);
    return res;
}

test('能注册',async()=>{
    const email = `test-${Date.now()}@example.com`;
    const res = await request(app).post('/api/auth/register').send({email,pw:'12345678'})
    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
    expect(res.body.id).toBeDefined();
})

test('能登录',async()=>{
    const email = `test-${Date.now()}@example.com`;
     await request(app)
        .post('/api/auth/register')
        .send({email,pw:'12345678'})

    const res = await request(app).post('/api/auth/login').send({email,pw:'12345678'})
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    expect(res.headers['set-cookie']).toBeDefined()
})

test('能成功访问',async()=>{
    const email = `test-${Date.now()}@example.com`;
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({email,pw:'12345678'})

    const loginRes =  await agent.post('/api/auth/login').send({email,pw:'12345678'})

    const res = await agent.get('/api/me');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(loginRes.body.id);
})

test('未登录访问受保护接口返回401', async () => {
    const res = await request(app).get('/api/me');   // 普通 request，全新会话，没有 cookie
    expect(res.status).toBe(401);
});

test('能新建收藏',async()=>{
    const {agent} = await createUserAndGetCookie('create');
    const res = await agent.post('/api/items').send({name:'三体'});
    expect(res.body.name).toBe('三体');
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
})

test('能删除收藏',async()=>{
    const {agent} = await createUserAndGetCookie('edit');
    const item = await createItem(agent,'三体');
    const res = await agent.delete(`/api/items/${item.body.id}`);
    expect(res.status).toBe(204);
    const after = await agent.get('/api/items');
    expect(after.body.data.some(x => x.id === item.body.id)).toBe(false);
})

test('能编辑收藏',async()=>{
    const {agent} = await createUserAndGetCookie('edit');
    const item = await createItem(agent,'三体');
    const res = await agent.patch(`/api/items/${item.body.id}`).send({ name: '新名字' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('新名字');
})

test('能查询收藏',async()=>{
    const {agent} = await createUserAndGetCookie('edit');
    const item = await createItem(agent,'三体');
    const res = await agent.get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.data.some(x => x.id === item.body.id)).toBe(true);
})

test('权限隔离测试',async()=>{
    const a = await createUserAndGetCookie('a');
    const b = await createUserAndGetCookie('b');
    const item = await createItem(a.agent,'a的记录');
    const res = await b.agent.patch(`/api/items/${item.body.id}`).send({ name: '被改掉了' });

    expect([403, 404]).toContain(res.status);
})

// ==================== 负例：注册时的密码长度 ====================
// 这一组不需要登录、不需要前置数据，因为它在“创建用户”这一步就被拦下了

function uniqueEmail(tag) {
    return `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
}

test.each([
    ['缺失', undefined],        // JSON.stringify 会丢掉 undefined，等价于“根本没传 pw”
    ['空串', ''],
    ['7位', '1234567'],         // 下边界-1
    ['全空格', '        '],      // 长度是 8，但不是密码
    ['数字类型', 12345678],      // 没有 .length，能绕过 pw.length<8
])('注册时密码为%s应该返回400', async (_label, pw) => {
    const res = await request(app)
        .post('/api/auth/register')
        .send({ email: uniqueEmail('pw'), pw });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();     // 有返回值：错误信息
    expect(res.body.id).toBeUndefined();     // 不能返回一个“创建成功”的 id
});

test('密码正好8位能注册，并且能用它登录（下边界）', async () => {
    const email = uniqueEmail('pw8');
    const reg = await request(app).post('/api/auth/register').send({ email, pw: '12345678' });
    expect(reg.status).toBe(201);

    // 比只看 201 更硬：这个密码真的能登进来
    const login = await request(app).post('/api/auth/login').send({ email, pw: '12345678' });
    expect(login.status).toBe(200);
    expect(login.body.email).toBe(email);
});

test('正常长度的密码能注册', async () => {
    const res = await request(app)
        .post('/api/auth/register')
        .send({ email: uniqueEmail('pwnormal'), pw: 'correct horse battery' });
    expect(res.status).toBe(201);
});

// ==================== 负例：收藏标题为空 ====================
// 注意：必须先登录。路由是 requireAuth -> handler，不带 cookie 会先被 401 拦下，测不到校验逻辑

async function itemCount(agent) {
    const res = await agent.get('/api/items');
    expect(res.status).toBe(200);
    return res.body.data.length;
}

test.each([
    ['空字符串', ''],
    ['纯空格', '   '],
    ['制表符换行', '\t\n'],
    ['全角空格', '\u3000'],
])('创建收藏时标题为%s应该返回400', async (_label, name) => {
    const { agent } = await createUserAndGetCookie('empty');
    const before = await itemCount(agent);      // 记录之前有几条

    const res = await agent.post('/api/items').send({ name });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
    expect(res.body.id).toBeUndefined();
    expect(await itemCount(agent)).toBe(before); // 关键：没写进数据库
});

test('创建收藏时缺少 name 字段应该返回400', async () => {
    const { agent } = await createUserAndGetCookie('empty');
    const res = await agent.post('/api/items').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
});

test('标题首尾空格会被去掉后入库', async () => {
    const { agent } = await createUserAndGetCookie('trim');
    const res = await agent.post('/api/items').send({ name: '  三体  ' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('三体');
})