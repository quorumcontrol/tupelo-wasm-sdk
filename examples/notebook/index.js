#!/usr/bin/env node

const sdk = require('tupelo-wasm-sdk');
const fs = require('fs');
const yargs = require('yargs');

const LOCAL_ID_PATH = './.notebook-identifiers';
const CHAIN_TREE_NOTE_PATH = 'notebook/notes';

async function identifierObj(key, chain) {
    return {
        unsafePrivateKey: Buffer.from(key.privateKey).toString('base64'),
        chainId: await chain.id()
    };
}

function writeIdentifierFile(configObj) {
    console.log("saving writeIdentifier: ", configObj)
    let data = JSON.stringify(configObj);
    fs.writeFileSync(LOCAL_ID_PATH, data);
}

async function readIdentifierFile() {
    console.log("reading identifiers")
    let raw = fs.readFileSync(LOCAL_ID_PATH);
    const identifiers = JSON.parse(raw);
    const keyBits = Buffer.from(identifiers.unsafePrivateKey, 'base64')
    const key = await sdk.EcdsaKey.fromBytes(keyBits)

    const community = await sdk.Community.getDefault()
    let tree
    try {
        const tip = await community.getTip(identifiers.chainId)
        console.log("found tree")
        tree = new sdk.ChainTree({
            store: community.blockservice,
            tip: tip,
            key: key,
        })
    } catch(e) {
        if (e === 'not found') {
            tree = await sdk.ChainTree.newEmptyTree(community.blockservice, key)
        } else {
            throw e
        }
    }

    return { tree: tree, key: key }
}

function idFileExists() {
    return fs.existsSync(LOCAL_ID_PATH);
}

async function createNotebook() {
    console.log("creating notebook")
    let community = await sdk.Community.getDefault();

    const key = await sdk.EcdsaKey.generate()
    const tree = await sdk.ChainTree.newEmptyTree(community.blockservice, key)
    let obj = await identifierObj(key, tree);
    return writeIdentifierFile(obj);
}

function addTimestamp(note) {
    let ts = new Date().getTime().toString();
    return ts + '::' + note;
}

async function addNote(note) {
    if (!idFileExists()) {
        console.error("Error: you must register before you can record notes.");
        return;
    }

    let { tree } = await readIdentifierFile();
    console.log("resolving data on tree")
    const resp = await tree.resolveData(CHAIN_TREE_NOTE_PATH);
    let notes = resp.value,
        noteWithTs = addTimestamp(note);

    if (notes instanceof Array) {
        notes.push(noteWithTs);
    } else {
        notes = [noteWithTs];
    }

    console.log("saving new notes: ", notes)
    let c = await sdk.Community.getDefault()
    await c.playTransactions(tree, [sdk.setDataTransaction(CHAIN_TREE_NOTE_PATH, notes)])
}

async function showNotes() {
    if (!idFileExists()) {
        console.error("Error: you must register before you can print notes.");
        return;
    }

    let { tree } = await readIdentifierFile();
    let resp = await tree.resolveData(CHAIN_TREE_NOTE_PATH)
    let notes = resp.value

    if (notes instanceof Array) {
        console.log('----Notes----');
        notes.forEach(function (note) {
            console.log(note);
        });
    } else {
        console.log('----No Notes-----');
    }
}

yargs.command('register', 'Register a new notebook chain tree', (yargs) => {
}, async (argv) => {
    await createNotebook();
    process.exit(0)
}).command('add-note', 'Save a note', (yargs) => {
    yargs.describe('n', 'Save a note')
        .alias('n', 'note')
        .demand('n');
}, async (argv) => {
    await addNote(argv.n);
    process.exit(0)
}).command('print-notes', 'Print saved notes', (yargs) => {
}, async (argv) => {
    await showNotes();
    process.exit(0)
}).argv;