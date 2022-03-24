const { Clover } = require('./clover');

(new Clover((res) => setTimeout(() => res('qwq'), 1000))).then((val) => console.log(val)).then(() => console.log(233)).then(() => console.log(555));