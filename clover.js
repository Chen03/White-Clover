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
            (val) => PRP(val, resolve, reject, clover),
            (err) => reject(err)
        );
    } else if (retVal && (typeof retVal === 'object' || typeof retVal === 'function')) {
        let thenFunc;
        try { 
            thenFunc = retVal.then;
        } catch (e) {
            reject(e);
        }

        if (typeof thenFunc !== 'function')   resolve(retVal);
        else {
            let isCalled = false;
            const resolvePromise = (value) => {
                if (!isCalled) {
                    PRP(value, resolve, reject, clover);
                    isCalled = true;
                }
            }, rejectPromise = (error) => {
                if (!isCalled) {
                    reject(error);
                    isCalled = true;
                }
            };

            try {
                thenFunc.call(retVal, resolvePromise, rejectPromise);
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
            if (!((state == 1 ? t.onFulfilled : t.onRejected) instanceof Function))
                state == 1 ? t.resolve(val) : t.reject(val);
            else {
                let retVal;
                try {
                    retVal = (state == 1 ? t.onFulfilled : t.onRejected).call(undefined, val);
                } catch (e) {
                    t.reject(e);
                }
    
                PRP(retVal, t.resolve, t.reject, t.clover);
            }
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
        (value) => 
            !state && (state = 1, val = value, executeThenList()),
        (error) =>
            !state && (state = 2, val = error, executeThenList()),
    );
}

Clover.resolve = (val) => new Clover((res) => res(val));
Clover.reject = (err) => new Clover((_, rej) => rej(err));

exports.Clover = Clover;