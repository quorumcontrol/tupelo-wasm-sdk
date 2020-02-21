module.exports = {
    exit: true,
    require: 'ts-node/register',
    timeout: 60000,
    spec: ['src/*.spec.ts', 'src/**/*.spec.ts'],
}
