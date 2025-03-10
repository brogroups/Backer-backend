const { Schema, model } = require("mongoose");
const TypeOfBread = require("../models/typOfbread.model")
const SellerModel = require("../models/sellingBread.model")

const SellerBreadSchema = new Schema({
    typeOfBreadId: [
        {
            breadId: { type: Schema.Types.ObjectId, ref: TypeOfBread, required: true },
            quantity: { type: Number, required: true }
        }
    ],
    quantity: { type: Number, required: true },
    price: { type: Number },
    name: { type: String, required: true },
    ovenId: { type: String, required: true, unique: true },
    qopQuantity: { type: Number, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: SellerModel, required: true },
    createdAt: { type: Date, default: new Date() },
    updateAt: { type: Date, default: new Date() }
})

const SellerBreadModel = model("SellerBread", SellerBreadSchema)
module.exports = SellerBreadModel