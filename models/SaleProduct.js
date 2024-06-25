import ActiveRecord from "./ActiveRecord.js";

class SaleProduct extends ActiveRecord {
    tableName = "SaleProduct"

    constructor(saleProduct) {
        super();
        this.SaleFolio = saleProduct?.SaleFolio;
        this.ProductFolio = saleProduct?.ProductFolio;
        this.Assembly = saleProduct?.Assembly ?? '';
        this.AssemblyGroup = saleProduct?.AssemblyGroup ?? '';
        this.Quantity = saleProduct?.Quantity;
        this.Percentage = saleProduct?.Percentage ?? 100;
        this.PricePerUnit = saleProduct?.PricePerUnit;
        this.Observations = saleProduct?.Observations ?? '';
    }
}

export default SaleProduct