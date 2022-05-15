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
exports.postBid = exports.getBids = exports.create = exports.getCategories = exports.remove = exports.update = exports.read = exports.list = void 0;
const auctions = __importStar(require("../models/auctions.model"));
const users = __importStar(require("../models/users.model"));
const logger_1 = __importDefault(require("../../config/logger"));
const list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`GET all/subset of auctions`);
    const queries = req.query;
    try {
        const result = yield auctions.getAll(queries);
        res.status(200).send(result);
    }
    catch (err) {
        res.status(500)
            .send(`ERROR getting auctions ${err}`);
    }
});
exports.list = list;
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info("Attempting to create auction");
    const token = req.get('x-authorization');
    const info = req.body;
    const authentication = yield users.authenticate(token);
    const currentDate = new Date().toDateString();
    if (authentication.length === 0) {
        res.status(401).send("Unauthorized");
    }
    else if (info.categoryId === undefined || info.title === undefined || info.description === undefined || info.endDate === undefined) {
        res.status(400).send("Bad Request");
    }
    else {
        try {
            const auction = yield auctions.createAuction(info, authentication[0].id);
            res.status(201).send(JSON.stringify(({ auctionId: auction.insertId })));
        }
        catch (err) {
            res.status(500)
                .send(`ERROR creating auctions ${err}`);
        }
    }
});
exports.create = create;
const read = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info("Attempting to get auction");
    const id = req.params.id;
    try {
        const result = yield auctions.getOne(id);
        res.status(200).send(result);
    }
    catch (err) {
        res.status(500)
            .send(`ERROR getting auctions ${err}`);
    }
});
exports.read = read;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http("Attempting to update auction");
    const token = req.get('x-authorization');
    const id = req.params.id;
    const body = req.body;
    const authentication = yield users.authenticate(token);
    if (!(yield auctions.checkIfSeller(authentication, parseInt(id, 10)))) {
        res.status(401).send();
    }
    else if (!(yield auctions.checkIfModifiable(parseInt(id, 10)))) {
        res.status(403).send();
    }
    else if ((yield auctions.getOne(id)).length < 1) {
        res.status(404).send('thing');
    }
    else if (yield checkCategories(body.categoryId)) {
        const x = 1;
    }
    else {
        try {
            if (body.title !== undefined) {
                yield auctions.updateAuction('title', body.title, id);
            }
            if (body.description !== undefined) {
                yield auctions.updateAuction('description', body.description, id);
            }
            if (body.reserve !== undefined) {
                yield auctions.updateAuction('reserve', body.reserve, id);
            }
            if (body.endDate !== undefined) {
                yield auctions.updateAuction('end_date', body.endDate, id);
            }
            if (body.categoryId !== undefined) {
                yield auctions.updateAuction('category_id', body.categoryId, id);
            }
            res.status(200).send();
        }
        catch (err) {
            logger_1.default.info("ERROR: " + err);
        }
    }
});
exports.update = update;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http("Attempting to remove auction");
    const id = req.params.id;
    const token = req.get('x-authorization');
    const authentication = yield users.authenticate(token);
    if (!(yield auctions.checkIfSeller(authentication, parseInt(id, 10)))) {
        res.status(401).send();
    }
    else if (!(yield auctions.checkIfModifiable(parseInt(id, 10)))) {
        res.status(403).send();
    }
    else if ((yield auctions.getOne(id)).length < 1) {
        res.status(404).send();
    }
    else {
        try {
            yield auctions.deleteAuction(parseInt(id, 10));
            res.status(200).send();
        }
        catch (err) {
            logger_1.default.info("ERROR: " + err);
        }
    }
});
exports.remove = remove;
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http("Attempting to get auction categories");
    try {
        const result = yield auctions.getCategories();
        res.status(200).send(result);
    }
    catch (err) {
        res.status(500)
            .send(`ERROR getting categories ${err}`);
    }
});
exports.getCategories = getCategories;
const checkCategories = (newCategory) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield auctions.getCategories();
    const result = false;
    // tslint:disable-next-line:forin
    for (const category in categories) {
        // tslint:disable-next-line:no-console
        console.log(category);
        /*
        if (category.categoryId === newCategory) {
            result = true;
        } */
    }
    return result;
});
const getBids = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield auctions.getOne(req.params.id)).length < 1) {
        res.status(404).send();
    }
    else {
        try {
            const result = yield auctions.getBids(req.params.id);
            res.status(200).send(result);
        }
        catch (err) {
            res.status(500).send(`ERROR: ` + err);
        }
    }
});
exports.getBids = getBids;
const postBid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.get('x-authorization');
    const auctionId = req.params.id;
    const amount = req.body.amount;
    const authentication = yield users.authenticate(token);
    const previousBid = (yield auctions.getBids(auctionId))[0];
    let previousBidAmount = 0;
    if (previousBid !== undefined) {
        previousBidAmount = previousBid.amount;
    }
    // tslint:disable-next-line:no-console
    console.log((yield auctions.getOne(auctionId)).length);
    if (amount === undefined) {
        res.status(400).send();
    }
    else if (authentication[0].id === undefined) {
        res.status(401).send();
    }
    else if (amount <= previousBidAmount || (yield auctions.checkIfSeller(authentication[0].id, parseInt(auctionId, 10)))) {
        res.status(403).send();
    }
    else if ((yield auctions.getOne(auctionId)).length < 1) {
        res.status(404).send();
    }
    else {
        try {
            const timestamp = new Date();
            yield auctions.placeBid(auctionId, amount, authentication[0].id, timestamp);
            res.status(201).send();
        }
        catch (err) {
            res.status(500).send(err);
        }
    }
});
exports.postBid = postBid;
