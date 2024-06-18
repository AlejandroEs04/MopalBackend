import Customer from "../models/Customer.js"
import CustomerUserView from "../models/CustomerUserView.js";

const getAllCustomers = async(req, res) => {
    const customerObj = new Customer();
    const customerUserObj = new CustomerUserView();
    const customers = await customerObj.getAll();
    const users = await customerUserObj.getAll();

    if(customers.length > 0 && users.length > 0) {
        for(let i=0;i<customers.length;i++) {
            const usersCustomer = users?.filter(user => user.CustomerID === customers[i].ID);
            customers[i].Users = usersCustomer;
        }
    }

    if(customers) {
        return res.status(200).json({
            status : 200, 
            msg : "Ok", 
            customers
        })
    } else {
        const error = new Error("Hubo un error")
        return res.status(500).json({status : 500, msg: error})
    }
}

const addNewCustomer = async(req, res) => {
    const { customer } = req.body;

    const customerObj = new Customer(customer);
    const existRfc = await customerObj.getByElement('RFC', customerObj.RFC);

    if(existRfc) {
        const error = new Error("Ya existe un cliente con el mismo RFC")
        return res.status(500).json({status : 500, msg: error})
    }

    const existBussinessName = await customerObj.getByElement('BusinessName', customerObj.BusinessName);

    if(existBussinessName) {
        const error = new Error("Ya existe un cliente con la misma razon social")
        return res.status(500).json({status : 500, msg: error})
    }

    const response = await customerObj.addOne(customerObj);

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
    getAllCustomers, 
    addNewCustomer
}