const { default: mongoose } = require("mongoose")
const Debt1Model = require("../models/debt1.model")
const Debt2Model = require("../models/debt2.model")
const DeliveryDebtModel = require("../models/deliveryDebt.model")
const SellingBreadModel = require("../models/sellingBread.model")
const SellerModel = require("../models/seller.model")
const DeliveryModel = require("../models/delivery.model")
const ManagerModel = require("../models/manager.model")
const SellerBreadModel = require("../models/sellerBread.model")
const SellerPayedModel = require("../models/sellerPayed.model")
const { getSellerBread } = require("./sellerBread.controller")

exports.getStatics = async (req, res) => {
    try {
        const startDay = new Date();
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date();
        endDay.setHours(23, 59, 59, 999);

        const today = new Date();
        const dayOfWeek = today.getDay();

        const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
        const diffToSunday = 0 - dayOfWeek;

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + diffToSunday);
        endOfWeek.setHours(23, 59, 59, 999);

        switch (req.use.role) {
            case "superAdmin":
                let debt1s = await Debt1Model.find({  }).lean()
                let debt2s = await Debt2Model.find({  }).populate('omborxonaProId', "name price").lean()
                let deliveryDebt = await DeliveryDebtModel.find({  }).populate("deliveryId", 'username').lean()

                debt1s = debt1s.map((item) => {
                    return { ...item, role: "seller" }
                })

                debt2s = debt2s.map((item) => {
                    return { ...item, role: "seller" }
                })

                deliveryDebt = deliveryDebt.map((item) => {
                    return { ...item, role: "delivery" }
                })

                let deliveryPrixod = await SellingBreadModel.find({  }).populate("deliveryId", 'username').populate({
                    path: "breadId",
                    model:"SellerBread",
                    populate: {
                        path: "typeOfBreadId.breadId",
                        model: "TypeOfBread"
                    }
                }).populate("magazineId").lean()
                deliveryPrixod = deliveryPrixod.map((item) => {
                    return { ...item, price: item.breadId.typeOfBreadId.reduce((a,b)=>a+b.breadId.price2,0),
                        quantity:item.breadId.typeOfBreadId.reduce((a,b)=>a+b.quantity,0) }
                })

                const pending = []
                for (const key of deliveryPrixod) {
                    let allPrice = key?.breadId?.typeOfBreadId?.reduce((a, b) => {
                        return a + b.breadId.price
                    }, 0) * key.quantity
                    if (allPrice - key.money > 0) {
                        pending.push({ ...key })
                    }
                }

                const managers = await ManagerModel.find({})
                const mamangersStatics = []

                for (const item of managers) {
                    const sellers = await SellerModel.aggregate([
                        { $match: { superAdminId: new mongoose.Types.ObjectId(item._id) } }
                    ])

                    let debt = []
                    let managerPrixod = []
                    let managerPending = []
                    for (const seller of sellers) {
                        managerPrixod = await SellingBreadModel.aggregate([
                            {
                                $lookup: {
                                    from: "sellerbreads",
                                    localField: "breadId",
                                    foreignField: "_id",
                                    as: "breadDetails"
                                }
                            },
                            {
                                $unwind: "$breadDetails",
                            },
                            {
                                $match: {
                                    "breadDetails.sellerId": seller._id
                                }
                            },
                            {
                                $lookup:{
                                    from:"typeofbreads",
                                    localField:"breadDetails.typeOfBreadId.breadId",
                                    foreignField:"_id",
                                    as:"breadIdDetails"
                                }
                            },
                            {
                                $unwind:"$breadIdDetails"
                            },
                           {
                            $project:{
                                typeOfBreadId: {
                                    $map: {
                                        input: "$breadDetails.typeOfBreadId",
                                        as: "breadIdItem",
                                        in: {
                                            breadId: {
                                                _id: "$breadIdDetails._id",
                                                title: "$breadIdDetails.title",
                                                price: "$breadIdDetails.price",
                                                price2: "$breadIdDetails.price2",
                                                price3: "$breadIdDetails.price3",
                                                price4: "$breadIdDetails.price4",
                                                createdAt: "$breadIdDetails.createdAt",
                                            }
                                        }
                                    }
                                },
                                quantity: 1,
                                paymentMethod: 1,
                                deliveryId: 1,
                                magazineId: 1,
                                money: 1,
                                createdAt: 1
                            }
                           }
                        ])
                    }
                    debt.push(await Debt1Model.aggregate([
                        { $match: { managerId: item._id } },

                        {
                            $project: {
                                title: 1,
                                quantity: 1,
                                reason: 1,
                                price: 1,
                                createdAt: 1,
                            }
                        }
                    ]))
                    debt.push(await Debt2Model.aggregate([
                        { $match: { managerId: item._id, createdAt: { $gte: startDay, $lte: endDay } } },
                        {
                            $lookup: {
                                from: "typeofwarehouses",
                                localField: "omborxonaProId",
                                foreignField: "_id",
                                as: "omborxona"
                            }
                        },
                        {
                            $unwind: "$omborxona"
                        },

                        {
                            $project: {
                                _id: 1,
                                quantity: 1,
                                description: 1,
                                omborxonaProId: {
                                    _id: "$omborxona._id",
                                    name: "$omborxona.name",
                                    price: "$omborxona.price",
                                },

                                createdAt: 1,
                            }
                        }
                    ]))
                    for (const key of managerPrixod) {
                        let allPrice = key.typeOfBreadId.reduce((a,b)=>a+b.breadId.price2,0) * key.quantity
                        if (allPrice - key.money >= 0) {
                            managerPending.push({ ...key })
                        }
                    }
                    debt = debt.filter((item) => item.length !== 0).flat(Infinity)

                    mamangersStatics.push({
                        _id: item._id,
                        username: item.username,
                        createdAt: item.createdAt,
                        debt: { totalPrice: debt.length > 0 ? debt.reduce((a, b) => a + ((b?.price ? b?.price : b?.omborxonaProId?.price ? b.omborxonaProId?.price : 0) * b.quantity), 0) : 0, history: debt },
                        pending: {
                            totalPrice: managerPending.reduce((a,b)=>a + b.typeOfBreadId.reduce((c,d)=>c+(d.breadId.price2 * b.quantity),0),0),
                            history: managerPending
                        },
                        prixod: {
                            totalPrice: managerPrixod.reduce((a, b) => a + b.money, 0),
                            history: managerPrixod
                        }
                    })
                }
                return res.status(200).json({
                    statics: {
                        debt: {
                            totalPrice: [...debt1s, ...debt2s, ...deliveryDebt].reduce((a, b) => a + (b.price ? b.price : b?.omborxonaProId?.price ? b?.omborxonaProId?.price : 0), 0),
                            history: [...debt1s, ...debt2s, ...deliveryDebt]
                        },
                        prixod: {
                            totalPrice: deliveryPrixod.reduce((a, b) => a + b.money, 0),
                            history: deliveryPrixod
                        },
                        pending: {
                            totalPrice: pending.reduce((a, b) =>a + b.breadId.typeOfBreadId.reduce((a, b) => a + b.breadId.price, 0) * b.quantity - b.money,0),
                            history: pending
                        }
                    },
                    managerStatics: mamangersStatics.reverse()
                })
                break;
            case "manager":
                let managers2 = await ManagerModel.find({})

                let debt = []
                let managerPrixod = []
                let managerPending = []
                for (const item of managers2) {
                    const sellers = await SellerModel.aggregate([
                        { $match: { superAdminId: new mongoose.Types.ObjectId(item._id) } }
                    ])
                    debt.push(await Debt1Model.aggregate([
                        { $match: { managerId: item._id } },

                        {
                            $project: {
                                title: 1,
                                quantity: 1,
                                reason: 1,
                                price: 1,
                                createdAt: 1,
                            }
                        }
                    ]))
                    debt.push(await Debt2Model.aggregate([
                        { $match: { managerId: item._id, createdAt: { $gte: startDay, $lte: endDay } } },
                        {
                            $lookup: {
                                from: "typeofwarehouses",
                                localField: "omborxonaProId",
                                foreignField: "_id",
                                as: "omborxona"
                            }
                        },
                        {
                            $unwind: "$omborxona"
                        },

                        {
                            $project: {
                                _id: 1,
                                quantity: 1,
                                description: 1,
                                omborxonaProId: {
                                    _id: "$omborxona._id",
                                    name: "$omborxona.name",
                                    price: "$omborxona.price",
                                },

                                createdAt: 1,
                            }
                        }
                    ]))
                    for (const seller of sellers) {

                        managerPrixod = await SellingBreadModel.aggregate([
                            {
                                $lookup: {
                                    from: "sellerbreads",
                                    localField: "typeOfBreadIds.breadId",
                                    foreignField: "_id",
                                    as: "breadDetails"
                                }
                            },
                            {
                                $unwind: "$breadDetails",
                            },
                            {
                                $match: {
                                    "breadDetails.sellerId": seller._id, createdAt: { $gte: startDay, $lte: endDay }
                                }
                            },
                            {
                                $lookup: {
                                    from: "typeofbreads",
                                    localField: "breadDetails.typeOfBreadId.breadId",
                                    foreignField: "_id",
                                    as: "breadIdDetails"
                                }
                            },
                            {
                                $unwind: "$breadIdDetails",
                            },
                            {
                                $project: {
                                    _id: 1,
                                    typeOfBreadIds: {
                                        $map: {
                                            input: "$typeOfBreadIds",
                                            as: "breadItem",
                                            in: {
                                                bread: {
                                                    _id: "$breadDetails._id",
                                                    typeOfBreadId: {
                                                        $map: {
                                                            input: "$breadDetails.typeOfBreadId",
                                                            as: "breadIdItem",
                                                            in: {
                                                                breadId: {
                                                                    _id: "$breadIdDetails._id",
                                                                    title: "$breadIdDetails.title",
                                                                    price: "$breadIdDetails.price",
                                                                    price2: "$breadIdDetails.price2",
                                                                    price3: "$breadIdDetails.price3",
                                                                    price4: "$breadIdDetails.price4",
                                                                    createdAt: "$breadIdDetails.createdAt",
                                                                }
                                                            }
                                                        }
                                                    },
                                                    createdAt: "$breadDetails.createdAt",
                                                },
                                                quantity: "$$breadItem.quantity"
                                            }
                                        }
                                    },
                                    paymentMethod: 1,
                                    delivertId: 1,
                                    magazineId: 1,
                                    money: 1,
                                    createdAt: 1
                                }
                            },
                        ])
                    }
                    for (const key of managerPrixod) {
                        let allPrice = key.typeOfBreadIds.reduce((a, b) => {
                            return a + b.breadId?.typeOfBreadId.reduce((a, b) => {
                                return a + b.breadId.price
                            }, 0)
                        }, 0) * key.quantity
                        if (allPrice - key.money >= 0) {
                            managerPending.push({ ...key })
                        }
                    }
                    debt = debt.filter((item) => item.length !== 0).flat(Infinity)
                }
                return res.status(200).json({
                    statics: {
                        debt: {
                            totalPrice: debt.length > 0 ? debt.reduce((a, b) => a + ((b.price ? b.price : b.omborxonaProId.price ? b.omborxonaProId.price : 0) * b.quantity), 0) : 0,
                            history: debt
                        },
                        pending: {
                            totalPrice: managerPending.reduce((a, b) => a + (b.typeOfBreadIds.reduce((a, b) => a + b.breadId.typeOfBreadId.reduce((a, b) => a + b.breadId.price, 0), 0) * b.quantity - b.money), 0),
                            history: managerPending
                        },
                        prixod: {
                            totalPrice: managerPrixod.reduce((a, b) => a + b.money, 0),
                            history: managerPrixod
                        }
                    },
                })
                break;
            case "delivery":
                let DeliveryDebts = await DeliveryDebtModel.aggregate([
                    { $match: { deliveryId: new mongoose.Types.ObjectId(req.use.id), createdAt: { $gte: startDay, $lte: endDay } } },
                    {
                        $lookup: {
                            from: "deliveries",
                            localField: "deliveryId",
                            foreignField: "_id",
                            as: "delivery"
                        }
                    },
                    {
                        $unwind: "$delivery"
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            price: 1,
                            deliveryId: {
                                _id: "$delivery.id",
                                username: "$delivery.username",
                            },
                            description: 1,
                            createdAt: 1
                        }
                    }
                ])
                let pendingDelivery = []
                let soldBread = await SellingBreadModel.aggregate([
                    {
                        $match: { deliveryId: new mongoose.Types.ObjectId(req.use.id), createdAt: { $gte: startDay, $lte: endDay } }
                    },
                    {
                        $lookup: {
                            from: "sellerbreads",
                            localField: "breadId",
                            foreignField: "_id",
                            as: "breadDetails"
                        }
                    },
                    {
                        $unwind: "$breadDetails",
                    },

                    {
                        $lookup: {
                            from: "typeofbreads",
                            localField: "breadDetails.typeOfBreadId.breadId",
                            foreignField: "_id",
                            as: "breadIdDetails"
                        }
                    },
                    {
                        $unwind: "$breadIdDetails",
                    },
                    {
                        $lookup: {
                            from: "magazines",
                            localField: "magazineId",
                            foreignField: "_id",
                            as: "magazine"
                        }
                    },
                    {
                        $unwind: "$magazine"
                    },
                    {
                        $project: {
                            _id: 1,
                            typeOfBreadIds: {
                                $map: {
                                    input: "$breadDetails.typeOfBreadId",
                                    as: "breadIdItem",
                                    in: {
                                        breadId: {
                                            _id: "$breadIdDetails._id",
                                            title: "$breadIdDetails.title",
                                            price: "$breadIdDetails.price",
                                            price2: "$breadIdDetails.price2",
                                            price3: "$breadIdDetails.price3",
                                            price4: "$breadIdDetails.price4",
                                            createdAt: "$breadIdDetails.createdAt",
                                        },
                                        quantity: "$$breadIdItem.quantity"
                                    }
                                }
                            },
                            paymentMethod: 1,
                            delivertId: 1,
                            quantity: 1,
                            magazineId: {
                                _id: "$magazine._id",
                                title: "$magazine.title"
                            },
                            money: 1,
                            createdAt: 1
                        }
                    },
                ])
                let deliverySellingBread = await SellingBreadModel.aggregate([
                    {
                        $match: { deliveryId: new mongoose.Types.ObjectId(req.use.id), createdAt: { $gte: startDay, $lte: endDay } }
                    },
                    {
                        $lookup: {
                            from: "sellerbreads",
                            localField: "breadId",
                            foreignField: "_id",
                            as: "breadDetails"
                        }
                    },
                    {
                        $unwind: "$breadDetails",
                    },

                    {
                        $lookup: {
                            from: "typeofbreads",
                            localField: "breadDetails.typeOfBreadId.breadId",
                            foreignField: "_id",
                            as: "breadIdDetails"
                        }
                    },
                    {
                        $unwind: "$breadIdDetails",
                    },
                    {
                        $lookup: {
                            from: "magazines",
                            localField: "magazineId",
                            foreignField: "_id",
                            as: "magazine"
                        }
                    },
                    {
                        $unwind: "$magazine"
                    },
                    {
                        $project: {
                            _id: 1,
                            typeOfBreadIds: {
                                $map: {
                                    input: "$breadDetails.typeOfBreadId",
                                    as: "breadIdItem",
                                    in: {
                                        breadId: {
                                            _id: "$breadIdDetails._id",
                                            title: "$breadIdDetails.title",
                                            price: "$breadIdDetails.price",
                                            price2: "$breadIdDetails.price2",
                                            price3: "$breadIdDetails.price3",
                                            price4: "$breadIdDetails.price4",
                                            createdAt: "$breadIdDetails.createdAt",
                                        },
                                        quantity: "$$breadIdItem.quantity"
                                    }
                                }
                            },
                            paymentMethod: 1,
                            delivertId: 1,
                            quantity: 1,
                            magazineId: {
                                _id: "$magazine._id",
                                title: "$magazine.title"
                            },
                            money: 1,
                            createdAt: 1
                        }
                    },
                ])

                for (const key of deliverySellingBread) {
                    let totalPrice = key?.typeOfBreadIds.reduce((a, b) => a + b.breadId.price2, 0)
                    if (totalPrice - key.money > 0) {
                        pendingDelivery.push({ ...key })
                    }
                }

                return res.status(200).json({
                    debt: {
                        totalPrice: DeliveryDebts.reduce((a, b) => a + b.price, 0),
                        history: DeliveryDebts
                    },
                    pending: {
                        totalPrice: pendingDelivery.reduce((a, b) => a + b.typeOfBreadIds.reduce((c, d) => c + d.breadId.price2, 0), 0),
                        history: pendingDelivery
                    },
                    soldBread: {
                        totalPrice: soldBread?.reduce((a, i) => a + i.typeOfBreadIds.reduce((a, b) => a + (b.breadId.price2 * i.quantity), 0), 0),
                        history: soldBread
                    }
                })
                break;
            case "seller":
                let sellerPayeds = await SellerPayedModel.aggregate([
                    { $match: { sellerId: new mongoose.Types.ObjectId(req.use.id), } }
                ])
                sellerPayeds = sellerPayeds.reduce((a, b) => {
                    switch (b.type) {
                      case "Bonus":
                        return a + b?.price;
                        break;
                      case "Ishhaqi":
                        return a + b?.price;
                        break;
                      case "Shtraf":
                        return a - b?.price;
                        break;
                      case "Kunlik":
                        return a + b?.price;
                        break;
                      case "Avans":
                        return a - b?.price;
                        break;
                      default:
                        break;
                    }
                  }, 0);
                const sellerBreads = await getSellerBread({use:{role:"seller",id:req.use.id}},undefined)
                console.log(sellerBreads)
                  return res.status(200).json({
                    payeds: sellerPayeds,
                    sellerBreads
                  })
                  break;
                default:
                break;
        }
    }
    catch (error) {
        console.error(error)
    }
}





    // case "seller":
            //     let selerBreads = await SellerBreadModel.aggregate([
            //         {
            //             $match: { sellerId: new mongoose.Types.ObjectId(req.use.id) }
            //         },
            //         {
            //             $lookup: {
            //                 from: "typeofbreads",
            //                 localField: "typeOfBreadId.breadId",
            //                 foreignField: "_id",
            //                 as: "BREADID"
            //             }
            //         },
            //         {
            //             $unwind: "$BREADID"
            //         },
            //         {
            //             $lookup: {
            //                 from: "sellers",
            //                 localField: "sellerId",
            //                 foreignField: "_id",
            //                 as: "seller"
            //             }
            //         },
            //         {
            //             $unwind: "$seller"
            //         },
            //         {
            //             $project: {
            //                 _id: 1,
            //                 description: 1,
            //                 sellerId: {
            //                     _id: "$seller.id",
            //                     username: "$seller.username"
            //                 },
            //                 createdAt: 1,
            //                 typeOfBreadId: {
            //                     $map: {
            //                         input: "$typeOfBreadId",
            //                         as: "breadItem",
            //                         in: {
            //                             breadId: "$BREADID",
            //                             quantity: "$$breadItem.quantity",
            //                             qopQuantity: "$$breadItem.qopQuantity",
            //                         }
            //                     }
            //                 }
            //             }
            //         }
            //     ])
            //     let debt1 = await Debt1Model.aggregate([
            //         { $match: { sellerId: new mongoose.Types.ObjectId(req.use.id) } },

            //         {
            //             $project: {
            //                 title: 1,
            //                 quantity: 1,
            //                 reason: 1,
            //                 price: 1,
            //                 createdAt: 1,
            //             }
            //         }
            //     ])
            //     let debt2 = await Debt2Model.aggregate([
            //         { $match: { sellerId: new mongoose.Types.ObjectId(req.use.id), createdAt: { $gte: startDay, $lte: endDay } } },
            //         {
            //             $lookup: {
            //                 from: "typeofwarehouses",
            //                 localField: "omborxonaProId",
            //                 foreignField: "_id",
            //                 as: "omborxona"
            //             }
            //         },
            //         {
            //             $unwind: "$omborxona"
            //         },
                    
            //         {
            //             $project: {
            //                 _id: 1,
            //                 quantity: 1,
            //                 description: 1,
            //                 omborxonaProId: {
            //                     _id: "$omborxona._id",
            //                     name: "$omborxona.name",
            //                     price: "$omborxona.price",
            //                 },
                            
            //                 createdAt: 1,
            //             }
            //         }
            //     ])



            //     return res.status(200).json({
            //         prixod: {
            //             totalPrice: selerBreads.reduce((a, b) => a + b.typeOfBreadId.reduce((c, d) => c + d?.breadId.price, 0), 0),
            //             history: selerBreads
            //         },
            //         debt: {
            //             totalPrice: [...debt1, ...debt2].length > 0 ? [...debt1, ...debt2].reduce((a, b) => a + (b.price ? b.price : b.omborxonaProId.price ? b.omborxonaProId.price : 0), 0) : 0,
            //             history: [...debt1, ...debt2]
            //         },
            //         benefit: 0
            //     })
            //     break;