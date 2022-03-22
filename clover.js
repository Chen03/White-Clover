/**
 * @param {(value) => void} res 
 * @param {(error) => void} rej 
 * @param {*} val 
 */
function ThenItem(onFulfilled, onRejected, resolve, reject) {
    this.onFulfilled = onFulfilled;
    this.onRejected = onRejected;
    this.resolve = resolve;
    this.reject = reject;
}

/**
 * @param {(resolve: (value) => void, reject: (error) => void) => any} callback 
 */
function Clover(callback) {
    let state = 0;  //0: pending, 1: fulfilled, 2: rejected
    let val = undefined;    //value or error;
    let thenList = [];

    this.then = (onFulfilled, onRejected) => {
        let resolve, reject;
        let clo = new Clover((res, rej) => {
            resolve = res;
            reject = rej;
        })

        thenList.push(new ThenItem(onFulfilled, onRejected, resolve, reject));
        return clo;
    }

    const executeThenList = () => {
        for (let t of thenList) {
            queueMicrotask(() => {  //224
                let retVal = state == 1 ? 
                    t.onFulfilled(val) : t.onRejected(val);

                if (retVal === this)    t.reject(TypeError("Callback returned the promise itself."));
                else if (retVal instanceof Promise || retVal instanceof Clover) {   //232?  not sure
                    retVal.then(
                        (val) => t.resolve(val), 
                        (err) => t.reject(err)
                    );
                } else if (retVal && (retVal instanceof Object || retVal instanceof Function)) {
                    if (!retVal.then instanceof Function)   t.resolve(retVal);
                    else {
                        //TODO
                    }
                }
            });
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