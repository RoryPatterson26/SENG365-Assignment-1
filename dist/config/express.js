"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_middleware_1 = __importDefault(require("../app/middleware/cors.middleware"));
const logger_1 = __importDefault(require("./logger"));
exports.default = () => {
    const app = (0, express_1.default)();
    // MIDDLEWARE
    app.use(cors_middleware_1.default);
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.raw({ type: 'text/plain' })); // for the /executeSql endpoint
    // DEBUG (you can remove these)
    app.use((req, res, next) => {
        logger_1.default.http(`##### ${req.method} ${req.path} #####`);
        next();
    });
    app.get('/', (req, res) => {
        res.send({ 'message': 'Hello World!' });
    });
    // ROUTES
    require('../app/routes/backdoor.routes')(app);
    require('../app/routes/auctions.routes')(app);
    require('../app/routes/users.routes')(app);
    return app;
};
