const Debt2Model = require("../models/debt2.model")
const { getCache, setCache, deleteCache } = require('../helpers/redis.helper')


exports.createDebt2 = async (req, res) => {
    try {
        const newDebt2 = await Debt2Model.create(req.body)
        await deleteCache(`debt2`)
        return res.status(201).json({
            success: true,
            message: "debt2 created",
            debt2: newDebt2
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getDebt2s = async (req, res) => {
    try {
        const cashe = await getCache(`debt2`)
        if (cashe) {
            return res.status(200).json({
                success: true,
                message: "list of debt2s",
                debt2s: cashe
            })
        }
        const debt2s = await Debt2Model.find({}).populate("sellerId")
        await setCache(`debt2`,debt2s)
        return res.status(200).json({
            success: true,
            message: "list of debt2s",
            debt2s
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getDebt2ById = async (req, res) => {
    try {
        const debt2 = await Debt2Model.findById(req.params.id).populate("sellerId")
        if (!debt2) {
            return res.status(404).json({
                success: false,
                message: "debt2 is not found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "details of debt2",
            debt2
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


exports.updateDebt2ById = async (req, res) => {
    try {
        const debt2 = await Debt2Model.findByIdAndUpdate(req.params.id, { ...req.body, updateAt: new Date() }, { new: true })
        if (!debt2) {
            return res.status(404).json({
                success: false,
                message: "debt2 is not found"
            })
        }
        await deleteCache(`debt2`)
        return res.status(200).json({
            success: true,
            message: "debt2 updated",
            debt2
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



exports.deleteDebt2ById = async (req, res) => {
    try {
        const debt2 = await Debt2Model.findByIdAndDelete(req.params.id)
        if (!debt2) {
            return res.status(404).json({
                success: false,
                message: "debt2 is not found"
            })
        }
        await deleteCache(`debt2`)
        return res.status(200).json({
            success: true,
            message: "debt2 deleted",
            debt2
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}