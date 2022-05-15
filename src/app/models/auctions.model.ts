import { getPool } from "../../config/db";
import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";

const getAll = async (queries: any) : Promise<string> => {
    Logger.info(`Getting all auctions from the database`);
    const conn = await getPool().getConnection();
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
    'JOIN user ON auction.seller_id = user.id '
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
        finalQuery += ') '
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
    } else if (queries.sortBy === 'ALPHABETICAL_DESC') {
        finalQuery += queryEnd + 'auction.title DESC';
    } else if (queries.sortBy === 'BIDS_ASC') {
        finalQuery += queryEnd + 'auction_bid.timestamp ASC';
    } else if (queries.sortBy === 'BIDS_DESC') {
        finalQuery += queryEnd + 'auction_bid.timestamp DESC';
    } else if (queries.sortBy === 'CLOSING_LAST') {
        finalQuery += queryEnd + 'auction.end_date DESC';
    } else if (queries.sortBy === 'RESERVE_ASC') {
        finalQuery += queryEnd + 'auction.reserve ASC';
    } else if (queries.sortBy === 'RESERVE_DESC') {
        finalQuery += queryEnd + 'auction.reserve DESC';
    } else {
        finalQuery += queryEnd + 'auction.end_date ASC';
    }
    const [ rows ] = await conn.query( finalQuery );
    conn.release();
    let startIndex = queries.startIndex;
    if (queries.startIndex === undefined) {
        startIndex = 0;
    }
    if (rows !== undefined) {
        if (queries.count !== undefined) {
            return JSON.stringify({'auctions': rows.slice(startIndex, startIndex + queries.count), 'count': rows.length});
        } else {
            return JSON.stringify({'auctions': rows.slice(startIndex), 'count': rows.length});
        }
    } else {
        return JSON.stringify({auctions: rows});
    }
};

const createAuction = async (queries: any, sellerId: number) : Promise<any> => {
    Logger.http('Creating auction in database');
    const title  = queries.title;
    const description  = queries.description;
    const endDate  = queries.endDate;
    let reserve  = queries.reserve;
    const categoryId  = queries.categoryId;
    const conn = await getPool().getConnection();
    if (reserve === undefined) {
        reserve = 1;
    }
    const query = 'INSERT INTO auction (title, description, end_date, reserve, seller_id, category_id) VALUES (?, ?, ?, ?, ?, ?)';
    const [ result ] = await conn.query(query, [ title, description, endDate, reserve, sellerId, categoryId]);
    conn.release()
    return result;
}
const getOne = async (id: string) : Promise<any> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT auction.id AS auctionId, title, category_id as categoryId, seller_id as sellerId, user.first_name AS sellerFirstName, ' +
        'user.last_name AS sellerLastName, reserve, (SELECT COUNT(*) FROM auction_bid WHERE auction_id = auction.id) as numBids, ' +
        '(SELECT MAX(amount) FROM auction_bid WHERE auction_id = auction.id) AS highestBid, end_date AS endDate, description ' +
        'FROM auction ' +
        'JOIN user ON auction.seller_id = user.id ' +
        'JOIN auction_bid on auction.id = auction_bid.auction_id ' +
        'WHERE auction.id = ?' +
        'GROUP BY auction.id';
    const [ result ] = await conn.query(query, [ id ]);
    conn.release();
    return result;
}

const getCategories = async () : Promise<any> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT id as categoryId, name FROM category';
    const [ result ] = await conn.query(query);
    conn.release();
    return result;
}

const checkIfSeller = async (userId: number, auctionId: number) : Promise<boolean> => {
    Logger.info('Checking if user is auction seller')
    const conn = await getPool().getConnection();
    let flag = false;
    const query = 'SELECT id from auction WHERE seller_id = ?';
    const [ result ] = await conn.query(query, [userId]);
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < result.length; i++) {
        if (result[i].id === auctionId) {
            flag = true;
        }
    }
    conn.release();
    return flag;
}

const checkIfModifiable = async (id: number) : Promise<boolean> => {
    Logger.info('Checking if auction is modifiable')
    const conn = await getPool().getConnection();
    let flag = false;
    const query = 'SELECT * FROM auction_bid WHERE auction_id = ?';
    const [ result ] = await conn.query(query, [id]);
    if (result.length > 0) {
        flag = true;
    }
    conn.release();
    return flag;
}

const deleteAuction = async (id: number) : Promise<any> => {
    const conn = await getPool().getConnection();
    const query = 'DELETE FROM auction WHERE id = ?';
    const [ result ] = await conn.query(query, [id]);
    conn.release();
    return result;
}

const updateAuction = async (key: string, value: any, id: string): Promise<any> => {
    const conn = await getPool().getConnection();
    const query = 'UPDATE auction SET ${key} = ? WHERE id = ?';
    const [ result ] = await conn.query(query, [value, id]);
    conn.release()
    return result;
}

const getBids = async (id: string) : Promise <Bid[]> => {
    const conn = await getPool().getConnection();
    const query = 'SELECT user_id AS bidder_id, amount, user.first_name AS firstName, user.last_name AS lastName, timestamp ' +
        'FROM auction_bid JOIN user ON auction_bid.user_id = user.id ' +
        'WHERE auction_id = ? ORDER BY timestamp DESC';
    const [ result ] = await conn.query(query, [parseInt(id, 10)]);
    conn.release()
    return result
}

const placeBid = async (auctionId: string, amount: string, userId: string, timestamp: Date) : Promise<void> => {
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO auction_bid (auction_id, user_id, amount, timestamp) VALUES (?, ?, ?, ?)';
    await conn.query(query, [parseInt(auctionId, 10), userId, amount, timestamp]);
    conn.release();
}
export { getAll, createAuction, getOne, getCategories, checkIfSeller, checkIfModifiable, deleteAuction, updateAuction, getBids, placeBid }