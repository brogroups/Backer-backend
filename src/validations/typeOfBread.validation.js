const Joi = require("joi");

const CreateTypeOfBreadSchema = Joi.object({
    title: Joi.string().required(),
    price: Joi.number().required(),
    price2: Joi.number().required(),
    price3: Joi.number().required(),
})

const UpdateTypeOfBreadSchema = Joi.object({
    title: Joi.string().required(),
    price: Joi.number().required(),
    price2: Joi.number().required(),
    price3: Joi.number().required(),
})

module.exports = { CreateTypeOfBreadSchema, UpdateTypeOfBreadSchema }