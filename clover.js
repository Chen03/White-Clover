/**
 * @param {(value) => void} res 
 * @param {(error) => void} rej 
 * @param {*} val 
 */
function ThenItem(onFulfilled, onRejected, resolve, reject, clover) {
    this.onFulfilled = onFulfilled;
    this.onRejected = onRejected;
    this.resolve = resolve;
    this.reject = reject;
    this.clover = clover
}

function PRP(retVal, resolve, reject, clover) {
    if (retVal === clover)    reject(TypeError("Callback returned the promise itself."));
    else if (retVal instanceof Promise || retVal instanceof Clover) {   //232?  not sure
        retVal.then(
            (val) => resolve(val), 
            (err) => reject(err)
        );
    } else if (retVal && (retVal instanceof Object || retVal instanceof Function)) {
        if (!retVal.then instanceof Function)   resolve(retVal);
        else {
            let isCalled = false;
            const resolvePromise = (value) => {
                if (!isCalled) {
                    resolve(value);
                }
            }, rejectPromise = (error) => {
                if (isCalled)   return;
                reject(error);
            };

            try {
                retVal.then(resolvePromise, rejectPromise);
            } catch (e) {
                !isCalled && rejectPromise(e);
            }
        }
    } else resolve(retVal);
}

/**
 * @param {(resolve: (value) => void, reject: (error) => void) => any} callback 
 */
function Clover(callback) {
    let state = 0;  //0: pending, 1: fulfilled, 2: rejected
    let val = undefined;    //value or error;
    let thenList = [];

    const executeThenItem = (t) => 
        queueMicrotask(() => {  //224
            let retVal;
            try {
                retVal = state == 1 ? 
                    t.onFulfilled(val) : t.onRejected(val);
            } catch (e) {
                t.reject(e);
            }

            PRP(retVal, t.resolve, t.reject, t.clover);
        });

    this.then = (onFulfilled, onRejected) => {
        let resolve, reject;
        let clo = new Clover((res, rej) => {
            resolve = res;
            reject = rej;
        });

        let item = new ThenItem(onFulfilled, onRejected, resolve, reject, clo);
        if (state)  executeThenItem(item);
        else thenList.push(item);
        return clo;
    }

    const executeThenList = () => {
        for (let t of thenList) {
            executeThenItem(t);
        }
    }

    callback(
        (value) => {
            state = 1;
            val = value;
            executeThenList();
        },
        (error) => {
            state = 2;
            val = error;
            executeThenList();
        }
    );
}

exports.Clover = Clover;