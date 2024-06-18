import ActiveRecord from "./ActiveRecord.js";

class ProductInfo extends ActiveRecord {
    tableName = 'ProductInfo';

    constructor(product) {
        super();
        this.Folio = product?.Folio;
        this.Name = product?.Name;
        this.Description = product?.Description;
        this.ListPrice = product?.ListPrice;
        this.Cost = product?.Cost;
        this.Type = product?.Type;
        this.Classification = product?.Classification;
        this.Stock = product?.Stock;
        this.Active = product?.Active;
        this.ImageHeaderURL = product?.ImageHeaderURL;
        this.ImageIconURL = product?.ImageIconURL;
    }
}

export default ProductInfo;