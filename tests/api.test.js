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