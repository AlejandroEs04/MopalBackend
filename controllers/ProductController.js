import DetProSpe from "../models/DetProSpe.js";
import Product from "../models/Product.js"
import ProductInfo from "../models/ProductInfo.js";
import ProductSpecificationView from "../models/ProductSpecificationView.js";
import { io } from "../index.js";
import DetProAcc from "../models/DetProAcc.js";
import ProductAccessoryView from "../models/ProductAccessoryView.js";
import { emitWarning } from "process";

const getAllProduct = async(req, res) => {
    const productObj = new ProductInfo();
    const accesoriesObj = new ProductAccessoryView();

    const products = await productObj.getAll();
    const allAccesories = await accesoriesObj.getAll()

    if(products) {
        for(let i = 0; i < products.length; i++) {
            products[i].accessories = allAccesories.filter(accesory => accesory.ProductFolio === products[i].Folio)
        } 

        return res.status(200).json({
            status : 200, 
            msg : "Ok", 
            products
        })
    } else {
        const error = new Error("Hubo un error")
        return res.status(500).json({status : 500, msg: error})
    }
}

const addNewProduct = async(req, res) => {
    const { products, product } = req.body;

    if(product) {
        const productObj = new Product(product);

        const response = await productObj.addOne(productObj)
        
        if(response) {
            return res.status(200).json({
                status : 200, 
                msg: response.msg, 
                folio : product.Folio
            })
        } else {
            return res.status(500).json({status : 500, msg: "Error al agregar el producto"})
        }
    }

    if(products) {
        const productObj = new Product();

        const productsArray = [];

        for(let i=0;i<products.length;i++) {
            const product = new Product(products[i]);
            productsArray.push(product);
        }

        const response = await productObj.addMany(productsArray);
        if(response) {
            return res.status(200).json({
                status : 200, 
                msg: "Se agregaron los productos correctamente", 
            })
        } else {
            return res.status(500).json({status : 500, msg: "Error al agregar el producto"})
        }
    }   
}

const addProductInfo = async(req, res) => {
    const { 
        specifications, 
        certifications, 
        imageHeaderURL, 
        imageIconURL,
        accesories, 
        folio,
    } = req.body;

    if(specifications.length > 0) {
        const speObj = new DetProSpe()

        const speArray = specifications.map(specification => {
            return new DetProSpe(specification)
        })

        const response = await speObj.addMany(speArray);

        if(!response) {
            const error = new Error("Hubo un error")
            return res.status(500).json({status : 500, msg: error})
        }
    }

    if(imageHeaderURL !== "") {
        const productObj = new Product();

        const response = await productObj.updateOneColumn(folio, 'ImageHeaderURL', imageHeaderURL)

        if(!response) {
            const error = new Error("Hubo un error")
            return res.status(500).json({status : 500, msg: error})
        }
    }

    if(imageIconURL !== "") {
        const productObj = new Product();

        const response = await productObj.updateOneColumn(folio, 'ImageIconURL', imageIconURL)

        if(!response) {
            const error = new Error("Hubo un error")
            return res.status(500).json({status : 500, msg: error})
        }
    }

    

    return res.status(200).json({msg: "Información actualizada correctamente"})
}

const updateProduct = async(req, res) => {
    const { product } = req.body;

    const productObj = new Product(product)
    
    const response = await productObj.updateOne(productObj);

    console.log(productObj)

    if(response) {
        return res.status(200).json({
            status : 200, 
            msg: "Se actualizo el producto correctamente", 
        })
    } else {
        return res.status(500).json({status : 500, msg: "Error al actualizar el producto"})
    }
}

const deleteProduct = async(req, res) => {
    const { folio } = req.params;
    const productObj = new Product();

    const response = await productObj.updateOneColumn(folio, 'Active', false)

    if(response) {
        return res.status(200).json({msg: "Producto desactivado correctamente"})
    } else {
        const error = new Error("Hubo un error")
        return res.status(500).json({status : 500, msg: error})
    }
}

const activateProduct = async(req, res) => {
    const { folio } = req.params;
    const productObj = new Product();

    const response = await productObj.updateOneColumn(folio, 'Active', 1)

    if(response) {
        io.emit('productsUpdate')

        return res.status(200).json({msg: "Producto activado correctamente"})
    } else {
        const error = new Error("Hubo un error")
        return res.status(500).json({status : 500, msg: error})
    }
}

const addProductAccesory = async(req, res) => {
    let { accesories } = req.body
    const DetProAccObj = new DetProAcc();

    for(let i=0;i<accesories.length;i++) {
        accesories[i] = new DetProAcc(accesories[i])
    }

    const response = await DetProAccObj.addMany(accesories);

    if(response) {
        return res.status(201).json({
            status : 201,
            msg : "Accesorio agregado correctamente"
        })
    } else {
        return res.status(500).json({
            status : 500, 
            msg : "Hubo un error, por favor intentelo mas tarde"
        })
    }
}

export {
    getAllProduct, 
    addNewProduct, 
    updateProduct, 
    deleteProduct, 
    addProductInfo, 
    activateProduct, 
    addProductAccesory
}