import { getPool } from "../../config/db";
import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";

const register = async (firstName: string, lastName: string, email: string, passwordHash: string) : Promise<any> => {
    Logger.info(`Registering new user`);
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO user (email, first_name, last_name, password) values (?, ?, ?, ?)'
    const [ result ] = await conn.query( query, [ email, firstName, lastName, passwordHash ] );
    conn.release();
    return result;
};

const checkEmail = async (email: string) : Promise<any> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT COUNT(email) AS number FROM user WHERE email = ?';
    const [ result ] = await conn.query( query, [ email ] );
    conn.release()
    return result;
}

const checkPassword = async (email: string): Promise<any> => {
    Logger.info(`Verifying Password`);
    const conn = await getPool().getConnection();
    const query = 'SELECT id, password FROM user WHERE email = ?';
    const [ result ] = await conn.query( query, [ email ] );
    conn.release();
    return result;
}

const checkPassword2 = async (id: string): Promise<any> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT password FROM user WHERE id = ?';
    const [ result ] = await conn.query( query, [ id ] );
    return result;
}

const setToken = async (id: number): Promise<string> => {
    const conn = await getPool().getConnection();
    const token = require('crypto').randomBytes(16).toString('hex');
    const query = 'UPDATE user SET auth_token = ? WHERE id = ?';
    const [ result ] = await conn.query( query, [ token, id ] );
    conn.release();
    return token;
}

const revokeToken = async (token: string): Promise<any> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = NULL WHERE auth_token = ?';
    const [ result ] = await conn.query( query, [ token ] );
    conn.release();
    return result.affectedRows > 0;
}

const getUserAuthenticated = async (id: number): Promise<any> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT first_name AS firstName, last_name AS lastName, email From user WHERE id = ?';
    const [ result ] = await conn.query( query, [ id ] );
    conn.release();
    return result;
}

const getUserUnauthenticated = async (id: number): Promise<any> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT first_name AS firstName, last_name AS lastName From user WHERE id = ?';
    const [result] = await conn.query(query, [id]);
    conn.release();
    return result;
}

const authenticate = async (token: string): Promise<any> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT id FROM user WHERE auth_token = ?';
    const [result] = await conn.query(query, [token]);
    conn.release();
    return result;
}

const updateUser = async (key: string, value: string, id: string) : Promise<void> => {
    const conn = await getPool().getConnection();
    const query = `UPDATE user SET ${key} = ? WHERE id = ?`;
    const [ result ] = await conn.query(query, [ value, id]);
    conn.release();
}

export {register, checkEmail, checkPassword, checkPassword2, setToken, revokeToken, getUserAuthenticated, getUserUnauthenticated, authenticate, updateUser }