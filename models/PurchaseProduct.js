import ActiveRecord from "./ActiveRecord.js";

class PurchaseProduct extends ActiveRecord {
    tableName = "PurchaseProduct"

    constructor(purchaseProduct) {
        super();
        this.PurchaseFolio = purchaseProduct?.PurchaseFolio;
        this.ProductFolio = purchaseProduct?.ProductFolio; 
        this.Quantity = purchaseProduct?.Quantity; 
        this.Discount = purchaseProduct?.Discount ?? 0;
    }
}

export default PurchaseProduct