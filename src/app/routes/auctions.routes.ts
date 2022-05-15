import {Express} from "express";
import * as auctions from '../controllers/auctions.controller';
module.exports = ( app: Express ) => {
    app.route('/api/v1/auctions/categories')
        .get(auctions.getCategories);
    app.route( '/api/v1/auctions' )
        .get( auctions.list )
        .post( auctions.create );
    app.route( '/api/v1/auctions/:id/bids' )
        .get( auctions.getBids )
        .post( auctions.postBid );
    app.route( '/api/v1/auctions/:id' )
        .get( auctions.read )
        .patch( auctions.update )
        .delete( auctions.remove );
};