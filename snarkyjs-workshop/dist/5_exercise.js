var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { PrivateKey, PublicKey, SmartContract, method, UInt64, Mina, Party, CircuitValue, prop, Signature, Bool, isReady, shutdown, } from 'snarkyjs';
// This exercise involves a user defined data type.
class SignatureWithSigner extends CircuitValue {
    constructor(signature, signer) {
        super();
        this.signature = signature;
        this.signer = signer;
    }
    static create(signer, message) {
        return new SignatureWithSigner(Signature.create(signer, message), signer.toPublicKey());
    }
}
__decorate([
    prop,
    __metadata("design:type", Signature)
], SignatureWithSigner.prototype, "signature", void 0);
__decorate([
    prop,
    __metadata("design:type", PublicKey)
], SignatureWithSigner.prototype, "signer", void 0);
function containsPublicKey(xs, x) {
    let number = 0;
    while (number < xs.length) {
        if (xs[number].equals(x)) {
            return new Bool(true);
        }
        number++;
    }
    return new Bool(false);
}
// This implements a snapp account that can be used if a user has
// any of a list of public keys. The list of public keys is also
// secret.
class Exercise5 extends SmartContract {
    // No state this time
    constructor(initialBalance, address, owners) {
        super(address);
        this.owners = owners;
        this.balance.addInPlace(initialBalance);
    }
    // Spend requires a signature with one of the keys in the list
    async spend(amount, s) {
        // Check that some owner is equal to the signer
        containsPublicKey(this.owners, s.signer).assertEquals(true);
        // Check that the signature verifies against the message which is
        // the current account nonce
        const nonce = await this.nonce;
        // Verify the signature
        s.signature.verify(s.signer, nonce.toFields()).assertEquals(true);
        // Allow the sender of this transaction to decrease the balance.
        this.balance.subInPlace(amount);
    }
}
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UInt64, SignatureWithSigner]),
    __metadata("design:returntype", Promise)
], Exercise5.prototype, "spend", null);
export async function run() {
    await isReady;
    // Set up some keypairs for the account
    const privateKeys = [];
    const publicKeys = [];
    for (let i = 0; i < 10; ++i) {
        let k = PrivateKey.random();
        privateKeys.push(k);
        publicKeys.push(k.toPublicKey());
    }
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    const account1 = Local.testAccounts[0].privateKey;
    const account2 = Local.testAccounts[1].privateKey;
    const snappPrivkey = PrivateKey.random();
    const snappPubkey = snappPrivkey.toPublicKey();
    let snappInstance;
    // Deploys the snapp
    await Mina.transaction(account1, async () => {
        // account2 sends 1000000000 to the new snapp account
        const amount = UInt64.fromNumber(1000000000);
        const p = await Party.createSigned(account2);
        p.balance.subInPlace(amount);
        snappInstance = new Exercise5(amount, snappPubkey, publicKeys);
    })
        .send()
        .wait();
    const { nonce: snappNonce } = await Mina.getAccount(snappPubkey);
    // Update the snapp, send to account 2
    await Mina.transaction(account1, async () => {
        const amount = UInt64.fromNumber(123);
        // Pick one of the valid senders to sign with
        const sender = privateKeys[5];
        await snappInstance.spend(amount, SignatureWithSigner.create(sender, snappNonce.toFields()));
        // Send it to account 2
        Party.createUnsigned(account2.toPublicKey()).balance.addInPlace(amount);
    })
        .send()
        .wait();
    const a = await Mina.getAccount(account2.toPublicKey());
    console.log('Exercise 5');
    console.log('account2 balance', a.balance.toString());
}
run();
shutdown();
