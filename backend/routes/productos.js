/*const express = require('express');
const router = express.Router();
const { obtenerProductos, crearProducto } = require('../controllers/productosController');

router.get('/', obtenerProductos);
router.post('/', crearProducto);

module.exports = router;
*/

    const express = require("express");
    const router = express.Router();
    const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, filtrarProductos } = require("../controllers/productosController");

    router.get("/", getProducts);
    router.get("/filtrar", filtrarProductos);
    router.get("/:id", getProductById);
    router.post("/", createProduct);
    router.put("/:id", updateProduct);
    router.delete("/:id", deleteProduct);

    module.exports = router;


