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
exports.placeBid = exports.getBids = exports.updateAuction = exports.deleteAuction = exports.checkIfModifiable = exports.checkIfSeller = exports.getCategories = exports.getOne = exports.createAuction = exports.getAll = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const getAll = (queries) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting all auctions from the database`);
    const conn = yield (0, db_1.getPool)().getConnection();
    let finalQuery = '';
    const query = 'SELECT auction.id AS auctionId, title, category_id AS categoryID, seller_id AS sellerId, user.first_name AS sellerFirstName, ' +
        'user.last_name AS sellerLastName, reserve, ' +
        '(SELECT COUNT(*) FROM auction_bid WHERE auction_id = auction.id) as numBids, ' +
        // Test using just max(amount)
        '(SELECT MAX(amount) FROM auction_bid WHERE auction_id = auction.id) AS highestBid, ' +
        'end_date AS endDate ';
    const queryTable = 'FROM auction ';
    const where = 'WHERE ';
    const and = 'AND ';
    const or = 'OR ';
    const q = `title LIKE '%${queries.q}%' OR description LIKE '%${queries.q}%' `;
    const bidderId = ('auction_bid.user_id = ' + queries.bidderId + ' ');
    const sellerId = ('auction.seller_id = ' + queries.sellerId + ' ');
    const queryJoin = 'JOIN auction_bid ON auction.id = auction_bid.auction_id ' +
        'JOIN user ON auction.seller_id = user.id ';
    const queryEnd = 'ORDER BY ';
    finalQuery += query + queryTable + queryJoin;
    if (queries.bidderId !== undefined || queries.sellerId !== undefined || queries.sortBy !== undefined || queries.categoryIds !== undefined || queries.q !== undefined) {
        finalQuery += where;
    }
    if (queries.bidderId !== undefined) {
        finalQuery += bidderId;
        finalQuery += and;
    }
    if (queries.sellerId !== undefined) {
        finalQuery += sellerId;
        finalQuery += and;
    }
    if (queries.categoryIds !== undefined) {
        const categoryId = ('auction.category_id = ' + queries.categoryIds + ' ');
        finalQuery += categoryId;
    }
    if (finalQuery.endsWith('OR ')) {
        finalQuery = finalQuery.slice(0, -3);
        finalQuery += ') ';
    }
    if (queries.q !== undefined) {
        if (!(finalQuery.endsWith('OR ') || finalQuery.endsWith('AND ') || finalQuery.endsWith('auction '))) {
            finalQuery += and;
        }
        finalQuery += q;
        finalQuery += and;
    }
    if (finalQuery.endsWith('AND ')) {
        finalQuery = finalQuery.slice(0, -4);
    }
    finalQuery += 'GROUP BY auction.id ';
    if (queries.sortBy === 'ALPHABETICAL_ASC') {
        finalQuery += queryEnd + 'auction.title ASC';
    }
    else if (queries.sortBy === 'ALPHABETICAL_DESC') {
        finalQuery += queryEnd + 'auction.title DESC';
    }
    else if (queries.sortBy === 'BIDS_ASC') {
        finalQuery += queryEnd + 'auction_bid.timestamp ASC';
    }
    else if (queries.sortBy === 'BIDS_DESC') {
        finalQuery += queryEnd + 'auction_bid.timestamp DESC';
    }
    else if (queries.sortBy === 'CLOSING_LAST') {
        finalQuery += queryEnd + 'auction.end_date DESC';
    }
    else if (queries.sortBy === 'RESERVE_ASC') {
        finalQuery += queryEnd + 'auction.reserve ASC';
    }
    else if (queries.sortBy === 'RESERVE_DESC') {
        finalQuery += queryEnd + 'auction.reserve DESC';
    }
    else {
        finalQuery += queryEnd + 'auction.end_date ASC';
    }
    const [rows] = yield conn.query(finalQuery);
    conn.release();
    let startIndex = queries.startIndex;
    if (queries.startIndex === undefined) {
        startIndex = 0;
    }
    if (rows !== undefined) {
        if (queries.count !== undefined) {
            return JSON.stringify({ 'auctions': rows.slice(startIndex, startIndex + queries.count), 'count': rows.length });
        }
        else {
            return JSON.stringify({ 'auctions': rows.slice(startIndex), 'count': rows.length });
        }
    }
    else {
        return JSON.stringify({ auctions: rows });
    }
});
exports.getAll = getAll;
const createAuction = (queries, sellerId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http('Creating auction in database');
    const title = queries.title;
    const description = queries.description;
    const endDate = queries.endDate;
    let reserve = queries.reserve;
    const categoryId = queries.categoryId;
    const conn = yield (0, db_1.getPool)().getConnection();
    if (reserve === undefined) {
        reserve = 1;
    }
    const query = 'INSERT INTO auction (title, description, end_date, reserve, seller_id, category_id) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = yield conn.query(query, [title, description, endDate, reserve, sellerId, categoryId]);
    conn.release();
    return result;
});
exports.createAuction = createAuction;
const getOne = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT auction.id AS auctionId, title, category_id as categoryId, seller_id as sellerId, user.first_name AS sellerFirstName, ' +
        'user.last_name AS sellerLastName, reserve, (SELECT COUNT(*) FROM auction_bid WHERE auction_id = auction.id) as numBids, ' +
        '(SELECT MAX(amount) FROM auction_bid WHERE auction_id = auction.id) AS highestBid, end_date AS endDate, description ' +
        'FROM auction ' +
        'JOIN user ON auction.seller_id = user.id ' +
        'JOIN auction_bid on auction.id = auction_bid.auction_id ' +
        'WHERE auction.id = ?' +
        'GROUP BY auction.id';
    const [result] = yield conn.query(query, [id]);
    conn.release();
    return result;
});
exports.getOne = getOne;
const getCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT id as categoryId, name FROM category';
    const [result] = yield conn.query(query);
    conn.release();
    return result;
});
exports.getCategories = getCategories;
const checkIfSeller = (userId, auctionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Checking if user is auction seller');
    const conn = yield (0, db_1.getPool)().getConnection();
    let flag = false;
    const query = 'SELECT id from auction WHERE seller_id = ?';
    const [result] = yield conn.query(query, [userId]);
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < result.length; i++) {
        if (result[i].id === auctionId) {
            flag = true;
        }
    }
    conn.release();
    return flag;
});
exports.checkIfSeller = checkIfSeller;
const checkIfModifiable = (id) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Checking if auction is modifiable');
    const conn = yield (0, db_1.getPool)().getConnection();
    let flag = false;
    const query = 'SELECT * FROM auction_bid WHERE auction_id = ?';
    const [result] = yield conn.query(query, [id]);
    if (result.length > 0) {
        flag = true;
    }
    conn.release();
    return flag;
});
exports.checkIfModifiable = checkIfModifiable;
const deleteAuction = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'DELETE FROM auction WHERE id = ?';
    const [result] = yield conn.query(query, [id]);
    conn.release();
    return result;
});
exports.deleteAuction = deleteAuction;
const updateAuction = (key, value, id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'UPDATE auction SET ${key} = ? WHERE id = ?';
    const [result] = yield conn.query(query, [value, id]);
    conn.release();
    return result;
});
exports.updateAuction = updateAuction;
const getBids = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT user_id AS bidder_id, amount, user.first_name AS firstName, user.last_name AS lastName, timestamp ' +
        'FROM auction_bid JOIN user ON auction_bid.user_id = user.id ' +
        'WHERE auction_id = ? ORDER BY timestamp DESC';
    const [result] = yield conn.query(query, [parseInt(id, 10)]);
    conn.release();
    return result;
});
exports.getBids = getBids;
const placeBid = (auctionId, amount, userId, timestamp) => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'INSERT INTO auction_bid (auction_id, user_id, amount, timestamp) VALUES (?, ?, ?, ?)';
    yield conn.query(query, [parseInt(auctionId, 10), userId, amount, timestamp]);
    conn.release();
});
exports.placeBid = placeBid;
