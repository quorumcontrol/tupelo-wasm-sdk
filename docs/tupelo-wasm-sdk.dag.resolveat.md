<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [tupelo-wasm-sdk](./tupelo-wasm-sdk.md) &gt; [Dag](./tupelo-wasm-sdk.dag.md) &gt; [resolveAt](./tupelo-wasm-sdk.dag.resolveat.md)

## Dag.resolveAt() method

Similar to resolve, but allows you to start at a specific tip of a dag rather than the current tip.

<b>Signature:</b>

```typescript
resolveAt(tip: CID, path: Array<string>): Promise<IResolveResponse>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  tip | <code>CID</code> | The tip of the dag to start at |
|  path | <code>Array&lt;string&gt;</code> | the path to find the value |

<b>Returns:</b>

`Promise<IResolveResponse>`
