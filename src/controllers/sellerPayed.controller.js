const sellerPayedModel = require("../models/sellerPayed.model")

exports.createSelleryPayed = async (req,res)=>{
    try{
        const sellerPayed = await sellerPayedModel.create(req.body)
        return res.status(201).json({
            success:true,
            message:"seller payed created",
            sellerPayed
        })
    }
    catch(error){
       return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

exports.getSellerPayed = async (req,res)=>{
    try{
        const sellerPayeds = await sellerPayedModel.find({}).populate("sellerId")
        return res.status(200).json({
            success:true,
            message:'list of seller payeds',
            sellerPayeds
        })
    }
    catch(error){
        return res.status(500).json({
             success:false,
             message:error.message
         })
     }
}

exports.getSellerPayedById = async (req,res)=>{
    try{
        const sellerPayed = await sellerPayedModel.findById(req.params.id).populate("sellerId")
        if(!sellerPayed){
            return res.status(404).json({
                success:false,
                message:"seller payed not found"
            })
        }
        return res.status(200).json({
            success:true,
            message:"details of seller payed",
            sellerPayed
        })
    }
    catch(error){
        return res.status(500).json({
             success:false,
             message:error.message
         })
     }
}

exports.updateSellerById = async (req,res)=>{
    try{
        const sellerPayed = await sellerPayedModel.findByIdAndUpdate(req.params.id,{...req.body,updateAt:new Date()},{new:true}).populate("sellerId")
        if(!sellerPayed){
            return res.status(404).json({
                success:false,
                message:"seller payed not found"
            })
        }
        return res.status(200).json({
            success:true,
            message:"seller payed updated",
            sellerPayed
        })
    }
    catch(error){
        return res.status(500).json({
             success:false,
             message:error.message
         })
     }
}

exports.deleteSellerPayed = async (req,res)=>{
    try{
        const sellerPayed = await sellerPayedModel.findByIdAndDelete(req.params.id)
        if(!sellerPayed){
            return res.status(404).json({
                success:false,
                message:"seller payed not found"
            })
        }
        return res.status(200).json({
            success:true,
            message:"seller payed updated",
            sellerPayed
        })
    }
    catch(error){
        return res.status(500).json({
             success:false,
             message:error.message
         })
     }
}