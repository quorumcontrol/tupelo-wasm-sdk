module.exports = {
    exit: true,
    require: 'ts-node/register',
    timeout: 35000, // wait at least the 30s default timeout in tupelo
    spec: ['src/*.spec.ts', 'src/**/*.spec.ts'],
}
