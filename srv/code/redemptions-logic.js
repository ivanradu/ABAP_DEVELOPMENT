/**
 * @On(event = { "CREATE" }, entity = "my_new_projectSrv.Redemptions")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
 */
module.exports = async function(request) {
    const { Redemptions, Customers } = cds.entities;

    // Extract the data from the request payload
    const { redeemedAmount, customer_ID } = request.data;

    if (redeemedAmount === undefined || customer_ID === undefined) {
        request.reject(400, "Missing required fields: redeemedAmount or customer_ID.");
        return;
    }

    // Retrieve the customer's current reward points
    const customer = await SELECT.one.from(Customers).where({ ID: customer_ID });
    if (!customer) {
        request.reject(404, `Customer with ID ${customer_ID} not found.`);
        return;
    }

    // Check if the customer has enough reward points to redeem
    if (customer.totalRewardPoints < redeemedAmount) {
        request.reject(400, "Insufficient reward points to redeem the specified amount.");
        return;
    }

    // Calculate the new values for totalRewardPoints and totalRedeemedRewardPoints
    const newTotalRewardPoints = customer.totalRewardPoints - redeemedAmount;
    const newTotalRedeemedRewardPoints = customer.totalRedeemedRewardPoints + redeemedAmount;

    // Update the customer's reward points
    await UPDATE(Customers)
        .set({
            totalRewardPoints: newTotalRewardPoints,
            totalRedeemedRewardPoints: newTotalRedeemedRewardPoints
        })
        .where({ ID: customer_ID });
};