const { Clover } = require('./clover');
var promisesAplusTests = require("promises-aplus-tests");

let adapter = {
    deferred() {
        let resolve, reject;
        let clover = new Clover((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return {
            promise: clover,
            resolve: resolve,
            reject: reject
        };
    }
}

promisesAplusTests(adapter, (err) => {});