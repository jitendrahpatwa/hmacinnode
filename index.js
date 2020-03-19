var crypto = require('crypto');
var querystring = require("querystring");

// encr
var constants = {
    methods: ['POST', 'GET'], // default both Support Only GET POST
    algo: 'SHA256', // default SHA256 other option SHA512, SHA128
    encoding: 'base64', // default base64 (take only hex and base64 encoding pattern)
    error: {
        code: 401,
        message: 'Signature Invalid'
    },
    excludePath: ['*']
}
const findRequestHash = (main) => {
    console.log('querymain:', typeof main, main, Object.prototype.toString.call(main));

    const objCheck = (obj) => {
        return (Object.prototype.toString.call(obj) === '[object Object]') ? { prototype: 'object' } :
            (Object.prototype.toString.call(obj) === '[object Array]' ? { prototype: 'array' } : { prototype: 'other' });
    }

    const checkProto = objCheck(main);

    let str = querystring.escape(JSON.stringify(main));
    return { ...checkProto, value: str };
}
const dataInterpolationInHeader = (body, headers, options) => {
    var data = body;
    console.log(body)
    const x_sign = headers['x-signature']; // hash1

    if (x_sign) {
        if (options['secret'] !== 'undefined') {
            var string = findRequestHash(data); // hash2
            var hash1 = x_sign;
            console.log('hash1', hash1, string);

            var hash2 = crypto.createHmac(options['algo'] ? options.algo : constants.algo, options.secret).update(string.value).digest(options['encoding'] ? options.encoding : constants.encoding);
            console.log('hash2', hash2);

            var match = (hash1 === hash2);

            if (match) {
                console.log('match', match); // logs => 'match'
                return true;
            } else {
                console.log('no match', match);
                return false;
            }
        }
        return true;
    }
    return true;
}
const methodCheck = (mtype, value) => {
    if (mtype) for (var obj in mtype) {
        // console.log('obj', mtype[obj])
        if (mtype[obj] === value) {
            return true;
        }
        if (mtype[obj] === value) {
            return true;
        }
    } else {
        return true;
    }
    return false;
}
const urlCheck = (array, value) => {
    if (array && array.includes(value)) {
        return true;
    } else {
        return false;
    }
}
// decrp
module.exports = function (options) {
    return function (req, res, next) {
        // Implement the middleware function based on the options object
        console.log('Middleware:', req.body, req.headers, req.method, req.query, req.params, req.path);
        // const x_sign = req.headers['x-signature'];
        var methodTypes = constants.methods;
        if (req.method === 'GET') {
            console.log('GET Middleware');
            // req.next(); 
            if (urlCheck((options['excludePath'] ? options.excludePath : constants.excludePath), req.path)) {
                next();
            } else if (!methodCheck((options['methods'] ? options.methods : methodTypes), req.method)) {
                next();
            } else if (dataInterpolationInHeader(req.query, req.headers, options)) {
                next();
            } else {
                return res.status(options['error'] ? options.error.code : constants.error.code).send({ message: (options['error'] ? options.error.message : constants.error.message) + ' In GET Reqeust' });
            }
        }
        if (req.method === 'POST') {
            console.log('POST Middleware');
            // console.log('>>>>', querystring.escape(JSON.stringify(req.body)));
            if (urlCheck((options['excludePath'] ? options.excludePath : constants.excludePath), req.path)) {
                next();
            } else if (!methodCheck((options['methods'] ? options.methods : methodTypes), req.method)) {
                next();
            } else if (dataInterpolationInHeader(req.body, req.headers, options)) {
                next();
            } else {
                return res.status(options['error'] ? options.error.code : constants.error.code).send({ message: (options['error'] ? options.error.message : constants.error.message) + ' In POST Reqeust' });
            }
        }
        next();
    }
}