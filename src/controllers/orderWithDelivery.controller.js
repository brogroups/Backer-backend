const OrderWithDeliveryModel = require("../models/orderWithDelivery.model")
const { getCache, setCache, deleteCache } = require('../helpers/redis.helper')


exports.createOrderWithDelivery = async (req, res) => {
    try {
        const { typeOfBreadIds, quantity, description, sellerId, time } = req.body
        const newOrderWithDelivery = await OrderWithDeliveryModel.create({
            typeOfBreadIds,
            quantity,
            description,
            sellerId,
            time: time ? time : new Date()
        })
        await deleteCache(`orderWithDelivery`)
        return res.status(201).json({
            success: true,
            message: "order with delivery created",
            orderWithDelivery: newOrderWithDelivery
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getOrderWithDeliveries = async (req, res) => {
    try {
        const cache = await getCache(`orderWithDelivery`)
        if (cache) {
            return res.status(200).json({
                success: true,
                message: "list of order with delivereis",
                orderWithDeliveries: cache
            })
        }
        let orderWithDeliveries = await OrderWithDeliveryModel.find({}).populate("typeOfBreadIds sellerId")
        orderWithDeliveries = orderWithDeliveries.map((item) => {
            return { ...item._doc, price: item.typeOfBreadIds.reduce((a, b) => a + b.price, 0) * item.quantity }
        })
        await setCache(`orderWithDelivery`, orderWithDeliveries)
        return res.status(200).json({
            success: true,
            message: "list of order with delivereis",
            orderWithDeliveries
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getOrderWithDeliveryById = async (req, res) => {
    try {
        const orderWithDelivery = await OrderWithDeliveryModel.findById(req.params.id).populate("typeOfBreadIds sellerId")
        if (!orderWithDelivery) {
            return res.status(404).json({
                success: false,
                message: "order with delivery not found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "details of order with delivery",
            orderWithDelivery: { ...orderWithDelivery._doc, price: orderWithDelivery.typeOfBreadIds.reduce((a, b) => a + b.price, 0) * orderWithDelivery.quantity }
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.updateOrderWithDelivery = async (req, res) => {
    try {
        const { typeOfBreadIds, quantity, description, sellerBreadId, time } = req.body
        const orderWithDelivery = await OrderWithDeliveryModel.findByIdAndUpdate(req.params.id, { typeOfBreadIds, quantity, description, sellerBreadId, time: time ? time : new Date(), updateAt: new Date() }).populate("typeOfBreadIds sellerId")
        if (!orderWithDelivery) {
            return res.status(404).json({
                success: false,
                message: "order with delivery not found"
            })
        }
        await deleteCache(`orderWithDelivery`)
        return res.status(200).json({
            success: true,
            message: "order with delivery updated",
            orderWithDelivery
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


exports.deleteOrderWithDelivery = async (req, res) => {
    try {
        const orderWithDelivery = await OrderWithDeliveryModel.findByIdAndDelete(req.params.id)
        if (!orderWithDelivery) {
            return res.status(404).json({
                success: false,
                message: "order with delivery not found"
            })
        }
        await deleteCache(`orderWithDelivery`)
        return res.status(200).json({
            success: true,
            message: "order with delivery deleted",
            orderWithDelivery
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}