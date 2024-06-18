import Supplier from "../models/Supplier.js"
import SupplierUserInfo from "../models/SupplierUserInfo.js";

const getAllSupplier = async(req, res) => {
    const supplierObj = new Supplier();
    const supplierUserObj = new SupplierUserInfo();
    const suppliers = await supplierObj.getAll();
    const users = await supplierUserObj.getAll();

    if(suppliers.length > 0 && users.length > 0) {
        for(let i = 0; i<suppliers.length;i++) {
            const usersSupplier = users?.filter(user => user.SupplierID === suppliers[i].ID);
            suppliers[i].Users = usersSupplier;
        }
    }

    if(suppliers) {
        return res.status(200).json({
            status : 200, 
            msg : "Ok", 
            suppliers
        })
    } else {
        const error = new Error("Hubo un error")
        return res.status(500).json({status : 500, msg: error})
    }
}

const getOneSupplier = async(req, res) => {
    const { id } = req.params;
    const supplierObj = new Supplier();

    const supplier = await supplierObj.getByID(id);

    if(supplier) {
        return res.status(200).json({
            status : 200, 
            msg : "Ok", 
            supplier
        })
    } else {
        const error = new Error("Hubo un error")
        return res.status(500).json({status : 500, msg: error})
    }
}

const addNewSupplier = async(req, res) => {
    const { supplier } = req.body;

    const supplierObj = new Supplier(supplier);

    const existRfc = await supplierObj.getByElement('RFC', supplierObj.RFC);

    if(existRfc) {
        const error = new Error("Ya existe un usuario con el mismo RFC")
        return res.status(500).json({status : 500, msg: error})
    }

    const existBussinessName = await supplierObj.getByElement('BusinessName', supplierObj.BusinessName);

    if(existBussinessName) {
        const error = new Error("Ya existe un usuario con la misma razon social")
        return res.status(500).json({status : 500, msg: error})
    }

    const response = await supplierObj.addOne(supplierObj);

    if(response) {
        return res.status(200).json({
            status : 200, 
            msg: response.msg
        })
    } else {
        const error = new Error("Hubo un error")
        return res.status(500).json({status : 500, msg: error})
    }
}

export {
    getAllSupplier, 
    getOneSupplier, 
    addNewSupplier
}