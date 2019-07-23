declare module 'cids' {
	import { stringify } from "querystring";

	interface SerializedCID {
		codec: string
		version: number
		multihash: Buffer
	}

	export default class CID {
		constructor(version: string|number|Buffer|CID, codec?: string, multihash?: Buffer, multibaseName?: string)
		static isCID(other: any): boolean
		static validateCID(other: any): void
		codec: string
		version: number
		multihash: Buffer
		buffer: Buffer
		prefix: Buffer
		toV0(): CID
		toV1(): CID
		toBaseEncodedString(base?: string): string
		toJSON(): SerializedCID
		equals(other: CID): boolean
	}
}