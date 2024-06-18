import express from 'express'
import { activateProduct, addNewProduct, addProductAccesory, addProductInfo, deleteProduct, getAllProduct, updateProduct } from '../controllers/ProductController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router()

router.route('/').get(getAllProduct).post(checkAuth, addNewProduct).put(checkAuth, updateProduct);
router.route('/:folio').delete(checkAuth, deleteProduct);
router.route('/:folio/accesories').post(checkAuth, addProductAccesory);
router.get('/activate/:folio', checkAuth, activateProduct);
router.route('/info').post(checkAuth, addProductInfo);

export default router;