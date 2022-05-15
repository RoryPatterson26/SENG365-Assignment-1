import * as users from '../models/users.model';
import Logger from "../../config/logger";
import {Request, Response} from "express";
import * as passwords from '../../config/passwords';
const register = async (req: Request, res: Response) : Promise<void> => {
    Logger.info('Attempting to register new user');
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    const emailResult = await users.checkEmail(email);
    if (!(email.includes("@"))) {
        res.status(400)
            .send(`User could not be created`);
    } else if (password.length < 1) {
        res.status(400)
            .send(`User could not be created`);
    } else if (emailResult[0].number > 0) {
        res.status(400)
            .send(`User could not be created`);
    } else if (firstName === undefined || lastName === undefined) {
        res.status(400)
            .send(`User could not be created`);
    } else {
        const passwordHash = await passwords.hash(password);
        try {
            const result = await users.register(firstName, lastName, email, passwordHash);
            res.status(201).send(JSON.stringify(({ userId: result.insertId})));
            Logger.info('User successfully registered')
        } catch (err) {
            res.status(500)
                .send(`ERROR creating user ${err}`);
        }
    }

};

const login = async (req: Request, res: Response): Promise<void> => {
    Logger.info('Logging in user');
    const email = req.body.email;
    const password = req.body.password;
    const loginHash = await passwords.hash(password);
    try {
        const result = await users.checkPassword(email);
        if (result[0].password.toString() === loginHash) {
            const userToken = await users.setToken(result[0].id);
            res.status(200).send(JSON.stringify({userId: result[0].id, token: userToken}));
        } else {
            res.status(400).send('Invalid Login');
        }
    } catch (err){
        res.status(500)
            .send(`ERROR logging in ${err}`);
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    Logger.http('Logging out user');
    const token = req.get('x-authorization');
    try {
        const loggedOut = await users.revokeToken(token);
        if (loggedOut) {
            res.status(200).send();
        } else {
            res.status(401).send();
        }
    } catch {
        res.status(500).send('ERROR');
    }
}

const getOne = async (req: Request, res: Response): Promise<void> => {
    const token = req.get('x-authorization');
    const id = req.params.id;
    const tokenId = await users.authenticate(token);
    try {
        if (tokenId[0].id.toString() === id) {
            const [ result ] = await users.getUserAuthenticated(parseInt(id, 10));
            res.status(200).send(result);
        } else {
            const [result] = await users.getUserUnauthenticated(parseInt(id, 10));
            if (result === undefined) {
                res.status(404).send();
            } else {
                res.status(200).send(result);
            }
        }

    } catch (err) {
        res.status(500)
            .send(`ERROR retrieving data ${err}`);
    }
}

const modify = async (req: Request, res: Response): Promise<void> => {
    Logger.http('Modifying user')
    const token = req.get('x-authorization');
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.password;
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const id = req.params.id;
    const emailResult = await users.checkEmail(email);
    const tokenId = await users.authenticate(token);
    const passwordHash = await passwords.hash(currentPassword);
    const newPasswordHash = await passwords.hash(newPassword);
    let flag = true;
    if (id !== tokenId[0].id.toString()) {
        res.status(401).send('Unauthorized');
    } else if (emailResult[0].number > 0) {
        res.status(400).send();
    } else {
        try {
            if (newPassword !== undefined) {
                if (passwordHash === (await users.checkPassword2(id))[0].password) {
                    await users.updateUser(`password`, newPasswordHash, id);
                } else {
                    res.status(401).send('Incorrect Password');
                    flag = false;
                }
            }
            if (firstName !== undefined && flag) {
                await users.updateUser(`first_name`, firstName, id);
            }
            if (lastName !== undefined && flag) {
                await users.updateUser(`last_name`, lastName, id);
            }
            if (email !== undefined && flag) {
                await users.updateUser('email', email, id);
            }
            res.status(200).send('User Modified');
        } catch (err) {
            res.status(500).send(`ERROR: ${err}`);
        }
    }

}

export { register, login, logout, getOne, modify }