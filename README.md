# NetZero Monorepo

NetZero as name suggests aims to verify that a Centralised Authority like a Centralised Exchange has zero net difference between assets and liabilites or confirms that a CEX is financially solvent.

To read more about the topic checkout the [Proposal](https://github.com/0xnullifier/NetZero/tree/main/docs/Proposal.md)

The current project is maintained as a MonoRepo if it grows too much I will refactor it to individual repos

## Project Structure

The Current Structure of the project is as follows:

```bash
.
├── LICENSE 
├── Makefile # you can run the benchmark and test directly from the root folder
├── README.md 
├── core # contains the core project after all the research
│   ├── circuits  # contains the core circuits
│   ├── prover-network # the prover network/backend responsible for generating proofs
│   ├── verifiers # contracts hoseted on Mina that are responsible for verifications
│   └── webui # web ui for the dashboard to see your proofs and assets
├── data-generators # scripts generate dummy data and proofs
├── docs # the documentation for the website
├── o1js-fork # the o1js fork that the project is running on
└── research
    ├── IndexMerkleMap # how does the size of the IMM affects the proving/generating times
    ├── benchmarks # benchmarks for various circuit implementations
    ├── circuitRunner # the circuit runner api is an attempt to make o1js circuits run in a fork faster
    └── circuits # all the circuits implementation to test out which is the best check the proposal for more
    └── circuit-templates # the circuit template

```

## RoadMap

- [ ] Conduct research on Index Merkle Maps decide on the size of Map that is best suitable for the circuits
- [ ] Write Various Circuit Implementation
- [ ] Benchamark the various circuit implemnetation tools
- [ ] Create the `CircuitRunner` API for the prover-network
- [ ] Improve architechture of the prover-network introduce some sort of decentralization/staking mechanism
- [ ] Write verifiers contracts for deployment on devnet
- [ ] WebUi create the webui for the dashboard
- [ ] Dockerize the project and deploy!
- [ ] Write extensive documentation
