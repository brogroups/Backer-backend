const SellerBreadModel = require("../models/sellerBread.model")
const { getCache, setCache, deleteCache } = require("../helpers/redis.helper")


exports.createSellerBread = async (req, res) => {
    try {
        const { typeOfBreadId, quantity, time,name,ovenId } = req.body
        const sellerBread = await SellerBreadModel.create({
            typeOfBreadId,
            time: time ? time : new Date(),
            quantity,
            name,
            ovenId
        })
        await deleteCache(`sellerBread`)
        return res.status(201).json({
            success: true,
            message: "seller bread yaratildi",
            sellerBread
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getSellerBread = async (req, res) => {
    try {
        const cache = await getCache(`sellerBread`)
        if (cache) {
            return res.status(200).json({
                success: true,
                message: "list of seller breads",
                sellerBreads: cache
            })
        }
        const sellerBreads = await SellerBreadModel.find({}).populate("typeOfBreadId")
        await setCache(`sellerBread`,sellerBreads)
        return res.status(200).json({
            success: true,
            message: "list of seller breads",
            sellerBreads
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getSellerById = async (req, res) => {
    try {
        const sellerBread = await SellerBreadModel.findById(req.params.id).populate("typeOfBreadId")
        if (!sellerBread) {
            return res.status(404).json({
                success: false,
                message: "seller bread not found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "details of seller bread",
            sellerBread
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.updateSellerById = async (req, res) => {
    try {
        const { typeOfBreadId, quantity, time } = req.body
        const sellerBread = await SellerBreadModel.findByIdAndUpdate(req.params.id, { typeOfBreadId, quantity, time, updateAt: new Date() }, { new: true }).populate("typeOfBreadId")
        if (!sellerBread) {
            return res.status(404).json({
                success: false,
                message: "seller bread not found"
            })
        }
        await deleteCache(`sellerBread`)
        return res.status(200).json({
            success: true,
            message: "seller bread updated",
            sellerBread
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.deleteSellerById = async (req, res) => {
    try {
        const sellerBread = await SellerBreadModel.findByIdAndDelete(req.params.id).populate("typeOfBreadId")
        if (!sellerBread) {
            return res.status(404).json({
                success: false,
                message: "seller bread not found"
            })
        }
        await deleteCache(`sellerBread`)
        return res.status(200).json({
            success: true,
            message: "seller bread deleted",
            sellerBread
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}