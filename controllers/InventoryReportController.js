import getDaysPerMonth from "../helpers/getDaysPerMonth.js"
import ActiveRecord from "../models/ActiveRecord.js"
import Product from "../models/Product.js"
import Sale from "../models/Sale.js"
import SaleProduct from "../models/SaleProduct.js"

const getCompleteReport = async(req, res) => {
    let salesPerPeriodo = []
    let totalProducts = []
    
    // Get database information
    const saleObj = new Sale()
    const salesProductsObj = new SaleProduct()
    const products = await new Product().getAll()
    const salesProducts = await salesProductsObj.getAll()
    const sales = await saleObj.getByElementArray('Active', 1)

    // Join products to sales
    for(let i = 0; i<sales.length; i++) {
        const products = salesProducts?.filter(product => product.SaleFolio === sales[i].Folio)
        sales[i].products = products
    }

    // Get mounts per year on database
    const periodos = await getMonthQuantity()

    if(periodos.length === 0) {
        return res.status(500).json({
            msg: "Aun no hay ventas realizadas"
        })
    } else if(periodos.length === 1) {
        return res.status(200).json({
            msg: "Aun no hay ventas suficientes"
        })
    }

    const dayLastMonth = getDaysPerMonth(periodos[periodos.length - 2]?.Mes - 1, periodos[periodos.length - 2]?.Year);

    const productsTotal = await salesProductsObj.exectQueryInfo(`
        SELECT SUM(Quantity) AS Total, ProductFolio 
        FROM SaleProduct
        INNER JOIN Sale ON Sale.Folio = SaleProduct.SaleFolio
        WHERE  Active = 1 AND 
        SaleDate BETWEEN '${periodos[0].Year + "-" + periodos[0].Mes + "-01"}' AND '${periodos[periodos.length - 2].Year + "-" + periodos[periodos.length - 2].Mes + "-" + dayLastMonth}'
        group by ProductFolio   
    `)

    for(let i = 0; i < periodos.length; i++) {
        const daysPerMonth = getDaysPerMonth(periodos[i].Mes, periodos[i].Year);

        const saleStartDDate = new Date(`${periodos[i].Year}-${periodos[i].Mes}-1`)
        const saleEndDate = new Date(`${periodos[i].Year}-${periodos[i].Mes}-${daysPerMonth}`);

        // Get sales for i period
        const salesCurrentMonth = sales.filter(sale => {
            const saleDate = new Date(sale.SaleDate);
            return saleDate >= saleStartDDate && saleDate <= saleEndDate;
        })

        let index = 0

        // Get sales per product on i period
        const totalPerPeriodo = products.map((product) => {
            let totalPerProduct = 0

            // Get total sales quantity per product in i period 
            for(let j=0; j < salesCurrentMonth.length; j++) {
                for(let k = 0; k < salesCurrentMonth[j].products.length; k++) {
                    if(product.Folio === salesCurrentMonth[j].products[k].ProductFolio) {
                        totalPerProduct = totalPerProduct + salesCurrentMonth[j].products[k].Quantity
                    }
                }
            }

            let total = 0

            const count = productsTotal.filter(productTotal => productTotal.ProductFolio === product.Folio)

            if(count.length > 0) {
                total = count[0].Total
            } else {
                total = 0
            }
            
            totalProducts[index] = {
                ProductFolio : product.Folio,
                Quantity : totalPerProduct, 
                Average : (+total / (periodos.length - 1))
            }

            index++

            return ({
                ProductFolio : product.Folio, 
                Quantity : totalPerProduct
            })
        })

        salesPerPeriodo[i] = {
            Mes : periodos[i].Mes, 
            Year : periodos[i].Year, 
            Products : totalPerPeriodo
        }
    }

    return res.status(201).json({
        totalProducts, 
        salesPerPeriodo
    })
}

const getMonthQuantity = async() => {
    const db = new ActiveRecord()
    const sqlGetMonthQuantity = `SELECT MONTH(SaleDate) AS Mes, YEAR(SaleDate) AS Year FROM Sale GROUP BY Mes, Year`
    return await db.exectQueryInfo(sqlGetMonthQuantity);
}

export {
    getCompleteReport
}