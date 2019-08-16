<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [tupelo-wasm-sdk](./tupelo-wasm-sdk.md) &gt; [Dag](./tupelo-wasm-sdk.dag.md)

## Dag class

Underlies a ChainTree, it represents a DAG of IPLD nodes and supports resolving accross multiple nodes.

<b>Signature:</b>

```typescript
export declare class Dag 
```

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(tip, store)](./tupelo-wasm-sdk.dag._constructor_.md) |  | Constructs a new instance of the <code>Dag</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [dagStore](./tupelo-wasm-sdk.dag.dagstore.md) |  | <code>IDagStore</code> |  |
|  [tip](./tupelo-wasm-sdk.dag.tip.md) |  | <code>CID</code> |  |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [get(cid)](./tupelo-wasm-sdk.dag.get.md) |  | Gets a node from the dag |
|  [resolve(path)](./tupelo-wasm-sdk.dag.resolve.md) |  |  |
|  [resolveAt(tip, path)](./tupelo-wasm-sdk.dag.resolveat.md) |  | Similar to resolve, but allows you to start at a specific tip of a dag rather than the current tip. |
