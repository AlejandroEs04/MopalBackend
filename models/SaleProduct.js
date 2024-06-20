import ActiveRecord from "./ActiveRecord.js";

class SaleProduct extends ActiveRecord {
    tableName = "SaleProduct"

    constructor(saleProduct) {
        super();
        this.SaleFolio = saleProduct?.SaleFolio;
        this.ProductFolio = saleProduct?.ProductFolio;
        this.Assembly = saleProduct?.Assembly ?? null;
        this.Quantity = saleProduct?.Quantity;
        this.Percentage = saleProduct?.Percentage;
        this.PricePerUnit = saleProduct?.PricePerUnit;
        this.Observations = saleProduct?.Observations ?? null;
    }
}

export default SaleProduct