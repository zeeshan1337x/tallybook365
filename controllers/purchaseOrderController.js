const BadRequestError = require("../errors/bad-request")
const NotFoundError = require("../errors/not-found")
const PurchaseOrder = require("../models/purchaseOrderModel")
const Quote = require('../models/quoteModel')

async function createPurchaseOrder(req, res) {
  const {
    user_id,
    quote_id,
    mother_company,
    client_id,
    client_name,
    client_address,
    title,
    job_no,
    date,
    items,
    vat,
    asf,
    t_and_c,
    bank_account,
    bank_name_address,
    swift,
    routing_no,
    brand,
    job_type,
    grand_total,
  } = req.body

  const purchaseOrder = await PurchaseOrder.create({
    user_id,
    quote_id,
    mother_company,
    client_id,
    client_name,
    client_address,
    title,
    job_no,
    date,
    items,
    vat,
    asf,
    t_and_c,
    bank_account,
    bank_name_address,
    swift,
    routing_no,
    brand,
    job_type,
    grand_total,
  })

  if (purchaseOrder) {
    console.log(purchaseOrder)
    const quote = await Quote.findOneAndUpdate({ _id: quote_id }, { $push: { purchaseOrder_id: purchaseOrder._id } }, { new: true } )
    if (quote) {
      return res.status(201).json({ msg: 'purchaseOrder successfully created', data: purchaseOrder })
    } else {
      await purchaseOrder.findOneAndDelete({ _id: purchaseOrder._id })
      throw new NotFoundError(`quote with ${quote_id} not found, so purchaseOrder is being deleted`)
    }
  } else {
    throw new BadRequestError('failed to create new purchaseOrder, try again')
  }
}

async function getAllPurchaseOrders(req, res) {
  const { user_id, role, mother_company } = req.user

  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 30
  const skip = (page - 1) * limit

  if (role === "admin") {
    const purchaseOrders = await purchaseOrder.find({ mother_company: mother_company }).sort('-date').skip(skip).limit(limit)
    if (purchaseOrders > 0) {
      return res.status(200).json(purchaseOrders)
    }
    throw new NotFoundError(`purchaseOrders not found ( role is ${role})`)
  }

  if (role === "user") {
    const purchaseOrders = await purchaseOrder.find({ user_id: user_id, mother_company: mother_company }).sort('-date').skip(skip).limit(limit)
    if (purchaseOrders > 0) {
      return res.status(200).json(purchaseOrders)
    }
    throw new NotFoundError(`purchaseOrders not found ( role is ${role})`)
  }
}

async function getPurchaseOrder(req, res) {
  const { id } = req.params
  const {mother_company} = req.user
  const purchaseOrder = await purchaseOrder.findOne({ _id: id, mother_company: mother_company })
  console.log(purchaseOrder)
  if (purchaseOrder) {
    return res.status(200).json(purchaseOrder)
  }
  throw new NotFoundError("purchaseOrder with particular id not found")
}

async function updatePurchaseOrder(req, res) {
  const { id } = req.params

  const { mother_company } = req.user

  const purchaseOrder = await purchaseOrder.findOneAndUpdate({ _id: id, mother_company: mother_company }, req.body, { new: true })

  if (purchaseOrder) {
    return res.status(200).json({ msg: "purchaseOrder successfully updated", data: purchaseOrder })
  }
  throw new BadRequestError("couldn't update purchaseOrder, sorry :(")
}

async function deletePurchaseOrder(req, res) {
  const { id } = req.params
  const { mother_company } = req.user
  const purchaseOrder = await purchaseOrder.findOneAndDelete({ _id: id, mother_company: mother_company })

  if (purchaseOrder) {
    return res.status(200).json({ msg: "purchaseOrder deleted", data: purchaseOrder })
  }
  throw new NotFoundError("purchaseOrder with particular id was not found")
}

async function getPurchaseOrderSerialNumber(req, res) {
  const { mother_company } = req.user

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0)

  const purchaseorders = await PurchaseOrder.countDocuments({ createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }, mother_company })

  const serialNumber = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${(purchaseorders + 1).toString().padStart(3, '0')}`
  res.status(200).json(serialNumber)
}

module.exports = { createPurchaseOrder, getAllPurchaseOrders, getPurchaseOrder, deletePurchaseOrder, updatePurchaseOrder, getPurchaseOrderSerialNumber }
