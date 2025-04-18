const { Router } = require("express")
const router = Router()

const Controller = require("../controllers/static.controller")
const Middleware = require("../middlewares")

const SuperAdminModel = require("../models/superAdmin.model")
const ManagerModel = require("../models/manager.model")
const SellerModel = require("../models/seller.model")
const DeliveryModel = require("../models/delivery.model")

router.get("/statics", Middleware.verifyToken(process.env.JWT_TOKEN_ACCESS), Middleware.isCorrectRole([SuperAdminModel, ManagerModel, SellerModel, DeliveryModel]), Controller.getStatics)

module.exports = router