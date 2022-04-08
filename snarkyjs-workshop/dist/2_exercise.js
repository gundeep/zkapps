var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Field, PrivateKey, SmartContract, state, State, method, UInt64, Mina, Party, isReady, shutdown, } from 'snarkyjs';
class Exercise2 extends SmartContract {
    constructor(initialBalance, address, x) {
        super(address);
        this.balance.addInPlace(initialBalance);
        this.x = State.init(x);
    }
    static get UpdateReward() {
        return UInt64.fromNumber(1337);
    }
    async update() {
        const x = await this.x.get();
        throw new Error('TODO: Set the state to the hash of x');
    }
}
__decorate([
    state(Field),
    __metadata("design:type", State)
], Exercise2.prototype, "x", void 0);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Exercise2.prototype, "update", null);
export async function run() {
    await isReady;
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    const account1 = Local.testAccounts[0].privateKey;
    const account2 = Local.testAccounts[1].privateKey;
    const account2Pubkey = account2.toPublicKey();
    const snappPrivkey = PrivateKey.random();
    const snappPubkey = snappPrivkey.toPublicKey();
    let snappInstance;
    const initSnappState = new Field(3);
    // Deploys the snapp
    await Mina.transaction(account1, async () => {
        // account2 sends 1000000000 to the new snapp account
        const amount = UInt64.fromNumber(1000000000);
        const p = await Party.createSigned(account2);
        p.balance.subInPlace(amount);
        snappInstance = new Exercise2(amount, snappPubkey, initSnappState);
    })
        .send()
        .wait();
    // Update the snapp, send the reward to account2
    await Mina.transaction(account1, async () => {
        await snappInstance.update();
        const winner = Party.createUnsigned(account2Pubkey);
        winner.balance.addInPlace(Exercise2.UpdateReward);
    })
        .send()
        .wait();
    console.log('Exercise 2');
    const a = await Mina.getAccount(snappPubkey);
    console.log('final state value', a.snapp.appState[0].toString());
}
run();
shutdown();
