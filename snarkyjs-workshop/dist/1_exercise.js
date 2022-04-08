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
class Exercise1 extends SmartContract {
    constructor(initialBalance, address, x) {
        super(address);
        this.balance.addInPlace(initialBalance);
        this.x = State.init(x);
    }
    async update(cubed) {
        const x = await this.x.get();
        x.square().mul(x).assertEquals(cubed);
        this.x.set(cubed);
        //throw new Error('TODO: Set the state to x^3');
    }
}
__decorate([
    state(Field),
    __metadata("design:type", State)
], Exercise1.prototype, "x", void 0);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field]),
    __metadata("design:returntype", Promise)
], Exercise1.prototype, "update", null);
export async function run() {
    await isReady;
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    const account1 = Local.testAccounts[0].privateKey;
    const account2 = Local.testAccounts[1].privateKey;
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
        snappInstance = new Exercise1(amount, snappPubkey, initSnappState);
    })
        .send()
        .wait();
    // Update the snapp
    await Mina.transaction(account1, async () => {
        // 27 = 3^3
        await snappInstance.update(new Field(27));
    })
        .send()
        .wait();
    const a = await Mina.getAccount(snappPubkey);
    console.log('Exercise 1');
    console.log('final state value', a.snapp.appState[0].toString());
}
run();
shutdown();
