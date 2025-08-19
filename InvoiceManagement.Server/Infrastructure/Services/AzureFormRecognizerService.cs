using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using Azure;
using Azure.AI.FormRecognizer.DocumentAnalysis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Application.Services.OCR;
using InvoiceManagement.Server.Domain.Enums;
using System.Linq;
using System.Text.RegularExpressions;

namespace InvoiceManagement.Server.Infrastructure.Services.OCR
{
    public class AzureFormRecognizerService : IOcrService
    {
        private readonly DocumentAnalysisClient _client;
        private readonly ILogger<AzureFormRecognizerService> _logger;
        private readonly OcrProcessingPipeline _pipeline;
        private readonly LineItemExtractionService _lineItemExtractor;
        private readonly string _modelId;
        private readonly string[] _addressPatterns = new[]
        {
            @"^\d+\s+[\w\s,'-]+$", // Street address
            @"^(?:Suite|Ste|Unit|Apt|Floor|Fl)\s+[\w-]+", // Suite/Unit
            @"^[\w\s,'-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?$", // City, State ZIP
            @"^[\w\s,'-]+\s+\d{5}(?:-\d{4})?$", // City ZIP
            @"^[A-Z]{2}\s+\d{5}(?:-\d{4})?$", // State ZIP
            @"^(?:P\.?O\.?\s+Box\s+\d+)" // PO Box
        };

        public AzureFormRecognizerService(
            IConfiguration configuration,
            ILogger<AzureFormRecognizerService> logger,
            OcrProcessingPipeline pipeline,
            LineItemExtractionService lineItemExtractor)
        {
            _logger = logger;
            _pipeline = pipeline;
            _lineItemExtractor = lineItemExtractor;

            var endpoint = configuration["Azure:FormRecognizer:Endpoint"] 
                ?? throw new ArgumentNullException(nameof(configuration), "Azure Form Recognizer endpoint is not configured");
            var key = configuration["Azure:FormRecognizer:Key"]
                ?? throw new ArgumentNullException(nameof(configuration), "Azure Form Recognizer key is not configured");
            _modelId = configuration["Azure:FormRecognizer:ModelId"] ?? "prebuilt-invoice";

            _logger.LogInformation("Initializing Azure Form Recognizer with endpoint: {Endpoint}", endpoint);
            _client = new DocumentAnalysisClient(new Uri(endpoint), new AzureKeyCredential(key));
        }

        public async Task<OcrResult> ProcessInvoiceAsync(string filePath)
        {
            try
            {
                _logger.LogInformation("Processing invoice from file: {FilePath}", filePath);

                using var stream = new FileStream(filePath, FileMode.Open);
                var operation = await _client.AnalyzeDocumentAsync(WaitUntil.Completed, _modelId, stream);
                var result = operation.Value;

                if (result.Documents.Count == 0)
                {
                    _logger.LogWarning("No documents found in the analysis result");
                    return new OcrResult
                    {
                        IsProcessed = false,
                        ErrorMessage = "No documents found in the analysis result"
                    };
                }

                var document = result.Documents[0];
                var rawResult = await ExtractRawDataAsync(document, result);
                var processedResult = _pipeline.Process(rawResult);
                return processedResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing invoice");
                throw;
            }
        }

        private Task<OcrResult> ExtractRawDataAsync(AnalyzedDocument document, AnalyzeResult result)
        {
            _logger.LogInformation("Starting raw data extraction");
            
                var ocrResult = new OcrResult
                {
                    IsProcessed = true,
                    ConfidenceScore = document.Confidence,
                    RawText = result.Content,
                    FieldConfidenceScores = new Dictionary<string, double>()
                };

                var extractedFields = new List<string>();

            try
            {
                // === Invoice Details ===
                _logger.LogInformation("Extracting invoice details...");

                // Invoice Number - Try Azure's fields first
                if (document.Fields.TryGetValue("InvoiceId", out var invoiceNumberField))
                {
                    ocrResult.InvoiceNumber = invoiceNumberField.Content;
                    extractedFields.Add($"InvoiceNumber (Azure): {ocrResult.InvoiceNumber}");
                }
                else if (document.Fields.TryGetValue("InvoiceNumber", out invoiceNumberField))
                {
                    ocrResult.InvoiceNumber = invoiceNumberField.Content;
                    extractedFields.Add($"InvoiceNumber (Azure): {ocrResult.InvoiceNumber}");
                }

                // Invoice Date
                if (document.Fields.TryGetValue("InvoiceDate", out var invoiceDateField) && 
                    invoiceDateField.Value != null && 
                    invoiceDateField.FieldType == DocumentFieldType.Date)
                {
                    ocrResult.InvoiceDate = invoiceDateField.Value.AsDate().DateTime;
                    extractedFields.Add($"InvoiceDate (Azure): {ocrResult.InvoiceDate}");
                }

                // Due Date
                if (document.Fields.TryGetValue("DueDate", out var dueDateField) && 
                    dueDateField.Value != null && 
                    dueDateField.FieldType == DocumentFieldType.Date)
                {
                    ocrResult.DueDate = dueDateField.Value.AsDate().DateTime;
                    extractedFields.Add($"DueDate (Azure): {ocrResult.DueDate}");
                }

                // === Financial Information ===
                _logger.LogInformation("Extracting financial information...");

                // SubTotal
                if (document.Fields.TryGetValue("SubTotal", out var subTotalField) && 
                    subTotalField.Value != null && 
                    subTotalField.FieldType == DocumentFieldType.Currency)
                {
                    var currencyValue = subTotalField.Value.AsCurrency();
                    ocrResult.SubTotal = Convert.ToDecimal(currencyValue.Amount);
                    extractedFields.Add($"SubTotal (Azure): {ocrResult.SubTotal}");

                    // Get currency from first valid amount field
                    if (!ocrResult.Currency.HasValue)
                    {
                        var parsedCurrency = ParseCurrencyType(currencyValue.Symbol);
                        if (parsedCurrency.HasValue)
                        {
                            ocrResult.Currency = parsedCurrency.Value;
                            _logger.LogInformation("Set currency to {Currency} from SubTotal", parsedCurrency.Value);
                        }
                    }
                }

                // Tax Amount
                if (document.Fields.TryGetValue("TotalTax", out var taxField) && 
                    taxField.Value != null && 
                    taxField.FieldType == DocumentFieldType.Currency)
                {
                    var currencyValue = taxField.Value.AsCurrency();
                    ocrResult.TaxAmount = Convert.ToDecimal(currencyValue.Amount);
                    extractedFields.Add($"TaxAmount (Azure): {ocrResult.TaxAmount}");
                }

                // Total Amount
                if (document.Fields.TryGetValue("InvoiceTotal", out var totalField) && 
                    totalField.Value != null && 
                    totalField.FieldType == DocumentFieldType.Currency)
                {
                    var currencyValue = totalField.Value.AsCurrency();
                    ocrResult.TotalAmount = Convert.ToDecimal(currencyValue.Amount);
                    ocrResult.InvoiceValue = ocrResult.TotalAmount;
                    extractedFields.Add($"TotalAmount (Azure): {ocrResult.TotalAmount}");
                }

                // === Vendor Information ===
                _logger.LogInformation("Extracting vendor information...");

                // Vendor Name
                if (document.Fields.TryGetValue("VendorName", out var vendorNameField))
                {
                    ocrResult.VendorName = vendorNameField.Content;
                    extractedFields.Add($"VendorName (Azure): {ocrResult.VendorName}");
                }

                // Vendor Address
                if (document.Fields.TryGetValue("VendorAddress", out var vendorAddressField))
                {
                    ocrResult.VendorAddress = vendorAddressField.Content;
                    extractedFields.Add($"VendorAddress (Azure): {ocrResult.VendorAddress}");
                }

                // === Customer Information ===
                _logger.LogInformation("Extracting customer information...");

                // Customer Name
                if (document.Fields.TryGetValue("CustomerName", out var customerNameField))
                {
                    ocrResult.CustomerName = customerNameField.Content;
                    extractedFields.Add($"CustomerName (Azure): {ocrResult.CustomerName}");
                }

                // Customer ID/Number
                if (document.Fields.TryGetValue("CustomerId", out var customerIdField))
                {
                    ocrResult.CustomerNumber = customerIdField.Content;
                    extractedFields.Add($"CustomerNumber (Azure): {ocrResult.CustomerNumber}");
                }

                // Billing Address
                if (document.Fields.TryGetValue("BillingAddress", out var billingAddressField))
                {
                    ocrResult.BillingAddress = billingAddressField.Content;
                    extractedFields.Add($"BillingAddress (Azure): {ocrResult.BillingAddress}");
                }

                // Shipping Address
                if (document.Fields.TryGetValue("ShippingAddress", out var shippingAddressField))
                {
                    ocrResult.ShippingAddress = shippingAddressField.Content;
                    extractedFields.Add($"ShippingAddress (Azure): {ocrResult.ShippingAddress}");
                }

                // === Line Items ===
                _logger.LogInformation("Extracting line items...");
                
                var lineItems = new List<InvoiceLineItemDto>();
                
                // First, try Azure's built-in line item extraction
                if (document.Fields.TryGetValue("Items", out var itemsField) &&
                    itemsField.Value != null && 
                    itemsField.FieldType == DocumentFieldType.List)
                {
                    var itemsList = itemsField.Value as IList<DocumentField>;

                    if (itemsList != null)
                    {
                        foreach (var item in itemsList)
                        {
                            try
                            {
                                if (item.FieldType == DocumentFieldType.Dictionary)
                                {
                                    var itemDict = item.Value as IDictionary<string, DocumentField>;
                                    if (itemDict != null)
                                    {
                                        var lineItem = new InvoiceLineItemDto();

                                        // Description
                                        if (itemDict.TryGetValue("Description", out var descField))
                                        {
                                            lineItem.Description = descField.Content;
                                        }

                                        // Quantity
                                        if (itemDict.TryGetValue("Quantity", out var qtyField) && 
                                            qtyField.Value != null &&
                                            qtyField.FieldType == DocumentFieldType.Double)
                                        {
                                            lineItem.Quantity = Convert.ToDecimal(qtyField.Value.AsDouble());
                                        }

                                        // Unit Price
                                        if (itemDict.TryGetValue("UnitPrice", out var priceField) && 
                                            priceField.Value != null &&
                                            priceField.FieldType == DocumentFieldType.Currency)
                                        {
                                            var currencyValue = priceField.Value.AsCurrency();
                                            lineItem.UnitPrice = Convert.ToDecimal(currencyValue.Amount);
                                        }

                                        // Amount
                                        if (itemDict.TryGetValue("Amount", out var amountField) && 
                                            amountField.Value != null &&
                                            amountField.FieldType == DocumentFieldType.Currency)
                                        {
                                            var currencyValue = amountField.Value.AsCurrency();
                                            lineItem.Amount = Convert.ToDecimal(currencyValue.Amount);
                                        }

                                        // Item Number
                                        if (itemDict.TryGetValue("ItemNumber", out var itemNumberField))
                                        {
                                            lineItem.ItemNumber = itemNumberField.Content;
                                        }

                                        // Unit
                                        if (itemDict.TryGetValue("Unit", out var unitField))
                                        {
                                            lineItem.Unit = unitField.Content;
                                        }

                                        // Tax Amount
                                        if (itemDict.TryGetValue("TaxAmount", out var taxAmountField) && 
                                            taxAmountField.Value != null &&
                                            taxAmountField.FieldType == DocumentFieldType.Currency)
                                        {
                                            var currencyValue = taxAmountField.Value.AsCurrency();
                                            lineItem.TaxAmount = Convert.ToDecimal(currencyValue.Amount);
                                        }

                                        // Tax Rate
                                        if (itemDict.TryGetValue("TaxRate", out var taxRateField) && 
                                            taxRateField.Value != null &&
                                            taxRateField.FieldType == DocumentFieldType.Double)
                                        {
                                            lineItem.TaxRate = Convert.ToDecimal(taxRateField.Value.AsDouble());
                                        }

                                        // Add to list if we have at least some data
                                        if (!string.IsNullOrEmpty(lineItem.Description) || lineItem.Amount > 0)
                                        {
                                            lineItems.Add(lineItem);
                                            _logger.LogInformation("Added Azure line item: {Description}, Qty: {Quantity}, Price: {Price}, Amount: {Amount}",
                                                lineItem.Description, lineItem.Quantity, lineItem.UnitPrice, lineItem.Amount);
                                        }
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Error processing Azure line item");
                            }
                        }
                    }
                }

                // Always use our improved text-based extraction for better accuracy
                _logger.LogInformation("Azure extracted {Count} line items, now using improved text-based extraction", lineItems.Count);
                
                // Log a sample of the raw text for debugging
                var sampleText = result.Content.Length > 500 ? result.Content.Substring(0, 500) + "..." : result.Content;
                _logger.LogInformation("Raw text sample: {SampleText}", sampleText);
                
                // Clean the raw text to remove headers/footers that might interfere with line item extraction
                var cleanedContent = CleanRawTextForLineItemExtraction(result.Content);
                var textLineItems = _lineItemExtractor.ExtractLineItemsFromText(cleanedContent);
                
                // If our text extraction found better items, use those instead
                if (textLineItems.Count > 0)
                {
                    // Filter out Azure items that look like headers/footers
                    var validAzureItems = lineItems.Where(item => 
                        !string.IsNullOrEmpty(item.Description) &&
                        item.Description.Length > 3 &&
                        !item.Description.Contains("Telefon") &&
                        !item.Description.Contains("Phone") &&
                        !item.Description.Contains("Fax") &&
                        !item.Description.Contains("Email") &&
                        !item.Description.Contains("Website") &&
                        !item.Description.Contains("VAT") &&
                        !item.Description.Contains("Steuernummer") &&
                        !item.Description.Contains("Invoice") &&
                        !item.Description.Contains("Customer") &&
                        !item.Description.Contains("Date") &&
                        !item.Description.Contains("Musterstr") &&
                        item.Quantity <= 1000 && // Reasonable quantity
                        item.UnitPrice <= 100000 // Reasonable price
                    ).ToList();
                    
                    // Combine valid Azure items with text-extracted items
                    lineItems = validAzureItems.Concat(textLineItems).ToList();
                    
                    _logger.LogInformation("Combined {AzureCount} valid Azure items with {TextCount} text-extracted items", 
                        validAzureItems.Count, textLineItems.Count);
                }

                // Validate line items against invoice total
                if (lineItems.Any() && ocrResult.TotalAmount.HasValue)
                {
                    var isValid = _lineItemExtractor.ValidateLineItemsAgainstTotal(lineItems, ocrResult.TotalAmount.Value);
                    if (!isValid)
                    {
                        _logger.LogWarning("Line items total does not match invoice total. Line items sum: {LineItemsSum}, Invoice total: {InvoiceTotal}",
                            lineItems.Sum(x => x.Amount), ocrResult.TotalAmount.Value);
                    }
                }

                ocrResult.LineItems = lineItems;
                _logger.LogInformation("Final extracted {Count} line items", lineItems.Count);

                // === Field Confidence Scores ===
                foreach (var field in document.Fields)
                {
                    ocrResult.FieldConfidenceScores[field.Key] = field.Value?.Confidence ?? 0.0;
                }

                // === Validation ===
                if (string.IsNullOrEmpty(ocrResult.InvoiceNumber))
                {
                    ocrResult.IsProcessed = false;
                    ocrResult.ErrorMessage = "Failed to extract invoice number";
                    _logger.LogWarning("Failed to extract invoice number from document");
                }

                // If we have no currency but see $ in content, default to USD
                if (!ocrResult.Currency.HasValue && result.Content.Contains("$"))
                {
                    ocrResult.Currency = CurrencyType.USD;
                    _logger.LogInformation("Set currency to USD based on $ symbol in content");
                }

                return Task.FromResult(ocrResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting data from document");
                throw;
            }
        }

        private CurrencyType? ParseCurrencyType(string? symbol)
        {
            if (string.IsNullOrEmpty(symbol))
                return null;

            return symbol.Trim().ToUpper() switch
            {
                "$" or "USD" => CurrencyType.USD,
                "€" or "EUR" => CurrencyType.EUR,
                "£" or "GBP" => CurrencyType.GBP,
                "¥" or "JPY" => CurrencyType.JPY,
                "د.إ" or "AED" => CurrencyType.AED,
                "ر.ق" or "QAR" => CurrencyType.QAR,
                "د.ك" or "KWD" => CurrencyType.KWD,
                "د.ب" or "BHD" => CurrencyType.BHD,
                "ر.ع" or "OMR" => CurrencyType.OMR,
                _ => null
            };
        }

        private (string name, string address, string taxId) ExtractVendorInformation(AnalyzedDocument document, string rawContent)
        {
            string vendorName = string.Empty;
            string vendorAddress = string.Empty;
            string vendorTaxId = string.Empty;
            var addressLines = new List<string>();

            // Try to get vendor name from the document fields first
            if (document.Fields.TryGetValue("VendorName", out var vendorNameField))
            {
                _logger.LogInformation("Found VendorName field: {Value}", vendorNameField.Content);
                vendorName = vendorNameField.Content;
            }
            else
            {
                // Look for company patterns at the top of the document
                var lines = rawContent.Split('\n');
                var headerSection = string.Join("\n", lines.Take(10)); // Look in first 10 lines

                // Common business entity patterns
                var companyPatterns = new[]
                {
                    @"(?<name>[\w\s&,'-]+(?:LTD|LLC|INC|CORP|CO|PLC|LLP|PC|SA|BV|GmbH|PTY|JSC|AG|NV|SE|SRL|OOO|SARL)\.?)\s*$",
                    @"(?<name>[\w\s&,'-]+)\s*(?:Limited|Corporation|Company|Incorporated|Associates)\.?\s*$",
                    @"(?<name>[\w\s&,'-]+(?:\sCompany|\sTrading|\sEnterprises|\sIndustries|\sSolutions|\sTechnologies))\.?\s*$"
                };

                foreach (var pattern in companyPatterns)
                {
                    var match = Regex.Match(headerSection, pattern, RegexOptions.IgnoreCase | RegexOptions.Multiline);
                    if (match.Success)
                    {
                        vendorName = match.Groups["name"].Value.Trim();
                        _logger.LogInformation("Found vendor name using pattern: {Pattern}, Name: {Name}", pattern, vendorName);
                        break;
                    }
                }

                // If still not found, try first non-header line
                if (string.IsNullOrEmpty(vendorName))
                {
                    foreach (var line in lines)
                    {
                        var trimmedLine = line.Trim();
                        if (!string.IsNullOrEmpty(trimmedLine) && 
                            !trimmedLine.Contains("INVOICE", StringComparison.OrdinalIgnoreCase) &&
                            !trimmedLine.Contains("DATE", StringComparison.OrdinalIgnoreCase) &&
                            trimmedLine.Length > 3)
                        {
                            vendorName = trimmedLine;
                            _logger.LogInformation("Found vendor name in header: {Value}", vendorName);
                            break;
                        }
                    }
                }
            }

            // Extract vendor address
            if (document.Fields.TryGetValue("VendorAddress", out var vendorAddressField))
            {
                _logger.LogInformation("Found VendorAddress field: {Value}", vendorAddressField.Content);
                vendorAddress = vendorAddressField.Content;
            }
            else if (!string.IsNullOrEmpty(vendorName))
            {
                // Look for address after vendor name
                var lines = rawContent.Split('\n');
                var startIndex = -1;
                
                // Find vendor name in content
                for (int i = 0; i < lines.Length; i++)
                {
                    if (lines[i].Contains(vendorName, StringComparison.OrdinalIgnoreCase))
                    {
                        startIndex = i + 1;
                        break;
                    }
                }

                if (startIndex >= 0)
                {
                    foreach (var pattern in _addressPatterns)
                    {
                        if (Regex.IsMatch(lines[startIndex], pattern))
                        {
                            addressLines.Add(lines[startIndex]);
                            break;
                        }
                    }

                    if (addressLines.Any())
                    {
                        vendorAddress = string.Join("\n", addressLines);
                        _logger.LogInformation("Extracted vendor address: {Address}", vendorAddress);
                    }
                }
            }

            // Extract Tax ID
            if (document.Fields.TryGetValue("VendorTaxId", out var taxIdField))
            {
                vendorTaxId = taxIdField.Content;
            }
            else
            {
                // Look for tax ID patterns in the content
                var taxIdPatterns = new[]
                {
                    @"(?:Tax\s+ID|VAT|GST|EIN|TIN)\s*(?:#|No|Number)?[:.]?\s*([A-Z0-9-]+)",
                    @"(?:Tax|VAT|GST|EIN|TIN)\s*(?:Registration|Reg\.?)\s*(?:#|No|Number)?[:.]?\s*([A-Z0-9-]+)"
                };

                foreach (var pattern in taxIdPatterns)
                {
                    var match = Regex.Match(rawContent, pattern, RegexOptions.IgnoreCase);
                    if (match.Success)
                    {
                        vendorTaxId = match.Groups[1].Value.Trim();
                        _logger.LogInformation("Found vendor tax ID using pattern: {Pattern}, ID: {TaxId}", pattern, vendorTaxId);
                        break;
                    }
                }
            }

            return (vendorName, vendorAddress, vendorTaxId);
        }

        private (string name, string number, string billingAddress, string shippingAddress) ExtractCustomerInformation(AnalyzedDocument document, string rawContent)
        {
            string customerName = string.Empty;
            string customerNumber = string.Empty;
            string billingAddress = string.Empty;
            string shippingAddress = string.Empty;

            // Extract customer name
            if (document.Fields.TryGetValue("CustomerName", out var customerNameField))
            {
                _logger.LogInformation("Found CustomerName field: {Value}", customerNameField.Content);
                customerName = customerNameField.Content;
            }
            else
            {
                // Look for customer name after various labels
                var customerLabels = new[]
                {
                    "CUSTOMER NAME:",
                    "BILL TO:",
                    "SOLD TO:",
                    "CLIENT:",
                    "CUSTOMER:"
                };

                var lines = rawContent.Split('\n');
                for (int i = 0; i < lines.Length; i++)
                {
                    var line = lines[i].Trim();
                    foreach (var label in customerLabels)
                    {
                        if (line.Contains(label, StringComparison.OrdinalIgnoreCase))
                        {
                            // Check if name is on the same line
                            var namePart = line.Substring(line.IndexOf(label, StringComparison.OrdinalIgnoreCase) + label.Length).Trim();
                            if (!string.IsNullOrEmpty(namePart))
                            {
                                customerName = namePart;
                            }
                            // If not, check next line
                            else if (i + 1 < lines.Length)
                            {
                                customerName = lines[i + 1].Trim();
                            }

                            if (!string.IsNullOrEmpty(customerName))
                            {
                                _logger.LogInformation("Found customer name after {Label}: {Name}", label, customerName);
                                break;
                            }
                        }
                    }
                    if (!string.IsNullOrEmpty(customerName)) break;
                }
            }

            // Extract customer number
            if (document.Fields.TryGetValue("CustomerId", out var customerIdField))
            {
                customerNumber = customerIdField.Content;
            }
            else
            {
                var customerIdPatterns = new[]
                {
                    @"(?:Customer|Client|Account)\s*(?:#|No|Number|ID)[:.]?\s*([A-Z0-9-]+)",
                    @"(?:Cust|Acct)\.?\s*(?:#|No|ID)[:.]?\s*([A-Z0-9-]+)"
                };

                foreach (var pattern in customerIdPatterns)
                {
                    var match = Regex.Match(rawContent, pattern, RegexOptions.IgnoreCase);
                    if (match.Success)
                    {
                        customerNumber = match.Groups[1].Value.Trim();
                        _logger.LogInformation("Found customer number using pattern: {Pattern}, Number: {Number}", pattern, customerNumber);
                        break;
                    }
                }
            }

            // Extract billing address
            var billingAddressLines = new List<string>();
            if (document.Fields.TryGetValue("BillingAddress", out var billingAddressField))
            {
                billingAddress = billingAddressField.Content;
            }
            else
            {
                // Look for billing address section
                var lines = rawContent.Split('\n');
                var inBillingSection = false;

                for (int i = 0; i < lines.Length; i++)
                {
                    var line = lines[i].Trim();
                    
                    if (line.Contains("BILL TO:", StringComparison.OrdinalIgnoreCase))
                    {
                        inBillingSection = true;
                        continue;
                    }
                    else if (line.Contains("SHIP TO:", StringComparison.OrdinalIgnoreCase))
                    {
                        inBillingSection = false;
                        continue;
                    }

                    if (inBillingSection)
                    {
                        foreach (var pattern in _addressPatterns)
                        {
                            if (Regex.IsMatch(line, pattern))
                            {
                                billingAddressLines.Add(line);
                                break;
                            }
                        }

                        // Stop if we've collected enough address lines or hit a boundary
                        if (billingAddressLines.Count >= 3 || 
                            (billingAddressLines.Any() && (line.Contains("INVOICE", StringComparison.OrdinalIgnoreCase) ||
                                                        line.Contains("DATE:", StringComparison.OrdinalIgnoreCase))))
                        {
                            break;
                        }
                    }
                }

                if (billingAddressLines.Any())
                {
                    billingAddress = string.Join("\n", billingAddressLines);
                    _logger.LogInformation("Extracted billing address: {Address}", billingAddress);
                }
            }

            // Extract shipping address
            var shippingAddressLines = new List<string>();
            if (document.Fields.TryGetValue("ShippingAddress", out var shippingAddressField))
            {
                shippingAddress = shippingAddressField.Content;
            }
            else
            {
                // Look for shipping address section
                var lines = rawContent.Split('\n');
                var inShippingSection = false;

                for (int i = 0; i < lines.Length; i++)
                {
                    var line = lines[i].Trim();
                    
                    if (line.Contains("SHIP TO:", StringComparison.OrdinalIgnoreCase))
                    {
                        inShippingSection = true;
                        continue;
                    }
                    else if (line.Contains("TERMS:", StringComparison.OrdinalIgnoreCase) ||
                            line.Contains("PAYMENT:", StringComparison.OrdinalIgnoreCase))
                    {
                        inShippingSection = false;
                        continue;
                    }

                    if (inShippingSection)
                    {
                        // Use the same address patterns as billing address
                        foreach (var pattern in _addressPatterns)
                        {
                            if (Regex.IsMatch(line, pattern))
                            {
                                shippingAddressLines.Add(line);
                                break;
                            }
                        }

                        // Stop if we've collected enough address lines or hit a boundary
                        if (shippingAddressLines.Count >= 3 || 
                            (shippingAddressLines.Any() && (line.Contains("INVOICE", StringComparison.OrdinalIgnoreCase) ||
                                                 line.Contains("DATE:", StringComparison.OrdinalIgnoreCase))))
                        {
                            break;
                        }
                    }
                }

                if (shippingAddressLines.Any())
                {
                    shippingAddress = string.Join("\n", shippingAddressLines);
                    _logger.LogInformation("Extracted shipping address: {Address}", shippingAddress);
                }
            }

            return (customerName, customerNumber, billingAddress, shippingAddress);
        }

        public async Task<bool> ValidateInvoiceFormatAsync(string filePath)
        {
            ArgumentNullException.ThrowIfNull(filePath, nameof(filePath));

            try
            {
                _logger.LogInformation("Validating invoice format: {FilePath}", filePath);

                if (!File.Exists(filePath))
                {
                    _logger.LogWarning("File does not exist: {FilePath}", filePath);
                    return false;
                }

                // Basic file validation
                using var stream = new FileStream(filePath, FileMode.Open);
                var operation = await _client.AnalyzeDocumentAsync(WaitUntil.Completed, _modelId, stream);
                var result = operation.Value;

                // Check if the document contains essential invoice fields
                var essentialFields = new[] { "InvoiceId", "InvoiceDate", "InvoiceTotal", "VendorName" };
                var hasEssentialFields = result.Documents.Count > 0 && 
                    essentialFields.Any(field => result.Documents[0].Fields.ContainsKey(field));

                if (!hasEssentialFields)
                {
                    _logger.LogWarning("Document is missing essential invoice fields");
                    return false;
                }

                _logger.LogInformation("Invoice format validation successful");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating invoice format");
                return false;
            }
        }

        public async Task<double> GetConfidenceScoreAsync(string filePath)
        {
            ArgumentNullException.ThrowIfNull(filePath, nameof(filePath));

            try
            {
                _logger.LogInformation("Getting confidence score for: {FilePath}", filePath);

                using var stream = new FileStream(filePath, FileMode.Open);
                var operation = await _client.AnalyzeDocumentAsync(WaitUntil.Completed, _modelId, stream);
                var result = operation.Value;

                if (result.Documents.Count == 0)
                {
                    _logger.LogWarning("No documents found when getting confidence score");
                    return 0;
                }

                var confidence = result.Documents[0].Confidence;
                _logger.LogInformation("Confidence score: {Score}", confidence);
                return confidence;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting confidence score");
                return 0;
            }
        }

        public Task TrainModelAsync(string trainingDataPath)
        {
            ArgumentNullException.ThrowIfNull(trainingDataPath, nameof(trainingDataPath));
            
            _logger.LogWarning("Training is not supported for the prebuilt invoice model");
            return Task.CompletedTask;
        }

        private string CleanRawTextForLineItemExtraction(string rawText)
        {
            if (string.IsNullOrEmpty(rawText))
                return rawText;

            var lines = rawText.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var cleanedLines = new List<string>();

            // Only skip obvious header/footer lines that won't contain line items
            var skipPatterns = new[]
            {
                @"^(Telefon|Phone|Fax|Email|Website|Web)$", // Contact info only
                @"^(Musterstr|Sample|Example|Test)$", // Sample data only
                @"^(This invoice is generated automatically and will not be signed)$", // Footer only
                @"^(Terms of Payment:.*)$", // Payment terms (usually long text)
                @"^(Please credit the amount.*)$", // Bank transfer details
                @"^(Bank fees at our expense.*)$", // Bank fee notice
                @"^(The explanation of the query fee categories.*)$", // Website reference
                @"^(https?://.*)$", // URLs
            };

            foreach (var line in lines)
            {
                var trimmedLine = line.Trim();
                if (string.IsNullOrEmpty(trimmedLine))
                    continue;

                // Skip lines that match header/footer patterns (but be more conservative)
                var shouldSkip = skipPatterns.Any(pattern => 
                    Regex.IsMatch(trimmedLine, pattern, RegexOptions.IgnoreCase));
                
                if (!shouldSkip)
                {
                    cleanedLines.Add(trimmedLine);
                }
                else
                {
                    _logger.LogDebug("Skipping line: {Line}", trimmedLine);
                }
            }

            var cleanedText = string.Join("\n", cleanedLines);
            _logger.LogInformation("Cleaned raw text from {OriginalLines} to {CleanedLines} lines", 
                lines.Length, cleanedLines.Count);
            
            // Log a sample of the cleaned text for debugging
            var sampleText = cleanedText.Length > 500 ? cleanedText.Substring(0, 500) + "..." : cleanedText;
            _logger.LogInformation("Cleaned text sample: {SampleText}", sampleText);
            
            return cleanedText;
        }
    }
}