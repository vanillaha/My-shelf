日期：W1 2026/10/16
导入一万条数据（初始）：6.436s
未导入数据库索引之前八次查询时间：2586ms，2494ms，280ms，2827ms，274ms，2500ms，283ms，284ms
导入数据库索引之后八次查询时间：2557ms，2517ms，282ms，290ms，282ms，282ms，283ms，282ms
除冷启动的几次之外发现查询时间相差不大，初步估计是由于单次查询条数太少所以暂时无法看出差别

日期：W4 2026/11/1
加入模糊加速之前：
node scripts/explain.js 6 列车          Execution Time: 8.424 ms
node scripts/explain.js 6 zzzz          Execution Time: 24.416 ms
node scripts/explain.js 6 遥远的列车     Execution Time: 2.017 ms
加入模糊加速之后：
node scripts/explain.js 6 列车          Execution Time: 7.732 ms
node scripts/explain.js 6 zzzz          Execution Time: 1.708 ms
node scripts/explain.js 6 遥远的列车     Execution Time: 2.004 ms