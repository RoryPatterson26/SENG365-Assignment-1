"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modify = exports.getOne = exports.logout = exports.login = exports.register = void 0;
const users = __importStar(require("../models/users.model"));
const logger_1 = __importDefault(require("../../config/logger"));
const passwords = __importStar(require("../../config/passwords"));
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Attempting to register new user');
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    const emailResult = yield users.checkEmail(email);
    if (!(email.includes("@"))) {
        res.status(400)
            .send(`User could not be created`);
    }
    else if (password.length < 1) {
        res.status(400)
            .send(`User could not be created`);
    }
    else if (emailResult[0].number > 0) {
        res.status(400)
            .send(`User could not be created`);
    }
    else if (firstName === undefined || lastName === undefined) {
        res.status(400)
            .send(`User could not be created`);
    }
    else {
        const passwordHash = yield passwords.hash(password);
        try {
            const result = yield users.register(firstName, lastName, email, passwordHash);
            res.status(201).send(JSON.stringify(({ userId: result.insertId })));
            logger_1.default.info('User successfully registered');
        }
        catch (err) {
            res.status(500)
                .send(`ERROR creating user ${err}`);
        }
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Logging in user');
    const email = req.body.email;
    const password = req.body.password;
    const loginHash = yield passwords.hash(password);
    try {
        const result = yield users.checkPassword(email);
        if (result[0].password.toString() === loginHash) {
            const userToken = yield users.setToken(result[0].id);
            res.status(200).send(JSON.stringify({ userId: result[0].id, token: userToken }));
        }
        else {
            res.status(400).send('Invalid Login');
        }
    }
    catch (err) {
        res.status(500)
            .send(`ERROR logging in ${err}`);
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http('Logging out user');
    const token = req.get('x-authorization');
    try {
        const loggedOut = yield users.revokeToken(token);
        if (loggedOut) {
            res.status(200).send();
        }
        else {
            res.status(401).send();
        }
    }
    catch (_a) {
        res.status(500).send('ERROR');
    }
});
exports.logout = logout;
const getOne = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.get('x-authorization');
    const id = req.params.id;
    const tokenId = yield users.authenticate(token);
    try {
        if (tokenId[0].id.toString() === id) {
            const [result] = yield users.getUserAuthenticated(parseInt(id, 10));
            res.status(200).send(result);
        }
        else {
            const [result] = yield users.getUserUnauthenticated(parseInt(id, 10));
            if (result === undefined) {
                res.status(404).send();
            }
            else {
                res.status(200).send(result);
            }
        }
    }
    catch (err) {
        res.status(500)
            .send(`ERROR retrieving data ${err}`);
    }
});
exports.getOne = getOne;
const modify = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http('Modifying user');
    const token = req.get('x-authorization');
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.password;
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const id = req.params.id;
    const emailResult = yield users.checkEmail(email);
    const tokenId = yield users.authenticate(token);
    const passwordHash = yield passwords.hash(currentPassword);
    const newPasswordHash = yield passwords.hash(newPassword);
    let flag = true;
    if (id !== tokenId[0].id.toString()) {
        res.status(401).send('Unauthorized');
    }
    else if (emailResult[0].number > 0) {
        res.status(400).send();
    }
    else {
        try {
            if (newPassword !== undefined) {
                if (passwordHash === (yield users.checkPassword2(id))[0].password) {
                    yield users.updateUser(`password`, newPasswordHash, id);
                }
                else {
                    res.status(401).send('Incorrect Password');
                    flag = false;
                }
            }
            if (firstName !== undefined && flag) {
                yield users.updateUser(`first_name`, firstName, id);
            }
            if (lastName !== undefined && flag) {
                yield users.updateUser(`last_name`, lastName, id);
            }
            if (email !== undefined && flag) {
                yield users.updateUser('email', email, id);
            }
            res.status(200).send('User Modified');
        }
        catch (err) {
            res.status(500).send(`ERROR: ${err}`);
        }
    }
});
exports.modify = modify;
