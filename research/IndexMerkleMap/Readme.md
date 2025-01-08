# IndexMerkleMap Research

As the circuits in the `NetZero` rely on `IndexMerkleMap` circuit type heavily I have to hit a sweet spot between size and time taken for creating proofs in each map.
The requirements are as follows:

- To handle about 250 million leafs (1 for each user in cex so binance the most popular one has 250 mil) users
- To allow for updates and storage of these maps efficiently ideally it takes < 10-20 seconds for a batch update on the map

So the size that will be measured:

- time taken to serialize and desearlise a `IndexMerkleMap` (this will include time to store and fetch the maps from local redis server)
- time taken to batch update entries in a merkle map (this will be pure update circuits i.e no other things than the update for map)
- The larger map the lesser the complexity but a smaller map can also be chosen and then the maps will
be shared and the root commitment will just be Posideon hash of all the roots for the maps

Some common test rules:

- All test will take place in a minimal alpine image
- The time for compiling the circuit is not accounted for the performance in the circuit
- and all circuits will not run one after another they all will run in different containers at different times isolation
