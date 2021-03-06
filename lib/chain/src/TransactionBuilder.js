"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var assert = require("assert");

var _require = require("../../ecc");

var Signature = _require.Signature;
var PublicKey = _require.PublicKey;
var hash = _require.hash;

var _require2 = require("../../serializer");

var ops = _require2.ops;

var ChainConfig = require("../../chain/src/ChainConfig");

var _require3 = require('steem-rpc');

var Client = _require3.Client;

var Api = Client.get();

var _require4 = require('bytebuffer');

var Long = _require4.Long;


var ChainTypes = require('./ChainTypes');

var head_block_time_string;

var TransactionBuilder = function () {
    function TransactionBuilder() {
        _classCallCheck(this, TransactionBuilder);

        this.ref_block_num = 0;
        this.ref_block_prefix = 0;
        this.expiration = 0;
        this.operations = [];
        this.signatures = [];
        this.signer_private_keys = [];

        // semi-private method bindings
        this._broadcast = _broadcast.bind(this);
    }

    /**
        @arg {string} name - like "transfer"
        @arg {object} operation - JSON matchching the operation's format
    */


    _createClass(TransactionBuilder, [{
        key: "add_type_operation",
        value: function add_type_operation(name, operation) {
            this.add_operation(this.get_type_operation(name, operation));
            return;
        }

        /**
            This does it all: set fees, finalize, sign, and broadcast (if wanted).
             @arg {ConfidentialWallet} cwallet - must be unlocked, used to gather signing keys
             @arg {array<string>} [signer_pubkeys = null] - Optional ["GPHAbc9Def0...", ...].  These are additional signing keys.  Some balance claims require propritary address formats, the witness node can't tell us which ones are needed so they must be passed in.  If the witness node can figure out a signing key (mostly all other transactions), it should not be passed in here.
             @arg {boolean} [broadcast = false]
        */

    }, {
        key: "process_transaction",
        value: function process_transaction(accountLogin) {
            var _this = this;

            var signer_pubkeys = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
            var broadcast = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];


            // let wallet_object = cwallet.wallet.wallet_object
            // if(Api.chain_id !== wallet_object.get("chain_id"))
            //     return Promise.reject("Mismatched chain_id; expecting " +
            //         wallet_object.get("chain_id") + ", but got " +
            //         Api.chain_id)

            var signer_pubkeys_added = {};
            // if(signer_pubkeys) {
            //
            //     // Balance claims are by address, only the private
            //     // key holder can know about these additional
            //     // potential keys.
            //     var pubkeys = accountLogin.getPubKeys()
            //     if( ! pubkeys.length)
            //         throw new Error("Missing signing key")
            //
            //     for(let pubkey_string of pubkeys) {
            //         var private_key = cwallet.getPrivateKey(pubkey_string)
            //         this.add_signer(private_key, pubkey_string)
            //         signer_pubkeys_added[pubkey_string] = true
            //     }
            // }

            // return this.get_potential_signatures().then( (pubkeys)=> {
            var my_pubkeys = accountLogin.getPubKeys();

            //{//Testing only, don't send All public keys!
            //    var pubkeys_all = PrivateKeyStore.getPubkeys() // All public keys
            //    this.get_required_signatures(pubkeys_all).then( required_pubkey_strings =>
            //        console.log('get_required_signatures all\t',required_pubkey_strings.sort(), pubkeys_all))
            //    this.get_required_signatures(my_pubkeys).then( required_pubkey_strings =>
            //        console.log('get_required_signatures normal\t',required_pubkey_strings.sort(), pubkeys))
            //}

            return this.get_required_signatures(my_pubkeys).then(function (required_pubkeys) {
                // console.log("required_pubkeys", required_pubkeys);
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = my_pubkeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var pubkey_string = _step.value;

                        // console.log("pubkey_string", pubkey_string);

                        if (signer_pubkeys_added[pubkey_string]) continue;

                        accountLogin.signTransaction(_this, signer_pubkeys_added, required_pubkeys);
                        // var private_key = cwallet.getPrivateKey(pubkey_string)
                        // if( ! private_key)
                        //     // This should not happen, get_required_signatures will only
                        //     // returned keys from my_pubkeys
                        //     throw new Error("Missing signing key for " + pubkey_string)
                        // this.add_signer(private_key, pubkey_string)
                    }

                    // console.log("signer_pubkeys_added", signer_pubkeys_added);
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }).then(function () {
                if (broadcast) {
                    return _this.broadcast();
                } else {
                    return _this.serialize();
                }
            });
        }

        /** Typically this is called automatically just prior to signing.  Once finalized this transaction can not be changed. */

    }, {
        key: "finalize",
        value: function finalize() {
            var _this2 = this;

            // console.log("Try to finalize", "expiration:", this.expiration);
            return new Promise(function (resolve, reject) {

                if (_this2.tr_buffer) {
                    throw new Error("already finalized");
                }

                resolve(Api.database_api().exec("get_dynamic_global_properties", []).then(function (r) {
                    head_block_time_string = r.time;
                    if (_this2.expiration === 0) _this2.expiration = base_expiration_sec() + ChainConfig.expire_in_secs;
                    // console.log("new expiration:", this.expiration);
                    _this2.ref_block_num = r.head_block_number & 0xFFFF;
                    _this2.ref_block_prefix = new Buffer(r.head_block_id, 'hex').readUInt32LE(4);
                    //DEBUG console.log("ref_block",@ref_block_num,@ref_block_prefix,r)

                    var iterable = _this2.operations;
                    for (var i = 0, op; i < iterable.length; i++) {
                        op = iterable[i];
                        if (op[1]["finalize"]) {
                            op[1].finalize();
                        }
                    }
                    _this2.tr_buffer = ops.transaction.toBuffer(_this2);
                }).catch(function (err) {
                    console.log("get_dynamic_global_properties err:", err);
                }));
            });
        }

        /** @return {string} hex transaction ID */

    }, {
        key: "id",
        value: function id() {
            if (!this.tr_buffer) {
                throw new Error("not finalized");
            }
            return hash.sha256(this.tr_buffer).toString('hex').substring(0, 40);
        }

        /**
            Typically one will use {@link this.add_type_operation} instead.
            @arg {array} operation - [operation_id, operation]
        */

    }, {
        key: "add_operation",
        value: function add_operation(operation) {
            if (this.tr_buffer) {
                throw new Error("already finalized");
            }
            assert(operation, "operation");
            if (!Array.isArray(operation)) {
                throw new Error("Expecting array [operation_id, operation]");
            }
            this.operations.push(operation);
            return;
        }
    }, {
        key: "get_type_operation",
        value: function get_type_operation(name, operation) {
            if (this.tr_buffer) {
                throw new Error("already finalized");
            }
            assert(name, "name");
            assert(operation, "operation");
            var _type = ops[name];
            assert(_type, "Unknown operation " + name);
            var operation_id = ChainTypes.operations[_type.operation_name];
            if (operation_id === undefined) {
                throw new Error("unknown operation: " + _type.operation_name);
            }
            if (!operation.fee) {
                operation.fee = { amount: 0, asset_id: 0 };
            }
            if (name === 'proposal_create') {
                operation.expiration_time || (operation.expiration_time = base_expiration_sec() + ChainConfig.expire_in_secs_proposal);
            }
            var operation_instance = _type.fromObject(operation);
            return [operation_id, operation_instance];
        }

        /** optional: there is a deafult expiration */

    }, {
        key: "set_expire_seconds",
        value: function set_expire_seconds(sec) {
            if (this.tr_buffer) {
                throw new Error("already finalized");
            }
            return this.expiration = base_expiration_sec() + sec;
        }

        /* Wraps this transaction in a proposal_create transaction */

    }, {
        key: "propose",
        value: function propose(proposal_create_options) {
            if (this.tr_buffer) {
                throw new Error("already finalized");
            }
            if (!this.operations.length) {
                throw new Error("add operation first");
            }

            assert(proposal_create_options, "proposal_create_options");
            assert(proposal_create_options.fee_paying_account, "proposal_create_options.fee_paying_account");

            var proposed_ops = this.operations.map(function (op) {
                return { op: op };
            });

            this.operations = [];
            this.signatures = [];
            this.signer_private_keys = [];
            proposal_create_options.proposed_ops = proposed_ops;
            this.add_type_operation("proposal_create", proposal_create_options);
            return this;
        }
    }, {
        key: "has_proposed_operation",
        value: function has_proposed_operation() {
            var hasProposed = false;
            for (var i = 0; i < this.operations.length; i++) {
                if ("proposed_ops" in this.operations[i][1]) {
                    hasProposed = true;
                    break;
                }
            }

            return hasProposed;
        }
    }, {
        key: "get_potential_signatures",
        value: function get_potential_signatures() {
            var tr_object = ops.signed_transaction.toObject(this);
            return Api.database_api().exec("get_potential_signatures", [tr_object]).then(function (pubkeys) {
                return { pubkeys: pubkeys };
            });
        }
    }, {
        key: "get_required_signatures",
        value: function get_required_signatures(available_keys) {

            if (!available_keys.length) {
                return Promise.resolve([]);
            }
            var tr_object = ops.signed_transaction.toObject(this);
            // console.log('... tr_object',tr_object)
            //DEBUG console.log('... tr_object',tr_object)
            return Api.database_api().exec("get_required_signatures", [tr_object, available_keys]).then(function (required_public_keys) {
                // DEBUG console.log('... get_required_signatures',required_public_keys)
                return required_public_keys;
            });
        }
    }, {
        key: "add_signer",
        value: function add_signer(private_key) {
            var public_key = arguments.length <= 1 || arguments[1] === undefined ? private_key.toPublicKey() : arguments[1];


            assert(private_key.d, "required PrivateKey object");

            if (this.signed) {
                throw new Error("already signed");
            }
            if (!public_key.Q) {
                public_key = PublicKey.fromPublicKeyString(public_key);
            }
            // prevent duplicates
            var spHex = private_key.toHex();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.signer_private_keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var sp = _step2.value;

                    if (sp[0].toHex() === spHex) return;
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            this.signer_private_keys.push([private_key, public_key]);
        }
    }, {
        key: "sign",
        value: function sign() {
            var chain_id = arguments.length <= 0 || arguments[0] === undefined ? ChainConfig.networks.Steem.chain_id : arguments[0];

            if (!this.tr_buffer) {
                throw new Error("not finalized");
            }
            if (this.signed) {
                throw new Error("already signed");
            }
            var end = this.signer_private_keys.length;
            for (var i = 0; 0 < end ? i < end : i > end; 0 < end ? i++ : i++) {
                var _signer_private_keys$ = _slicedToArray(this.signer_private_keys[i], 2);

                var private_key = _signer_private_keys$[0];
                var public_key = _signer_private_keys$[1];

                var sig = Signature.signBuffer(Buffer.concat([new Buffer(chain_id, 'hex'), this.tr_buffer]), private_key, public_key);
                this.signatures.push(sig.toBuffer());
            }
            this.signer_private_keys = [];
            this.signed = true;
            return;
        }
    }, {
        key: "serialize",
        value: function serialize() {
            return ops.signed_transaction.toObject(this);
        }
    }, {
        key: "toObject",
        value: function toObject() {
            return ops.signed_transaction.toObject(this);
        }
    }, {
        key: "broadcast",
        value: function broadcast(was_broadcast_callback) {
            var _this3 = this;

            if (this.tr_buffer) {
                return this._broadcast(was_broadcast_callback);
            } else {
                return this.finalize().then(function () {
                    return _this3._broadcast(was_broadcast_callback);
                });
            }
        }
    }]);

    return TransactionBuilder;
}();

var base_expiration_sec = function base_expiration_sec() {
    var head_block_sec = Math.ceil(getHeadBlockDate().getTime() / 1000);
    var now_sec = Math.ceil(Date.now() / 1000);
    // The head block time should be updated every 3 seconds.  If it isn't
    // then help the transaction to expire (use head_block_sec)
    if (now_sec - head_block_sec > 30) {
        return head_block_sec;
    }
    // If the user's clock is very far behind, use the head block time.
    return Math.max(now_sec, head_block_sec);
};

function _broadcast(was_broadcast_callback) {
    var _this4 = this;

    return new Promise(function (resolve, reject) {
        if (!_this4.signed) {
            _this4.sign();
        }
        if (!_this4.tr_buffer) {
            reject(new Error("not finalized"));
        }
        if (!_this4.signatures.length) {
            reject(new Error("not signed"));
        }
        if (!_this4.operations.length) {
            reject(new Error("no operations"));
        }

        if (!("network_broadcast_api" in Api)) {
            reject(new Error("Api does not include network_broadcast_api"));
        }
        var tr_object = ops.signed_transaction.toObject(_this4);

        Api.network_broadcast_api().exec("broadcast_transaction_with_callback", [function (res) {
            return resolve(res);
        }, tr_object]).then(function () {
            // console.log('... broadcast success, waiting for callback')
            if (was_broadcast_callback) was_broadcast_callback();
            return;
        }).catch(function (error) {
            // console.log may be redundant for network errors, other errors could occur
            console.log(error);
            var message = error.message;
            if (!message) {
                message = "";
            }
            reject(new Error(message + "\n" + 'graphene-crypto ' + ' digest ' + hash.sha256(_this4.tr_buffer).toString('hex') + ' transaction ' + _this4.tr_buffer.toString('hex') + ' ' + JSON.stringify(tr_object)));
            return;
        });
        return;
    });
}

function getHeadBlockDate() {
    return timeStringToDate(head_block_time_string);
}

function timeStringToDate(time_string) {
    if (!time_string) return new Date("1970-01-01T00:00:00.000Z");
    if (!/Z$/.test(time_string)) //does not end in Z
        // https://github.com/cryptonomex/graphene/issues/368
        time_string = time_string + "Z";
    return new Date(time_string);
}

module.exports = TransactionBuilder;