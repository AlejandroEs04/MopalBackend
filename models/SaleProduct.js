import ActiveRecord from "./ActiveRecord.js";

class SaleProduct extends ActiveRecord {
    tableName = "SaleProduct"

    constructor(saleProduct) {
        super();
        this.SaleFolio = saleProduct?.SaleFolio;
        this.ProductFolio = saleProduct?.ProductFolio;
        this.Quantity = saleProduct?.Quantity;
        this.Percentage = saleProduct?.Percentage;
    }
}

export default SaleProduct