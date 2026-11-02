const pino = require('pino');
const isProd = process.env.NODE_ENV === 'production';

module.exports = pino({
    level: isProd ? 'info' : 'debug',
    ...(isProd ? {}: {
        transport: {
            target: 'pino-pretty'}})
});