"use strict";
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
exports.updateUser = exports.authenticate = exports.getUserUnauthenticated = exports.getUserAuthenticated = exports.revokeToken = exports.setToken = exports.checkPassword2 = exports.checkPassword = exports.checkEmail = exports.register = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const register = (firstName, lastName, email, passwordHash) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Registering new user`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'INSERT INTO user (email, first_name, last_name, password) values (?, ?, ?, ?)';
    const [result] = yield conn.query(query, [email, firstName, lastName, passwordHash]);
    conn.release();
    return result;
});
exports.register = register;
const checkEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT COUNT(email) AS number FROM user WHERE email = ?';
    const [result] = yield conn.query(query, [email]);
    conn.release();
    return result;
});
exports.checkEmail = checkEmail;
const checkPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Verifying Password`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT id, password FROM user WHERE email = ?';
    const [result] = yield conn.query(query, [email]);
    conn.release();
    return result;
});
exports.checkPassword = checkPassword;
const checkPassword2 = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT password FROM user WHERE id = ?';
    const [result] = yield conn.query(query, [id]);
    return result;
});
exports.checkPassword2 = checkPassword2;
const setToken = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const token = require('crypto').randomBytes(16).toString('hex');
    const query = 'UPDATE user SET auth_token = ? WHERE id = ?';
    const [result] = yield conn.query(query, [token, id]);
    conn.release();
    return token;
});
exports.setToken = setToken;
const revokeToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'UPDATE user SET auth_token = NULL WHERE auth_token = ?';
    const [result] = yield conn.query(query, [token]);
    conn.release();
    return result.affectedRows > 0;
});
exports.revokeToken = revokeToken;
const getUserAuthenticated = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT first_name AS firstName, last_name AS lastName, email From user WHERE id = ?';
    const [result] = yield conn.query(query, [id]);
    conn.release();
    return result;
});
exports.getUserAuthenticated = getUserAuthenticated;
const getUserUnauthenticated = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT first_name AS firstName, last_name AS lastName From user WHERE id = ?';
    const [result] = yield conn.query(query, [id]);
    conn.release();
    return result;
});
exports.getUserUnauthenticated = getUserUnauthenticated;
const authenticate = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT id FROM user WHERE auth_token = ?';
    const [result] = yield conn.query(query, [token]);
    conn.release();
    return result;
});
exports.authenticate = authenticate;
const updateUser = (key, value, id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `UPDATE user SET ${key} = ? WHERE id = ?`;
    const [result] = yield conn.query(query, [value, id]);
    conn.release();
});
exports.updateUser = updateUser;
