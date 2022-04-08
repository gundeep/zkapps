var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Field, PrivateKey, SmartContract, state, State, method, UInt64, Mina, Party, Group, shutdown, isReady, } from 'snarkyjs';
class HelloWorld extends SmartContract {
    constructor(initialBalance, address, x) {
        super(address);
        this.balance.addInPlace(initialBalance);
        this.value = State.init(x);
    }
    async update(squared) {
        const x = await this.value.get();
        x.square().assertEquals(squared);
        this.value.set(squared);
    }
}
__decorate([
    state(Field),
    __metadata("design:type", State)
], HelloWorld.prototype, "value", void 0);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field]),
    __metadata("design:returntype", Promise)
], HelloWorld.prototype, "update", null);
function messingAround() {
    const x = new Field(10);
    console.log(x.add(x).toString());
    console.log(x.square().toString());
    const g = Group.generator;
    // (g + g) - g = g
    g.add(g).neg().add(g).assertEquals(g);
}
async function runSimpleApp() {
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
        snappInstance = new HelloWorld(amount, snappPubkey, initSnappState);
    })
        .send()
        .wait();
    // Update the snapp
    await Mina.transaction(account1, async () => {
        // 9 = 3^2
        await snappInstance.update(new Field(9));
    })
        .send()
        .wait();
    await Mina.transaction(account1, async () => {
        // Fails, because the provided value is wrong.
        await snappInstance.update(new Field(109));
    })
        .send()
        .wait()
        .catch((e) => console.log('second update attempt failed'));
    const a = await Mina.getAccount(snappPubkey);
    console.log('final state value', a.snapp.appState[0].toString());
}
runSimpleApp();
shutdown();
