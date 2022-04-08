var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RollupProof_1;
import { Field, prop, PublicKey, CircuitValue, Signature, UInt64, UInt32, KeyedAccumulatorFactory, ProofWithInput, proofSystem, branch, MerkleStack, shutdown, } from 'snarkyjs';
const AccountDbDepth = 32;
const AccountDb = KeyedAccumulatorFactory(AccountDbDepth);
class RollupAccount extends CircuitValue {
    constructor(balance, nonce, publicKey) {
        super();
        this.balance = balance;
        this.nonce = nonce;
        this.publicKey = publicKey;
    }
}
__decorate([
    prop,
    __metadata("design:type", UInt64)
], RollupAccount.prototype, "balance", void 0);
__decorate([
    prop,
    __metadata("design:type", UInt32)
], RollupAccount.prototype, "nonce", void 0);
__decorate([
    prop,
    __metadata("design:type", PublicKey)
], RollupAccount.prototype, "publicKey", void 0);
class RollupTransaction extends CircuitValue {
    constructor(amount, nonce, sender, receiver) {
        super();
        this.amount = amount;
        this.nonce = nonce;
        this.sender = sender;
        this.receiver = receiver;
    }
}
__decorate([
    prop,
    __metadata("design:type", UInt64)
], RollupTransaction.prototype, "amount", void 0);
__decorate([
    prop,
    __metadata("design:type", UInt32)
], RollupTransaction.prototype, "nonce", void 0);
__decorate([
    prop,
    __metadata("design:type", PublicKey)
], RollupTransaction.prototype, "sender", void 0);
__decorate([
    prop,
    __metadata("design:type", PublicKey)
], RollupTransaction.prototype, "receiver", void 0);
class RollupDeposit extends CircuitValue {
    constructor(publicKey, amount) {
        super();
        this.publicKey = publicKey;
        this.amount = amount;
    }
}
__decorate([
    prop,
    __metadata("design:type", PublicKey)
], RollupDeposit.prototype, "publicKey", void 0);
__decorate([
    prop,
    __metadata("design:type", UInt64)
], RollupDeposit.prototype, "amount", void 0);
class RollupState extends CircuitValue {
    constructor(p, c) {
        super();
        this.pendingDepositsCommitment = p;
        this.accountDbCommitment = c;
    }
}
__decorate([
    prop,
    __metadata("design:type", Field)
], RollupState.prototype, "pendingDepositsCommitment", void 0);
__decorate([
    prop,
    __metadata("design:type", Field)
], RollupState.prototype, "accountDbCommitment", void 0);
class RollupStateTransition extends CircuitValue {
    constructor(source, target) {
        super();
        this.source = source;
        this.target = target;
    }
}
__decorate([
    prop,
    __metadata("design:type", RollupState)
], RollupStateTransition.prototype, "source", void 0);
__decorate([
    prop,
    __metadata("design:type", RollupState)
], RollupStateTransition.prototype, "target", void 0);
// a recursive proof system is kind of like an "enum"
let RollupProof = RollupProof_1 = class RollupProof extends ProofWithInput {
    static processDeposit(pending, accountDb) {
        let before = new RollupState(pending.commitment, accountDb.commitment());
        let deposit = pending.pop();
        let [{ isSome }, mem] = accountDb.get(deposit.publicKey);
        isSome.assertEquals(false);
        let account = new RollupAccount(UInt64.zero, UInt32.zero, deposit.publicKey);
        accountDb.set(mem, account);
        let after = new RollupState(pending.commitment, accountDb.commitment());
        return new RollupProof_1(new RollupStateTransition(before, after));
    }
    static transaction(t, s, pending, accountDb) {
        s.verify(t.sender, t.toFields()).assertEquals(true);
        let stateBefore = new RollupState(pending.commitment, accountDb.commitment());
        let [senderAccount, senderPos] = accountDb.get(t.sender);
        senderAccount.isSome.assertEquals(true);
        senderAccount.value.nonce.assertEquals(t.nonce);
        senderAccount.value.balance = senderAccount.value.balance.sub(t.amount);
        senderAccount.value.nonce = senderAccount.value.nonce.add(1);
        accountDb.set(senderPos, senderAccount.value);
        let [receiverAccount, receiverPos] = accountDb.get(t.receiver);
        receiverAccount.value.balance = receiverAccount.value.balance.add(t.amount);
        accountDb.set(receiverPos, receiverAccount.value);
        let stateAfter = new RollupState(pending.commitment, accountDb.commitment());
        return new RollupProof_1(new RollupStateTransition(stateBefore, stateAfter));
    }
    static merge(p1, p2) {
        p1.publicInput.target.assertEquals(p2.publicInput.source);
        return new RollupProof_1(new RollupStateTransition(p1.publicInput.source, p2.publicInput.target));
    }
};
__decorate([
    branch,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MerkleStack,
        AccountDb]),
    __metadata("design:returntype", RollupProof)
], RollupProof, "processDeposit", null);
__decorate([
    branch,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RollupTransaction,
        Signature,
        MerkleStack,
        AccountDb]),
    __metadata("design:returntype", RollupProof)
], RollupProof, "transaction", null);
__decorate([
    branch,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RollupProof, RollupProof]),
    __metadata("design:returntype", RollupProof)
], RollupProof, "merge", null);
RollupProof = RollupProof_1 = __decorate([
    proofSystem
], RollupProof);
shutdown();
