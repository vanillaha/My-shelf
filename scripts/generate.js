// scripts/generate.js —— 生成测试数据集
//
// 用法：
//   node scripts/generate.js 100             → data/books_100.csv
//   node scripts/generate.js 10000           → data/books_10000.csv
//   node scripts/generate.js 10000 big.csv   → data/big.csv
//
// 输出格式和 data/book.csv 完全一致（9 列 + CRLF 换行），
// 所以 import.js 不用改任何解析逻辑就能直接吃它。

const fs = require('fs');
const path = require('path');

const N = Number(process.argv[2]) || 10000;
const filename = process.argv[3] || 'books_' + N + '.csv';

// 用 __dirname 拼路径，而不是写相对路径或绝对路径。
// 这样无论你在哪个目录敲 node，都能找到正确的位置。
const dataDir = path.join(__dirname, '..', 'data');
const outPath = path.join(dataDir, filename);

// ─────────────────────────────────────────────────────────
// 固定种子的伪随机
//
// 这里刻意不用 Math.random()。原因：Math.random() 每次的结果都不一样，
// 于是「今天跑一次、明天再跑一次」会得到两份不同的数据 —— 那么 W4 做
// 「加索引前 vs 加索引后」的耗时对比时，你根本分不清差异是索引带来的，
// 还是数据变了带来的。
//
// 下面这个叫线性同余发生器（LCG），给定同一个种子，它产出的序列永远相同。
// 所以本脚本跑两次，生成的文件逐字节一致（可复现 / reproducible）。
// ─────────────────────────────────────────────────────────
let seed = 20261016;
function rnd() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648; // 归一到 [0, 1)
}
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));

// 书名由「前缀 + 词干 + 后缀」三段拼成，保证有变化。
// 如果 1 万条都叫「书1」「书2」，那 LIKE '%岛屿%' 这类搜索就测不出真实性能。
const prefix = ['遥远的', '沉默的', '燃烧的', '第七个', '最后的', '午夜',
                '南方', '无名', '缓慢的', '巨大的', ''];
const core   = ['岛屿', '列车', '图书馆', '夏天', '雨林', '星图', '旅人',
                '回声', '花园', '灯塔', '河流', '镜子', '钟表', '山谷',
                '候鸟', '沙漏', '剧场', '雪原', '果园', '海湾'];
const suffix = ['', '（上）', '的秘密', '手记', '：一个故事', '之歌', '之下', ''];
const types  = ['小说', '科幻', '历史', '哲学', '科普', '传记', '童话', '诗歌'];
const states = [['已读', '已读'], ['想看', ''], ['在读', '在读']];

// 每条的时间戳错开 37 分钟，避免一万条全挤在同一秒
function ts(i) {
  const d = new Date(Date.UTC(2026, 0, 1) + i * 37 * 60 * 1000);
  return d.toISOString().replace('T', ' ').slice(0, 19) + '+00';
}

const rows = ['id,user_id,name,type,year,score,tag,status,created_at'];

for (let i = 1; i <= N; i++) {
  const [tag, status] = pick(states);
  rows.push([
    i,                                   // id（迁移时 RESTART IDENTITY，正好对得上）
    1001 + (i % 200),                    // user_id：200 个用户轮流，每人约 50 条
    pick(prefix) + pick(core) + pick(suffix),
    pick(types),
    between(1900, 2024),                 // year
    (between(60, 99) / 10).toFixed(1),   // score：6.0 ~ 9.9
    tag,
    status,
    ts(i),
  ].join(','));
}

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(outPath, rows.join('\r\n') + '\r\n', 'utf8');

console.log('已生成 ' + N + ' 条 → data/' + filename);
