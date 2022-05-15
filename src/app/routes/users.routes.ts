import {Express} from "express";
import * as users from '../controllers/users.controller';
module.exports = ( app: Express ) => {
    app.route('/api/v1/users/register')
        .post(users.register);
    app.route('/api/v1/users/login')
        .post(users.login);
    app.route('/api/v1/users/logout')
        .post(users.logout);
    app.route( '/api/v1/users/:id' )
        .get(users.getOne)
        .patch(users.modify);
};