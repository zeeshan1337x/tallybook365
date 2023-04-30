const BadRequestError = require('../errors/bad-request')
const NotFoundError = require('../errors/not-found')
const Company = require('../models/companyModel')
const Invoice = require('../models/invoiceModel')
const Quote = require('../models/quoteModel')

async function createCompany(req, res) {
  const { mother_company, company_remaining_amount, mother_company_logo, mother_company_image, mother_company_default_bank_account, mother_company_default_bank_name_address, mother_company_default_routing_no, mother_company_default_bank_routing_no} = req.body

  const company = await Company.create({
    mother_company,
    company_remaining_amount,
    mother_company_logo,
    mother_company_image,
    mother_company_default_bank_account,
    mother_company_default_bank_name_address,
    mother_company_default_routing_no,
    mother_company_default_bank_routing_no,
  })

  if (company) {
    console.log(company)
    return res.status(201).json({ msg: 'company successfully inserted', data: company })
  } else {
    throw new BadRequestError('failed to create new company, try again')
  }

}

async function getQuoteInvoiceSixMonthTotal(req, res) {
  
  const getMonthYearString = (date) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
  }

  const fetchMonthlyDues = async (startOfMonth, endOfMonth) => {
    const aggregationPipeline = [
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalDue: { $sum: '$grand_total' },
        },
      },
    ]

    const quoteResult = await Quote.aggregate(aggregationPipeline).exec()
    const invoiceResult = await Invoice.aggregate(aggregationPipeline).exec()

    const totalQuoteDues = quoteResult.length ? quoteResult[0].totalDue : 0
    const totalInvoiceDues = invoiceResult.length ? invoiceResult[0].totalDue : 0

    return { totalQuoteDues, totalInvoiceDues }
  }

  const getLastSixMonthsDues = async () => {
  const currentDate = new Date();
  const results = [];

  for (let i = 6; i > 0; i--) {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
    const monthYearString = getMonthYearString(startOfMonth);

    const { totalQuoteDues, totalInvoiceDues } = await fetchMonthlyDues(startOfMonth, endOfMonth);
    results.push(`${monthYearString} - Total quoted amount - ${totalQuoteDues} - Total Invoiced amount - ${totalInvoiceDues}`);
  }

  return results;
  }
  
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const currentMonthDues = await fetchMonthlyDues(startOfMonth, endOfMonth);
    const runningMonthQuoteTotal = `Current running month (${getMonthYearString(startOfMonth)}) total quoted amount is: ${currentMonthDues.totalQuoteDues}`;
    const runningMonthInvoiceTotal = `Current running month (${getMonthYearString(startOfMonth)}) total invoiced amount is: ${currentMonthDues.totalInvoiceDues}`;

    const lastSixMonthsDues = await getLastSixMonthsDues();
    // lastSixMonthsDues.forEach((result) => console.log(result));

    res.status(200).json({runningMonthQuoteTotal, runningMonthInvoiceTotal, lastSixMonthsDues})
  } catch (error) {
    console.error('Error fetching dues:', error);
  }
};

module.exports = { createCompany, getQuoteInvoiceSixMonthTotal}