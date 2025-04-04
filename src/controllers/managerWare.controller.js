const { default: mongoose } = require("mongoose");
const ManagerWareModel = require("../models/managerWare.model");
const SellerModel = require("../models/seller.model");

exports.getManagerWare = async (req, res) => {
    try {
        let datas = []
        let sellers = []
        switch (req.use.role) {
            case "manager": {
                sellers = await SellerModel.aggregate([{ $match: { superAdminId: new mongoose.Types.ObjectId(req.use.id), status: true } }])
                for (const key of sellers) {
                
                    datas = [...datas, ...await ManagerWareModel.aggregate([
                        { $match: { sellerId: key._id, status: true } },
                        {
                            $lookup: {
                                from: "sellers",
                                localField: "sellerId",
                                foreignField: "_id",
                                as: "manager"
                            }
                        },
                        {
                            $unwind: "$manager"
                        },
                        {
                            $lookup: {
                                from: "typeofbreads",
                                localField: "bread",
                                foreignField: "_id",
                                as: "Bread"
                            }
                        },
                        {
                            $unwind: "$Bread"
                        },
                        {
                            $project: {
                                _id: 1,
                                seller: {
                                    username: "$manager.username"
                                },
                                bread: "$Bread",
                                totalQuantity: 1,
                                totalQopQuantity: 1,
                                createdAt: 1
                            }
                        }
                    ])]
                }

                break;
            }
            case "superAdmin": {
                datas = await ManagerWareModel.aggregate([
                    { $match: { status: true } },
                    {
                        $lookup: {
                            from: "sellers",
                            localField: "sellerId",
                            foreignField: "_id",
                            as: "manager"
                        }
                    },
                    {
                        $unwind: "$manager"
                    },
                    {
                        $lookup: {
                            from: "typeofbreads",
                            localField: "bread",
                            foreignField: "_id",
                            as: "Bread"
                        }
                    },
                    {
                        $unwind: "$Bread"
                    },
                    {
                        $project: {
                            _id: 1,
                            seller: {
                                username: "$manager.username"
                            },
                            bread: "$Bread",
                            totalQuantity: 1,
                            totalQopQuantity: 1,
                        }
                    }
                ])
                break;
            }
        }

        return res.status(200).json({
            success: true,
            message: "list of warehouse",
            datas
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.deleteManagerWare = async (req, res) => {
    try {
        const managerware = await ManagerWareModel.findByIdAndUpdate(req.params.id, { status: false }, { new: true })
        if (!managerware) {
            return res.status(404).json({
                success: false,
                message: "Manager's Warehouse is not found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "manager's warehouse deleted"
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}