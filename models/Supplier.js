import ActiveRecord from "./ActiveRecord.js";

class Supplier extends ActiveRecord {
    tableName = "Supplier"

    constructor(supplier) {
        super();
        this.ID = supplier?.ID;
        this.BusinessName = supplier?.BusinessName;
        this.Address = supplier?.Address;
        this.RFC = supplier?.RFC;
    }
}

export default Supplier;