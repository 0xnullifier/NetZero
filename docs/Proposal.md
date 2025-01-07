# Proof of Solvency in o1js

## Project Background

Proof of solvency is a tool for centralized exchanges to gain user trust and become transparent about their assets in equity and debt. It ensures that their equity >= debt at any point of time.

In design for proof of solvency we create a world state tree for the user's account balances(debt and equity) and cex balances. The main objective is to ensure correctness and validitation for the total equity >= total debt constraint while building this world tree through zksnarks

It was developed by Privacy + Scaling Explorations you can read more about it [here](https://pse.dev/en/projects/summa)

## Proposal Overview

- **Problem:**
        Centralized exchanges are center for all kinds of borrowing and lending.  User do not trust exchanges with their funds in fear that the exchange is not solvent and this fear is justifiable as we saw the FTX crash making people loose all funds. The exchange cannot just make the data about user assets public to justify solvency as it will be a huge privacy breach.
- **Solution:**
    This problem is solved by proof of solvencies. This enables users and auditors to verify that the centralized exchange is solvent without leaking data about each user's funds.
- **Impact:**
By writing the proof of solvency in o1js and making it more cost efficient and less complex can lead to it's wider adoption among central exchanges thus increasing the popularity of o1js as a ZkDSL.
The circuits can also serve as an example for developers coming to ecosystem as they can see full blown proof generation system in place with o1js. I also plan to create various benchmarks for different circuit designs that one can think off so this will definitely help zkApp developers to see the tradeoff between various design and choose one suitable to their need!
- **Audience:**
    People working on centralized exchanges or anything which handles user's funds in a centralized way.
    Additioanlly all zk and o1js enthusiasts will surely like this work!

## Architecture & Design

- **Detailed Design/Architecture:**

### Explaination for Proof of Solvency

The example below is for the "updated" proof of solvency protocol. This version of the protocol mitigates the "Dummy User Attack" vulnerability which was in the initial version of the protocol.

Let's say there are 2 assets **MINA**,**USDC** in our CEX and 4 Users operate in out cex `U1,U2,U3,U4`. The users interact with our CEX and do the following actions
**NOTE:** In the example below we will take **USDC** as base asset for other tokens 1 **MINA** = 100 **USDC** and 1 **BTC** = 10000 **USDC**.

- `U1` Deposites **100** **MINA** and **10,000** **USDC** to our CEX. then uses the **100** **MINA** as LOAN Collateral for 10000 **USDC**.
- `U2` deposits **20** **MINA**.Swap **10** **MINA** for **1,000** **USDC**
- `U3` deposits **10,000** **USDC**. Uses the **5,000** **USDC** as COLLATERAL Margin for **50** **MINA**.
- `U4` deposits **200** **MINA**. Uses **20** **MINA** as Loan Collateral for **2000**  **USDC**. Swap **1000** **USDC** for **10** **MINA** from `U2`.

**NOTE** The various types of loan collateral(LOAN, COLLATERAL MARGIN, and COLLATERAL PORTFOLIO MARGIN) are to cater to **binance's** loan buisness logic. These loan collateral types may differ from exchange to exchange. I have included them in this implmentation for a fair benchmark angaist other implementaion as not taking them into consideration will lower the parameters.

The user balance sheet for each token:
**MINA Balance Sheet**

| User |  Equity | Debt | COLLATERAL LOAN | COLLATERAL MARGIN |COLLATERAL PORTFOLIO MARGIN |
| ---- | ----------- | --------- | -------------------- | ---------------------- | ---------------- |
| U1   | 100           | 0       | 100                  | 0                      | 0 |
| U2   | 10           | 0        | 0                   | 0                      | 0 |
| U3   | 50          | 50         | 0                    | 0                     | 0                               |
| U4   | 210        | 0         | 0                    | 20                     | 0                               |
| **Total** | **370** | **50**   |     **100**         | **20**                  |

**USDC Balance Sheet**

| User |  Equity |  Debt |  COLLATERAL LOAN |  COLLATERAL MARGIN |  COLLATERAL PORTFOLIO MARGIN |
| ---- | ----------- | --------- | -------------------- | ---------------------- | ------------------------------- |
| U1   | 20,000      | 10,000         | 0                    | 0                      | 0                               |
| U2   | 1,000      |0      | 0                | 0                      | 0 |
| U3   | 10,000           |0   | 0                    | 5,000                  | 0                               |
| U4   | 1,000       | 2,000         | 0                    | 0                      | 0                               |
| **Total** | **32,000** | **12,000** | **0**              | **5,000**                 | **0**                          |

So for **CEX** to be solvent it needs to hold net for each asset i.e ``Total Equity - Total Debt`` . As it has 320 **MINA** and 20,000 **USDC** the platform is solvent for all user

### Dummy User Attack and Tier Ratios

The dummy user attack goes as follows:
A CEX has many assets under control including high market cap and low market cap coins. Let **MINA** be a high Market cap coin and **XYZ** be a low market cap. Consider the following user actions:

- Alice submits 100 **MINA** tokens (100USDC each)
- Bob submit 1000 **XYZ** token (10 USDC each)
- Now an attacker comes and submit 1000 **XYZ** tokens and keep them as collateral for 100 **MINA**.
Now the Platform has 2000 **XYZ** tokens and 0 **MINA** tokens. If alice now would like to withdraw her tokens it can only be done by selling 1000 **XYZ** tokens in the open market and as the market cap of **XYZ** token is low such a huge sell will crash **XYZ** tokens price.

Thus the platform is **insolvent** as:

- The platform now can’t meet its obligations to users because it doesn’t have enough **MINA** in reserves.
- The attacker (Dummy User) effectively caused a drain of the platform’s high-market-cap assets (**MINA**), while leaving the platform stuck with low-market-cap **XYZ** Coin that can’t be easily sold.

**Tier Ratios**
To mitigate the Dummy User attack we introduce tier ratio's which define an array of a collateral haircut which is a reduction in the usable value for collateral asset. For example tier ratios for **MINA** might look like:
`[0-1000 USDC: 100%, 1000-2000 USDC: 90%, 2000-5000 USDC: 80%, ...]`
This means that:
    If the **USDC** value for **MINA** to be used as collateral is within the first range **(0-1000)**, **100%** of its value can be used as collateral.
    If it's between 1000-2000 **USDC**, only **90%** of its value can be used as collateral.
    If it's between 2000-5000 **USDC**, only **80%** can be used.
Thus for low market cap we can adjust the tier ratio's for those asset in such a way that we can prevent the dummy user attack.

### Constraints and Circuit Design

**Main Structures**
A `UserAction` struct is made for every interactions that user does with the exchange. These user actions alter the state of the `CexAssetTree` and the `AccountTree`.With the constraints in the circuit we ensure the correctness in building these Merkle Tree's.
Below are some basic structures along with the `UserAction` Struct.

```javascript!=
class TierRatio extends Struct({
    BoundryValue: UInt64,
    Ratio: UInt64
})

class CexAssets extends Struct({
    totalEquity: UInt64,
    totalDebt: UInt64,
    Baserice: UInt64,
    // All loan Variables
    LoanCollateral: UInt64,
    ...
    
    LoanTierRations: Provable.Array(TierRatio,10) // There will always be 10 tier ratios for each percentage [100-90%,90-80%..]
})

class Asset extends Struct({
    Equit: UInt64,
    Debt: UInt64,
    BasePrice: UInt64,
    // All other loan variables
    LoanCollateral: UInt64,
    ...
})

class UserAction extends Struct({
    beforeAccountRoot: Field, // Account Tree Root before the user actions
    afterAccountRoot: Field, // changed root after the user action
    AccountIndex: UInt64, // the account index in db where the user is stored
    AssetForUpdate: Asset // This will most probably be an array I will try with various lenghts and try to find the best optimized result
}){}
```

**Commitment for Assets**
The Asset Map is used to calculate the commitment for asset's.
![image](https://hackmd.io/_uploads/r19xq0wk1g.png)
Here the `key` is the hash(`assetIndex`) where `assetIndex` represent the index that it is stored by in the database.
The `value` is hash(`TotalEquity,TotalDebt,BasePrice....commitment(loan_variables)`) and the `commitment` is the root of the `AssetMap`

**Commitment for User Accounts**
An Indexed merkle map is used to represent the account tree. In this map

- `Key` - hash(`accountId`) where the `accountId` uniquely represents a `User`
- `Value` - hash(`TotalEquity,TotalDebt,assetCommitment`) where `TotalEquity` and `TotalDebt` is in the base price. `assetCommitment` is calculated simply in this case as it is infeasable to store an Asset Map for each user's asset.

### Circuits and Contract

In our circuit design the main goal is to verify the correctness in buidling of the world state tree i.e

- `CexAsset` Tree/Map
- `UserAssets` Tree/Map

We will run our circuits for a batch of operations. Thus, Let there be `k` batches for building the current world state. So the following circuits are for the `k+1` batch.
**CexAsset Circuit**
Let  $Proof_k$ be the proof of the last batch. Then the following are the inputs to the circuit

- $Proof_k$
- `IndexedMerkleMap` of the `CexAssets`
- `userActions[]` array of useractions done in the batch
Public Output is the root commitment of the `CexAsset` Map.
*Constraints*
- $Proof_k$.`publicOutput` = `CurrentMap.root`
- Apply the `userActions[]` update to the tree ensuring that for each token `TotalEquity > TotalDebt` and the calculation is done in accourdance to the collateral haircuts.

**User Asset**
For User Asset things get a little complicated as the size of `IndexMerkleMap` for user Tree can get large while for the CexAsset a Centralized Exchange such as binance only supports 500 Assets So for this the depth of 9-10 is fine and we can take directly as input to the circuit. But for user's let's say `binance` have 200million which a approx. of depth `28` which may increase proof generation time if we take it direct input. So the Approaches differ in the way we construct circuit inputs and do DB management while the constraint remains the same.
**Approach 1: Direct Map Input**
This is pretty much same as the last circuit.Let  $Proof_k$ be the proof of the last batch. Then the following are the inputs to the circuit

- $Proof_k$
- `IndexedMerkleMap` of the `Users`
- `userActions[]` array of useractions done in the batch
Public Output is the root commitment of the `CexAsset` Map.
*Constraints*
- $Proof_k$.`publicOutput` = `CurrentMap.root`
- for each `user` in `userActions[]`:
  - the equity of each token should be equal to or greater than the total collateral
  - collateral must be sufficient to cover their debts according to the collateral ratio tiers
  - update the tree
  - `userActions[i].beforeAccountRoot = userActions[i-1].afterAccountRoot`

**Approach 2: Whole lot of MerkleWitness**
In Approach 2 we store the whole `Users` Map but to the Circuit we provide `witness` to prove that a user is solvent. So for a Batch Let's say:

- `userActions[]` These are userActions taken by the user
- `MerkleMapWitness` it is the witness after the`User's` MerkleMap is updated with the `userActions[]`.
- `userAssets[]` is TotalAssets for the $i^{th}$ user in the `userActions[]`. The `Asset` can also be a `IndexedMerkleMap` but storing `IndexedMerkleMap` for each user may be storage inffecient.
- `LastProof` is the proof from the lastBatch for this user
**Constraints**:
- compute the value of the node for each asset which will be `hash(userId,comm(userAssets))` and use the witness api to see if it matched`userActions[BATCH_SIZE].root`.
- for each action in `userActions[]`:
  - `userActions[i].beforeRoot = userActions[i].root`
  - `Total Equity > Total Debt` for each Asset at every i.

**NOTE** This circuit will be recursive as we would not store a proof for every evaluation of this circuit. It is better to have a aggregated proof for each user which verifies that each action that the user took does not create insolvency.
We can also aggregate each User's proof and the Cex proof to create one big proof of solvency.
This method enables high parallelization at the trade off of **storage** and **precomputation** that we store and create the `MekleMapWitness` for every.
**Another Note**. By parralellization I mean that we compute the circuit in a forked process on the cpu as **typescript** is not multi-threaded this can be a hack

**Approach3: Sharding of the UserMap**
This is basically same as Approach 1 but the way we store User's Map is different.
We shard the MerkleMap say on `userId` i.e create 2 or more different `IndexedMerkleMap` this can decrease proving times as we have decrease the size of the map input.
This method will include a lot of hit and trials to see which `height` vs `storage` is the best output.

**BatchProofs**
The user proof and cex proof can be aggregated into a single proof and
The input to the circuit is the following `BatchCircuitInput`:

```javascript!=
Class BatchCircuitInput extends Struct({
    beforeCexAssetRoot: Field,
    batchCommitment: Field,
    afterCexAssetRoot: Field,
    beforeUserRoot: Field,
    afterUserRoot: Field,
    userProof: Proof<>,
    cexProof:Proof<>
}){}
```

There is also a public input to the program `BatchCommitment` which is defined as `hash(beforeAccountRoot,AfterAccountRoot,beforeCexAssetRoot,AfterCexAssetRoot)`
Following are the **constraints** for BatchCircuitInput:

- verify `batchCommitment` is computed correctly.
- verify the `userProof.publicOutput.root`  = `afterCexAssetRoot`
- verify the `cexProof.publicOutput.root` = `afterUserRoot`

**Verification**
The Users and auditors can verify the computation is done correctly when all the Maps and proofs are published. They can do the following steps:

- check equation:`batch_commitment_n = hash(cexAssetRoots[n-1], cexAssetRoots[n], userAccountRoots[n-1], userAccontRoots[n])`.
  - when n = 0, the`CexAssetRoots[-1]` and `userAccounRoots[n-1]` is the empty root;
  - check `verify(batch_commitment_0, proof_0, verifying key)` output;
  - check whether `AssetTreeRoot` equals to the commitment of published `AssetList` by CEX

A user can do the following fetch the account info and the `userProof` from the cex and do:

- create the asset commitment and compute the witness for his proof in a merkle tree and verify. `userProof.root = root`

### Proof System

The implementation for the proof system can be done in two ways. First is to use a proof generating backend with storing the maps in the DBs. Another way is to store the commitments of users on the protokit runtime itself and change the circuits accordingly.

### Backend Server

The following is the proof generation system/backend in place:
![image](https://hackmd.io/_uploads/rJD9k1gxJx.png)

- **Storage Service**: A storage service will be made which stores the proofs and Maps in databases. This will also need some sort of experimentaion which db like mysql,postgresql,mongoDb and cache layer for storing maps like redis gives the best fetching and writing time.
- **PreProcessor**: The role of the preprocessor is to take inputs from the `userBalanceSheet`/ the db entries and prepare inputs to the above mentioned circuit. I would like to test different low level languages(`rust`,`golang`,`c`) for this as to which gives the fastest result write the results to files and have them read in the circuit's process.
- **Circuits**: The circuits are ran in a child forked process this allows for less memory consumption as javascript's heap fills out way too fast. I think this pardigm can help people creating proof generation backends so will definitely try to make a nice wrapper for this.

### Protokit

For the protokit implementation we can store the each user's asset commitments (which are hash(`TotalEquity,TotalDebt,assetCommitment`)) and store the root commitments and everything in runtimes. So something along the lines:

**NOTE** We do not directly store the user assets on the runtime as they are private in a cex backend and cannot be exposed to the public due to privacy concerns.

```javascript=
export class UserRuntime extends RuntimeModule<UserRuntimeConfig> {
    ...
    // here the key - hash(AccountId)
    // the value is hash(TotalEquity,TotalDebt,assetCommitment)
    @state public userCommitments: StateMap.from<Field,Field>(Field,Field)
    // the account tree root commitment
    @state public rootCommitment: State.from<Field>(Field)
    ...
}
```

The CEX Runtime can be as follows which stores the Cex Commitments. As Cex Assets have to be public to maintain transparency

```javascript=
export class CEXRuntime extends RuntimeModule<CEXRuntimeConfig> {
    ...
    @state public assets: StateMap.from<AssetId,CEXAssets>(AssetId,CexAssets)
    // here the key - hash(AccountId)
    // the value is hash(TotalEquity,TotalDebt,..loan variables...)
    @state public assetCommitment: StateMap.from<Field,Field>(Field,Field)
    // the account Cex Asset tree root commitment
    @state public rootCommitment: State.from<Field>(Field)
    ...
}
```

With above runtime and little tweaks to our approach we can have a full proof generation system in place with help of protokit.

**NOTE** There can be performance issues with this as in my knowledge we cannot really do batch updates on maps which would lead to multiple writes on the runtime as number of user to updates in a batch can be in thousands. I don't know how efficient this is. So I will include a performace benchmark on both approaches

----

### UI Dashboard

A UI dashboard is made for users to see the cexes and verify the accounts. On devnet a dummy CEX is created. In Which user can edit their token balances and collateral to play around with this stuff. User can login via credentials provided to them by the cex. I will create a mock set of credentials for people to tryout!. Here is the [figma link](https://www.figma.com/design/6eLbrdf9JuOladOkfgVElV/Untitled?node-id=0-1&t=TumD3HenX1dKKiaL-1) and below are the images

![Dashboard Screen(1)](https://hackmd.io/_uploads/S12AObqNJx.png)
![Tables Screen](https://hackmd.io/_uploads/HJZgdb94Jg.png)
![New Design](https://hackmd.io/_uploads/S10ldb5N1l.png)
