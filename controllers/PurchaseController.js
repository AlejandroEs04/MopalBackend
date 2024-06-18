import { io } from "../index.js";
import Product from "../models/Product.js";
import ProductInfo from "../models/ProductInfo.js";
import Purchase from "../models/Purchase.js";
import PurchaseInfo from "../models/PurchaseInfo.js";
import PurchaseProduct from "../models/PurchaseProduct.js";
import PurchaseProductInfo from "../models/PurchaseProductInfo.js";

const getAllPurchase = async(req, res) => {
    const purchaseInfoObj = new PurchaseInfo();
    const purchaseProductInfo = new PurchaseProductInfo();

    const purchases = await purchaseInfoObj.getAll();
    const products = await purchaseProductInfo.getAll();

    if(purchases && purchaseProductInfo) {
        for(let i=0;i<purchases.length;i++) {
            const productsArray = products?.filter(product => product.PurchaseFolio === purchases[i].Folio)
            purchases[i].Products = productsArray;
        }

        return res.status(200).json({
            status : 200, 
            msg : "Ok", 
            purchases
        })
    } else {
        const error = new Error("Hubo un error")
        return res.status(500).json({status : 500, msg: error})
    }
}

const addNewPurchase = async(req, res) => {
    const { purchase } = req.body;

    const productObj = new Product();
    const purchaseObj = new Purchase(purchase)
    
    const response = await purchaseObj.addOneWithoutFolio(purchaseObj);

    if(!response) {
        return res.status(500).json({msg : "Hubo un error"})
    }

    const productsArray = [];

    for(let i = 0; i < purchase.products.length; i++) {
        productsArray[i] = new PurchaseProduct({
            PurchaseFolio : response.response[0].insertId, 
            ProductFolio : purchase.products[i].Folio, 
            Quantity : purchase.products[i].Quantity, 
            Discount : purchase.products[i].Discount ?? 0
        })

        const product = await productObj.getByFolio(productsArray[i].ProductFolio);

        const res = await productObj.updateOneColumn(productsArray[i].ProductFolio, 'StockOnWay', (+product.StockOnWay + +productsArray[i].Quantity))

        if(!res) {
            return res.status(500).json({
                status : 500, 
                msg : "Hubo un error al actualizar el producto"
            })
        }
    }
    
    const purchaseProductObj = new PurchaseProduct();

    const responseProducts = await purchaseProductObj.addMany(productsArray);

    if(responseProducts) {
        io.emit('purchaseUpdate', { update: true })

        return res.status(200).json({
            status : 200, 
            msg: "Compra generada con exito"
        })
    } else {
        const error = new Error("Hubo un error")
        return res.status(500).json({status : 500, msg: error})
    }
}

const updatePurchase = async(req, res) => {
    const { purchase } = req.body;

    const purchaseObj = new Purchase(purchase)
    const purchaseProductObj = new PurchaseProduct();
    const productObj = new Product();

    for(let i = 0;i < purchase.products.length; i++) {
        const sqlGetProducts = `
            SELECT * FROM PurchaseProduct 
            WHERE ProductFolio = '${purchase.products[i].Folio}' AND PurchaseFolio = ${purchaseObj.Folio}
        `
        const product = await purchaseProductObj.exectQueryInfo(sqlGetProducts);

        if(product.length === 0) {
            const productNew = new PurchaseProduct({
                PurchaseFolio : purchaseObj.Folio, 
                ProductFolio : purchase.products[i].Folio, 
                Quantity : purchase.products[i].Quantity, 
                Discount : purchase.products[i].Discount ?? 0
            })

            const resNewProduct = await purchaseProductObj.addOne(productNew)

            if(!resNewProduct) {
                return res.status(500).json({status : 500, msg: "Hubo un error al agregar un producto"})
            }

            const productoOld = await productObj.getByFolio(productNew.ProductFolio);

            const sqlUpdateStock = `
                UPDATE Product 
                SET 
                    StockOnWay = ${+productoOld.StockOnWay + +productNew.Quantity}
                WHERE Folio = '${productNew.ProductFolio}'
            `

            const responseProduct = await productObj.exectQuery(sqlUpdateStock);

            if(!responseProduct) {
                return res.status(500).json({status : 500, msg: "Hubo un error al actualizar los productos"})
            }
        } else {
            const QuantityNew = purchase.products[i].Quantity
            const DiscountNew = purchase.products[i].Discount
            if(QuantityNew !== product[0].Quantity || DiscountNew !== product[0].Discount) {
                const purchaseProduct = new PurchaseProduct(purchase.products[i])

                const sqlUpdatePurchaseProducto = `
                    UPDATE PurchaseProduct 
                    SET Quantity = ${QuantityNew},
                    Discount = ${DiscountNew}
                    WHERE ProductFolio = '${purchase.products[i].Folio}' AND PurchaseFolio = ${purchaseObj.Folio}
                `

                const resUpdatePurchaseProducto = purchaseProduct.exectQuery(sqlUpdatePurchaseProducto);

                if(!resUpdatePurchaseProducto) {
                    return res.status(500).json({status : 500, msg: "Hubo un error al actualizar un producto"})
                }

                const producto = await productObj.getByFolio(purchase.products[i].Folio);

                const sqlUpdateStock = `
                    UPDATE Product 
                    SET 
                        StockOnWay = ${+producto.StockOnWay + (+DiscountNew - +product[0].Discount)}
                    WHERE Folio = '${producto.Folio}'
                `

                const responseProduct = await productObj.exectQuery(sqlUpdateStock);

                if(!responseProduct) {
                    return res.status(500).json({status : 500, msg: "Hubo un error al actualizar los productos"})
                }
            }
        }
    }

    const response = await purchaseObj.updateOne(purchaseObj)

    if(response) {
        return res.status(201).json({
            status : 200, 
            msg : "Compra actualizada con exito"
        })
    } else {
        const error = new Error("Hubo un error")
        return res.status(500).json({status : 500, msg: error})
    }
}

const deletePurchase = async(req, res) => {
    const { id } = req.params;

    const purchaseObj = new Purchase();
    const productObj = new Product();
    const purchaseProductObj = new PurchaseProduct();

    const purchase = await purchaseObj.getByFolio(id);
    
    /**if(purchase.StatusID === 2) {
        return res.status(400).json({
            status : 400, 
            msg : "La compra se ha recibido, no se puede eliminar"
        })
    }*/

    const purchaseProducts = await purchaseProductObj.getByElementArray('PurchaseFolio', +id);
    for(let i=0;i<purchaseProducts.length;i++) {
        const product = await productObj.getByFolio(purchaseProducts[i].ProductFolio)

        let sqlUpdateStock = ""
        
        if(purchase.StatusID === 1) {
            sqlUpdateStock = `
                UPDATE Product 
                SET 
                    StockOnWay = ${product.StockOnWay - purchaseProducts[i].Quantity}
                WHERE Folio = '${purchaseProducts[i].ProductFolio}'
            `
        } else if (purchase.StatusID === 2) {
            sqlUpdateStock = `
                UPDATE Product 
                SET 
                    StockAvaible = ${product.StockAvaible - purchaseProducts[i].Quantity}
                WHERE Folio = '${purchaseProducts[i].ProductFolio}'
            `
        }
        

        const responseProduct = await productObj.exectQuery(sqlUpdateStock);

        if(!responseProduct) {
            return res.status(500).json({
                status : 500, 
                msg : "Hubo un error al actualizar los productos"
            })
        }
    }

    const response = await purchaseObj.updateOneColumn(id, 'Active', false)

    if(response) {
        io.emit('purchaseUpdate', { update: true });

        return res.status(200).json({  
            status : 200,
            msg : "La compra se elimino correctamente"
        })
    } else {
        return res.status(500).json({
            status : 500, 
            msg : "Hubo un error, por favor, intente más tarde"
        })
    }
}

const deletePurchaseProduct = async(req, res) => {
    const { purchaseId, productId } = req.params
    const productoObj = new Product();
    const purchaseProductObj = new PurchaseProduct();

    const sqlGetProducts = `
        SELECT * FROM PurchaseProduct 
        WHERE ProductFolio = '${productId}' AND PurchaseFolio = ${purchaseId}
    `

    const purchase = await purchaseProductObj.exectQueryInfo(sqlGetProducts);
    
    const producto = await productoObj.getByFolio(productId);
    
    const sqlUpdateStock = `
        UPDATE Product 
        SET 
            StockOnWay = ${+producto.StockOnWay - purchase[0].Quantity}
        WHERE Folio = '${producto.Folio}'
    `
    
    const responseProduct = await productoObj.exectQuery(sqlUpdateStock);
    
    if(!responseProduct) {
        return res.status(500).json({status : 500, msg: "Hubo un error al actualizar los productos"})
    }
    
    const sqlDeleteProduct = `DELETE FROM PurchaseProduct WHERE PurchaseFolio = ${purchaseId} AND ProductFolio = '${productId}'`
    const response = purchaseProductObj.exectQuery(sqlDeleteProduct);

    if(response) {
        io.emit('purchaseUpdate', { update: true });

        return res.status(200).json({
            status : 200, 
            msg: "Producto eliminado con exito"
        })
    } else {
        return res.status(500).json({status : 500, msg: "Hubo un error al eliminar el producto"})
    }
}

const changeStatus = async(req, res) => {
    const { id } = req.params;
    const { statusId } = req.body;

    const purchaseObj = new Purchase();
    const productObj = new Product();
    const purchaseProductObj = new PurchaseProduct();

    if(+statusId === 2) {
        const products = await purchaseProductObj.getByElementArray('PurchaseFolio', id);
        
        for(let i = 0; i < products.length; i++) {
            const product = await productObj.getByFolio(products[i].ProductFolio)
            
            const sqlUpdateStock = `
                UPDATE Product 
                SET 
                    StockAvaible = ${product.StockAvaible + products[i].Quantity}, 
                    StockOnWay = ${product.StockOnWay - products[i].Quantity}
                WHERE Folio = '${product.Folio}'
            `

            const res = await purchaseProductObj.exectQuery(sqlUpdateStock);

            if(!res) {
                return res.status(500).json({
                    status : 500, 
                    msg : "Ha habido un error al actualizar el producto"
                }) 
            }
        }
    }

    const response = await purchaseObj.updateOneColumn(id, "StatusID", statusId)

    const purchaseNew = await purchaseObj.getByElement('Folio', +id);

    if(response) {
        io.emit('purchaseUpdate', { update: true });

        return res.status(201).json({
            status : 200, 
            msg : "Se ha actualizado el estado de la compra"
        }) 
    } else {
        return res.status(500).json({
            status : 500, 
            msg : "Ha habido un error al actualizar la compra"
        })  
    }
}

export {
    getAllPurchase, 
    addNewPurchase, 
    updatePurchase, 
    changeStatus, 
    deletePurchase, 
    deletePurchaseProduct
}