import * as auctions from '../models/auctions.model';
import * as users from '../models/users.model';
import Logger from "../../config/logger";
import {Request, Response} from "express";

const list = async (req: Request, res: Response) : Promise<void> => {
    Logger.info(`GET all/subset of auctions`)
    const queries = req.query;
    try {
        const result = await auctions.getAll(queries);
        res.status( 200 ).send( result );
    } catch( err ) {
        res.status( 500 )
            .send( `ERROR getting auctions ${ err }` );
    }
};

const create = async (req: Request, res: Response) : Promise<void> => {
    Logger.info("Attempting to create auction");
    const token = req.get('x-authorization');
    const info = req.body;
    const authentication = await users.authenticate(token);
    const currentDate = new Date().toDateString();
    if (authentication.length === 0) {
        res.status(401).send("Unauthorized");
    } else  if (info.categoryId === undefined || info.title === undefined || info.description === undefined || info.endDate === undefined) {
        res.status(400).send("Bad Request");
    } else {
        try {
            const auction = await auctions.createAuction(info, authentication[0].id);
            res.status(201).send(JSON.stringify(({ auctionId: auction.insertId})));
        } catch (err) {
            res.status( 500 )
                .send( `ERROR creating auctions ${ err }` );
        }
    }
}

const read = async (req: Request, res: Response) : Promise<void> => {
    Logger.info("Attempting to get auction");
    const id = req.params.id;
    try {
        const result = await auctions.getOne(id);
        res.status( 200 ).send( result );
    } catch( err ) {
        res.status( 500 )
            .send( `ERROR getting auctions ${ err }` );
    }
}

const update = async (req: Request, res: Response) : Promise<void> => {
    Logger.http("Attempting to update auction");
    const token = req.get('x-authorization');
    const id = req.params.id;
    const body = req.body;
    const authentication = await users.authenticate(token);
    if (!(await auctions.checkIfSeller(authentication, parseInt(id, 10)))) {
        res.status(401).send();
    } else if (!(await auctions.checkIfModifiable(parseInt(id, 10)))) {
        res.status(403).send();
    } else if ((await auctions.getOne(id)).length < 1) {
        res.status(404).send('thing');
    } else if (await checkCategories(body.categoryId)) {
        const x = 1;
    } else {
        try {
            if (body.title !== undefined) {
                await auctions.updateAuction('title', body.title, id);
            }
            if (body.description !== undefined) {
                await auctions.updateAuction('description', body.description, id);
            }
            if (body.reserve !== undefined) {
                await auctions.updateAuction('reserve', body.reserve, id);
            }
            if (body.endDate !== undefined) {
                await auctions.updateAuction('end_date', body.endDate, id);
            }
            if (body.categoryId !== undefined) {
                await auctions.updateAuction('category_id', body.categoryId, id);
            }
            res.status(200).send()
        } catch (err) {
            Logger.info("ERROR: "+ err);
        }
    }
}

const remove = async (req: Request, res: Response) : Promise<void> => {
    Logger.http("Attempting to remove auction");
    const id = req.params.id;
    const token = req.get('x-authorization');
    const authentication = await users.authenticate(token);
    if (!(await auctions.checkIfSeller(authentication, parseInt(id, 10)))) {
        res.status(401).send();
    } else if (!(await auctions.checkIfModifiable(parseInt(id, 10)))) {
        res.status(403).send();
    } else if ((await auctions.getOne(id)).length < 1) {
        res.status(404).send();
    } else {
        try {
            await auctions.deleteAuction(parseInt(id, 10));
            res.status(200).send()
        } catch (err) {
            Logger.info("ERROR: "+ err);
        }
    }
}

const getCategories = async (req: Request, res: Response) : Promise<void> => {
    Logger.http("Attempting to get auction categories");
    try {
        const result = await auctions.getCategories();
        res.status( 200 ).send( result );
    } catch( err ) {
        res.status(500)
            .send(`ERROR getting categories ${err}`);
    }
}

const checkCategories = async (newCategory: number) : Promise<boolean> => {
    const categories = await auctions.getCategories();
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
}
const getBids = async (req: Request, res: Response) : Promise<void> => {
    if ((await auctions.getOne(req.params.id)).length < 1 ) {
        res.status(404).send();
    } else {
        try {
            const result = await auctions.getBids(req.params.id);
            res.status(200).send(result);
        } catch (err) {
            res.status(500).send(`ERROR: ` + err);
        }
    }
}
const postBid = async (req: Request, res: Response) : Promise<void> => {
    const token = req.get('x-authorization');
    const auctionId = req.params.id;
    const amount = req.body.amount;
    const authentication = await users.authenticate(token);
    const previousBid = (await auctions.getBids(auctionId))[0];
    let previousBidAmount = 0;
    if ( previousBid !== undefined) {
        previousBidAmount = previousBid.amount;
    }
    if (amount === undefined) {
        res.status(400).send();
    } else if (authentication[0].id === undefined) {
        res.status(401).send();
    } else if (amount <= previousBidAmount || (await auctions.checkIfSeller(authentication[0].id, parseInt(auctionId, 10)))) {
        res.status(403).send();
    } else if ((await auctions.getOne(auctionId)).length < 1 ) {
        res.status(404).send();
    } else {
        try {
            const timestamp = new Date();
            await auctions.placeBid(auctionId, amount, authentication[0].id, timestamp);
            res.status(201).send();
        } catch (err) {
            res.status(500).send(err);
        }
    }
}

export { list, read, update, remove, getCategories, create, getBids, postBid }