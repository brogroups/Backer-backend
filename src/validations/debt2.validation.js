const Joi = require("joi");

const CreateDebt2Schema = Joi.object({
    title: Joi.string().required(),
    quantity: Joi.number().required(),
    description: Joi.string().required(),
    reason: Joi.string().required(),
    sellerId: Joi.string().required()
})

const UpdateDebt2Schema = Joi.object({
    title: Joi.string().required(),
    quantity: Joi.number().required(),
    description: Joi.string().required(),
    reason: Joi.string().required(),
    sellerId: Joi.string().required()
})

module.exports = { CreateDebt2Schema, UpdateDebt2Schema }