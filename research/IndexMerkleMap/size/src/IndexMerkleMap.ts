import { Experimental, Field, Provable, Struct, ZkProgram } from "o1js"

class MerkleMap extends Experimental.IndexedMerkleMap(22) { }

export class KeyAndVals extends Struct({
    keys: Provable.Array(Field, 1000),
    values: Provable.Array(Field, 1000)
}) { }

const add1000Entries = async (map: MerkleMap, values: KeyAndVals): Promise<{ publicOutput: Field }> => {
    for (let index = 0; index < 100; index++) {
        map.insert(values.keys[index], values.values[index]);
    }
    return {
        publicOutput: map.root
    }
}

export const add1000EntriesProgram = ZkProgram({
    name: "Add 1000 Entries",
    publicInput: Experimental.IndexedMerkleMap(33),
    publicOutput: Field,
    methods: {
        add1000Entries: {
            privateInputs: [KeyAndVals],
            method: add1000Entries
        }
    }
})