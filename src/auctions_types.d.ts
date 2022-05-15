type Auctions = {
    auctionID: number,
    title: string,
    categoryID: number,
    sellerID: number,
    sellerFirstName: string,
    sellerLastName: string,
    reserve: number,
    numBids: number,
    highestBid: number,
    endDate: Date,
}