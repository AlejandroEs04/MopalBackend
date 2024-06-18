import { configDotenv } from "dotenv";
import { requestAcepted, requestCanceled, requestEmail } from "../helpers/email.js";
import { io } from "../index.js";
import Request from "../models/Request.js"
import RequestInfoView from "../models/RequestInfoView.js";
import RequestView from "../models/RequestView.js";
import SupplierUserInfo from "../models/SupplierUserInfo.js"
import UserInfo from "../models/UserInfo.js";
import Product from "../models/Product.js";
import RequestProduct from "../models/RequestProduct.js";
import RequestProductView from "../models/RequestProductView.js";
import ProductInfo from "../models/ProductInfo.js";

const getAllRequest = async(req, res) => {
    const requestViewObj = new RequestInfoView();
    const requestProductsObj = await new RequestProductView().getAll();

    let request = await requestViewObj.getAll();

    for(let i = 0;i<request.length;i++) {
        const productsArray = requestProductsObj.filter(product => product.RequestID === request[i].ID)

        request[i].products = productsArray
    }

    if(request) {
        return res.status(200).json({
            status : 200, 
            msg : "Ok", 
            request
        })
    }
} 

const getOneRequest = async(req, res) => {
    const { id } = req.params

    const requestObj = new RequestInfoView();
    const requestProductsObj = await new RequestProductView().getAll();
    
    const request = await requestObj.getByElement('ID', +id)

    const products = requestProductsObj.filter(product => product.RequestID === +id)

    if(products.length > 0) {
        request.products = products
    }

    if(request) {
        return res.status(200).json({
            statu: 200, 
            msg: "Ok", 
            request
        })
    } else {
        return res.status(500).json({
            status: 500, 
            msg: "Hubo un error"
        })
    }
}

const getUserRequest = async(req, res) => {
    const { userId } = req.params

    const requestObj = new RequestInfoView();
    const requestProducts = await new RequestProduct().getAll()
    const productObj = new ProductInfo()

    const requests = await requestObj.getByElementArray('UserID', +userId);

    for(let i=0;i<requests.length;i++) {
        const products = requestProducts?.filter(product => product.RequestID === requests[i].ID)
        requests[i].products = products

        for(let j=0;j<requests[i].products.length;j++) {
            const product = await productObj.getByFolio(requests[i].products[j].ProductFolio);
            requests[i].products[j].Name = product.Name
            requests[i].products[j].ListPrice = product.ListPrice
            requests[i].products[j].Cost = product.Cost
        }
    }

    if(requests) {
        return res.status(201).json({
            status: 201, 
            requests
        })
    }
}

const addNewRequest = async(req, res) => {
    const { request } = req.body;
    const { user } = req;

    let bussinesName = "";
    let fullName = "";
    let userEmail = "";

    const requestObj = new Request(request);
    const RequestProductObj = new RequestProduct();

    let supplierUserObj = await new SupplierUserInfo().getByElement('UserID', user.ID);
    if(supplierUserObj) {
        bussinesName = supplierUserObj.BusinessName;
        fullName = supplierUserObj.FullName;
        userEmail = supplierUserObj.Email;
    }

    const customerUserObj = await new SupplierUserInfo().getByElement('UserID', user.ID);
    if(customerUserObj) {
        bussinesName = customerUserObj.BusinessName;
        fullName = customerUserObj.FullName;
        userEmail = customerUserObj.Email;
    }

    const response = await requestObj.addOne(requestObj);

    if(response) {
        for(let i = 0;i<request.products.length;i++) {
            request.products[i].RequestID = response.response[0].insertId
        }

        const responseProducts = await RequestProductObj.addMany(request.products);

        if(!responseProducts) {
            return res.status(500).json({
                status : 500, 
                msg : "Hubo un error al agregar los productos"
            })
        }

        const datos = {
            bussinesName, 
            userName : fullName, 
            userEmail, 
            products : request.products, 
            requestID : response.response[0].insertId, 
        };

        requestObj.ID = response.response[0].insertId;
        requestObj.UserFullName = fullName

        await requestEmail(datos);

        io.emit('requestCreated', { request: requestObj })

        return res.status(200).json({
            status : 200, 
            msg: "Solicitud generada con exito"
        })
    } else {
        return res.status(500).json({status : 500, msg: "Hubo un error al generar la solicitud, por favor, intentelo mas tarde"})
    }
}

const acceptRequest = async(req, res) => {
    const { id } = req.params
    const { requestOld, edited } = req.body

    const requestObj = new Request();
    const productObj = new Product();
    const requestProductsObj = new RequestProduct();

    const request = await requestObj.getByID(id);

    const requestProduct = await requestProductsObj.getByElementArray('RequestID', +id);

    if(edited) {
        for(let i=0; i<requestOld.products.length; i++) {
            const productNewObj = new RequestProduct(requestOld.products[i]);

            const sqlUpdateRequestProduct = `
                UPDATE RequestProduct 
                    SET 
                        ProductFolio = '${productNewObj.ProductFolio}', 
                        Assembly = '${productNewObj.Assembly}',
                        Quantity = ${productNewObj.Quantity}, 
                        Percentage = ${productNewObj.Percentage} 
                WHERE RequestID = ${productNewObj.RequestID}
            `

            const response = await productObj.exectQuery(sqlUpdateRequestProduct);

            if(!response) {
                return res.status(500).json({
                    status: 500, 
                    msg: "Ha habido un error actualizando el producto"
                })
            }
        }
    }

    for(let i=0;i<requestProduct.length;i++) {
        const product = await productObj.getByFolio(requestProduct[i].ProductFolio);

        const sqlUpdateStock = `
            UPDATE Product 
            SET 
                StockAvaible = ${product.StockAvaible - requestProduct[i].Quantity},
                StockOnHand = ${product.StockOnHand + requestProduct[i].Quantity}
            WHERE Folio = '${requestProduct[i].ProductFolio}'
        `
        const responseProduct = await productObj.exectQuery(sqlUpdateStock);

        if(!responseProduct) {
            return res.status(500).json({
                status: 500, 
                msg: "Ha habido un error actualizando el producto"
            })
        }
    }
    
    const response = await requestObj.updateOneColumn(+id, 'Status', 2)

    const reqUser = await requestObj.getByElement('ID', +id);
    const userObj = new UserInfo();
    const user = await userObj.getByElement('ID', reqUser.UserID)
    
    /**await requestAcepted({
        FullName : user.FullName, 
        Email : user.Email, 
        product : requestProduct
    })*/

    if(response) {
        io.emit('requestUpdate', { msg: "Ok" })

        return res.status(201).json({
            status: 201, 
            msg: "Se ha confirmado la solicitud"
        })
    } else {
        return res.status(500).json({
            status: 500, 
            msg: "Ha habido un error, por favor intentelo mas tarde"
        })
    }
}

const cancelRequest = async(req, res) => {
    const { id } = req.params
    const requestObj = new Request()

    const reqUser = await requestObj.getByElement('ID', +id);
    const userObj = new UserInfo();
    const user = await userObj.getByElement('ID', reqUser.UserID)
    
    await requestCanceled({
        FullName : user.FullName, 
        Email : user.Email, 
        productFolio : reqUser.ProductFolio,
        quantity : reqUser.Quantity
    })

    const response = requestObj.deleteOneId(id);

    if(response) {
        io.emit('requestUpdate', { msg: "Ok" })

        return res.status(201).json({
            status: 201, 
            msg: "Se ha eliminado la solicitud"
        })
    } else {
        return res.status(500).json({
            status: 500, 
            msg: "Ha habido un error, por favor intentelo mas tarde"
        })
    }
}

const toggleStatus = async(req, res) => {
    const { id } = req.params;
    const { statusId } = req.body;

    const requestObj = new Request();
    const requestProductsObj = new RequestProduct();
    const productObj = new Product();

    const request = await requestObj.getByID(id)

    if(statusId === 4) {
        const requestProducts = await requestProductsObj.getByElementArray('RequestID', id);

        for(let i=0;i<requestProducts.length;i++) {
            const product = await productObj.getByFolio(requestProducts[i].ProductFolio);

            const sqlUpdateStock = `
                UPDATE Product 
                SET 
                StockOnHand = ${product.StockOnHand - requestProducts[i].Quantity}
                WHERE Folio = '${product.Folio}'
            `

            if(!await productObj.exectQuery(sqlUpdateStock)) {
                return res.status(501).json({
                    status : 501, 
                    msg : "Hubo un error al actualizar los productos"
                })
            }
        }

    }

    const response = await requestObj.updateOneColumn(+id, 'Status', +statusId);

    if(response) {
        io.emit('requestUpdate', { msg: "Ok" })

        return res.status(200).json({
            status : 200, 
            msg : "Estatus actualizado correctamente"
        })
    } else {
        return res.status(501).json({
            msg : "Hubo un error al actualizar el estado de la solicitud"
        })
    }
}

export {
    addNewRequest, 
    getAllRequest, 
    getOneRequest, 
    acceptRequest, 
    cancelRequest, 
    getUserRequest, 
    toggleStatus
}