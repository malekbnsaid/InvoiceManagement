using System;
using System.Threading.Tasks;
using Azure;
using Azure.AI.FormRecognizer.DocumentAnalysis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Domain.Enums;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Text.RegularExpressions;

namespace InvoiceManagement.Server.Infrastructure.Services
{
    public class AzureFormRecognizerService : IOcrService
    {
        private readonly DocumentAnalysisClient _client;
        private readonly ILogger<AzureFormRecognizerService> _logger;
        private readonly string _modelId;

        public AzureFormRecognizerService(IConfiguration configuration, ILogger<AzureFormRecognizerService> logger)
        {
            var endpoint = configuration["AzureFormRecognizer:Endpoint"]
                ?? "https://testingpfe.cognitiveservices.azure.com/";
            var key = configuration["AzureFormRecognizer:Key"]
                ?? "<your-key-here>";
            _modelId = "prebuilt-invoice";  // Use the prebuilt invoice model directly

            _logger = logger;
            _logger.LogInformation("Initializing Document Intelligence with endpoint: {Endpoint} and model: {ModelId}", endpoint, _modelId);

            try
            {
                var credential = new AzureKeyCredential(key);
                _client = new DocumentAnalysisClient(new Uri(endpoint), credential);
                _logger.LogInformation("Successfully initialized Document Intelligence client");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Document Intelligence client: {Message}", ex.Message);
                throw;
            }
        }

        public async Task<OcrResult> ProcessInvoiceAsync(string filePath)
        {
            try
            {
                _logger.LogInformation("Starting to process invoice file: {FilePath}", filePath);

                if (!File.Exists(filePath))
                {
                    _logger.LogError("File not found: {FilePath}", filePath);
                    return new OcrResult
                    {
                        IsProcessed = false,
                        ErrorMessage = "File not found"
                    };
                }

                using var stream = File.OpenRead(filePath);
                var operation = await _client.AnalyzeDocumentAsync(WaitUntil.Completed, _modelId, stream);
                var result = operation.Value;

                if (result?.Documents == null || result.Documents.Count == 0)
                {
                    _logger.LogWarning("Document Intelligence returned no results");
                    return new OcrResult
                    {
                        IsProcessed = false,
                        ErrorMessage = "No results returned from Document Intelligence"
                    };
                }

                var document = result.Documents[0];
                
                // Debug logging
                _logger.LogInformation("=== Document Fields ===");
                foreach (var field in document.Fields)
                {
                    _logger.LogInformation($"Field: {field.Key}");
                    _logger.LogInformation($"  Type: {field.Value?.FieldType}");
                    _logger.LogInformation($"  Content: {field.Value?.Content}");
                    if (field.Value?.Value != null)
                    {
                        _logger.LogInformation($"  Value Type: {field.Value.Value.GetType().Name}");
                        _logger.LogInformation($"  Value: {field.Value.Value}");
                    }
                }

                var ocrResult = new OcrResult
                {
                    IsProcessed = true,
                    ConfidenceScore = document.Confidence,
                    RawText = result.Content,
                    ErrorMessage = string.Empty,
                    FieldConfidenceScores = new Dictionary<string, double>()
                };

                var extractedFields = new List<string>();

                // === Invoice Details ===
                if (document.Fields.TryGetValue("InvoiceId", out var invoiceNumberField))
                {
                    ocrResult.InvoiceNumber = invoiceNumberField.Content;
                    extractedFields.Add($"InvoiceNumber: {ocrResult.InvoiceNumber}");
                }

                if (document.Fields.TryGetValue("InvoiceDate", out var invoiceDateField))
                {
                    if (invoiceDateField.Value != null && invoiceDateField.FieldType == DocumentFieldType.Date)
                    {
                        var dateOffset = invoiceDateField.Value.AsDate();
                        ocrResult.InvoiceDate = dateOffset.DateTime;
                        extractedFields.Add($"InvoiceDate: {ocrResult.InvoiceDate}");
                    }
                }

                if (document.Fields.TryGetValue("DueDate", out var dueDateField))
                {
                    if (dueDateField.Value != null && dueDateField.FieldType == DocumentFieldType.Date)
                    {
                        var dateOffset = dueDateField.Value.AsDate();
                        ocrResult.DueDate = dateOffset.DateTime;
                        extractedFields.Add($"DueDate: {ocrResult.DueDate}");
                    }
                }

                // === Financial Information ===
                if (document.Fields.TryGetValue("SubTotal", out var subTotalField))
                {
                    _logger.LogInformation("Processing SubTotal field:");
                    _logger.LogInformation($"  FieldType: {subTotalField.FieldType}");
                    _logger.LogInformation($"  Content: {subTotalField.Content}");
                    _logger.LogInformation($"  Value: {subTotalField.Value}");

                    if (subTotalField.Value != null && subTotalField.FieldType == DocumentFieldType.Currency)
                    {
                        var currencyValue = subTotalField.Value.AsCurrency();
                        _logger.LogInformation($"  Currency Amount: {currencyValue.Amount}");
                        _logger.LogInformation($"  Currency Symbol: '{currencyValue.Symbol}'");
                        
                        ocrResult.SubTotal = Convert.ToDecimal(currencyValue.Amount);
                        var parsedCurrency = ParseCurrencyType(currencyValue.Symbol);
                        if (parsedCurrency.HasValue)
                        {
                            ocrResult.Currency = parsedCurrency.Value;
                            _logger.LogInformation($"  Parsed Currency: {ocrResult.Currency}");
                        }
                        extractedFields.Add($"SubTotal: {ocrResult.SubTotal} {ocrResult.Currency}");
                    }
                }

                // Try to get currency from any monetary field if not set yet
                if (!ocrResult.Currency.HasValue)
                {
                    _logger.LogInformation("Currency not set from SubTotal, trying other fields...");
                    foreach (var fieldKey in new[] { "InvoiceTotal", "TotalTax", "SubTotal", "AmountDue" })
                    {
                        _logger.LogInformation($"Checking {fieldKey} for currency...");
                        if (document.Fields.TryGetValue(fieldKey, out var field) && 
                            field.Value != null && 
                            field.FieldType == DocumentFieldType.Currency)
                        {
                            var currencyValue = field.Value.AsCurrency();
                            _logger.LogInformation($"Found currency field {fieldKey} with symbol: '{currencyValue.Symbol}'");
                            
                            if (!string.IsNullOrEmpty(currencyValue.Symbol))
                            {
                                var parsedCurrency = ParseCurrencyType(currencyValue.Symbol);
                                if (parsedCurrency.HasValue)
                                {
                                    ocrResult.Currency = parsedCurrency.Value;
                                    _logger.LogInformation($"Successfully set currency to {ocrResult.Currency} from {fieldKey}");
                                    break;
                                }
                            }
                            // Even if we couldn't parse the symbol, extract it from the content
                            else if (!string.IsNullOrEmpty(field.Content))
                            {
                                var symbol = ExtractCurrencySymbol(field.Content);
                                if (!string.IsNullOrEmpty(symbol))
                                {
                                    var parsedCurrency = ParseCurrencyType(symbol);
                                    if (parsedCurrency.HasValue)
                                    {
                                        ocrResult.Currency = parsedCurrency.Value;
                                        _logger.LogInformation($"Successfully set currency to {ocrResult.Currency} from {fieldKey} content: {field.Content}");
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }

                // If still no currency but we see dollar signs in the content, default to USD
                if (!ocrResult.Currency.HasValue)
                {
                    _logger.LogInformation("Checking raw content for currency symbols...");
                    if (result.Content.Contains("$"))
                    {
                        ocrResult.Currency = CurrencyType.USD;
                        _logger.LogInformation("Set currency to USD based on $ symbol in content");
                    }
                }

                _logger.LogInformation($"Final currency value: {ocrResult.Currency}");

                if (document.Fields.TryGetValue("TotalTax", out var taxField))
                {
                    if (taxField.Value != null && taxField.FieldType == DocumentFieldType.Currency)
                    {
                        var currencyValue = taxField.Value.AsCurrency();
                        ocrResult.TaxAmount = Convert.ToDecimal(currencyValue.Amount);
                        extractedFields.Add($"TaxAmount: {ocrResult.TaxAmount}");
                    }
                }

                if (document.Fields.TryGetValue("InvoiceTotal", out var totalField))
                {
                    if (totalField.Value != null && totalField.FieldType == DocumentFieldType.Currency)
                    {
                        var currencyValue = totalField.Value.AsCurrency();
                        var amount = Convert.ToDecimal(currencyValue.Amount);
                        ocrResult.TotalAmount = amount;
                        ocrResult.InvoiceValue = amount;
                        extractedFields.Add($"TotalAmount: {ocrResult.TotalAmount}");
                    }
                }

                // === Vendor Information ===
                if (document.Fields.TryGetValue("VendorName", out var vendorNameField))
                {
                    ocrResult.VendorName = vendorNameField.Content;
                    extractedFields.Add($"VendorName: {ocrResult.VendorName}");
                }

                if (document.Fields.TryGetValue("VendorAddress", out var vendorAddressField))
                {
                    ocrResult.VendorAddress = vendorAddressField.Content;
                    extractedFields.Add($"VendorAddress: {ocrResult.VendorAddress}");
                }

                // === Customer Information ===
                if (document.Fields.TryGetValue("CustomerName", out var customerNameField))
                {
                    ocrResult.CustomerName = customerNameField.Content;
                    extractedFields.Add($"CustomerName: {ocrResult.CustomerName}");
                }

                if (document.Fields.TryGetValue("CustomerId", out var customerNumberField))
                {
                    ocrResult.CustomerNumber = customerNumberField.Content;
                    extractedFields.Add($"CustomerNumber: {ocrResult.CustomerNumber}");
                }

                if (document.Fields.TryGetValue("BillingAddress", out var billingAddressField))
                {
                    ocrResult.BillingAddress = billingAddressField.Content;
                    extractedFields.Add($"BillingAddress: {ocrResult.BillingAddress}");
                }

                if (document.Fields.TryGetValue("ShippingAddress", out var shippingAddressField))
                {
                    ocrResult.ShippingAddress = shippingAddressField.Content;
                    extractedFields.Add($"ShippingAddress: {ocrResult.ShippingAddress}");
                }

                // === Additional Information ===
                if (document.Fields.TryGetValue("PurchaseOrder", out var poField))
                {
                    ocrResult.PurchaseOrderNumber = poField.Content;
                    extractedFields.Add($"PurchaseOrderNumber: {ocrResult.PurchaseOrderNumber}");
                }

                // === Field Confidence Scores ===
                foreach (var field in document.Fields)
                {
                    ocrResult.FieldConfidenceScores[field.Key] = field.Value?.Confidence ?? 0.0;
                }

                if (!string.IsNullOrEmpty(ocrResult.InvoiceNumber))
                {
                    _logger.LogInformation("Successfully processed invoice with number: {InvoiceNumber}. Extracted fields: {Fields}",
                        ocrResult.InvoiceNumber, string.Join(", ", extractedFields));
                }
                else
                {
                    ocrResult.IsProcessed = false;
                    ocrResult.ErrorMessage = "Failed to extract invoice number";
                    _logger.LogWarning("Failed to extract invoice number from document");
                }

                return ocrResult;
            }
            catch (RequestFailedException ex)
            {
                _logger.LogError(ex, "Azure Document Intelligence API error: {ErrorCode} - {Message}", ex.ErrorCode, ex.Message);
                return new OcrResult { IsProcessed = false, ErrorMessage = $"Azure API error: {ex.Message}" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing document: {Message}", ex.Message);
                return new OcrResult { IsProcessed = false, ErrorMessage = $"Error processing document: {ex.Message}" };
            }
        }

        private string ExtractCurrencySymbol(string content)
        {
            if (string.IsNullOrEmpty(content)) return null;

            // Common currency symbols
            if (content.Contains("$")) return "$";
            if (content.Contains("€")) return "€";
            if (content.Contains("£")) return "£";
            if (content.Contains("¥")) return "¥";

            // Currency codes
            if (content.Contains("USD")) return "USD";
            if (content.Contains("EUR")) return "EUR";
            if (content.Contains("GBP")) return "GBP";
            if (content.Contains("JPY")) return "JPY";

            return null;
        }

        private CurrencyType? ParseCurrencyType(string symbol)
        {
            _logger.LogInformation($"Parsing currency symbol: '{symbol}'");
            
            if (string.IsNullOrEmpty(symbol))
            {
                _logger.LogInformation("Currency symbol is null or empty");
                return null;
            }

            var cleanSymbol = symbol.Trim().ToUpperInvariant();
            _logger.LogInformation($"Cleaned currency symbol: '{cleanSymbol}'");

            CurrencyType? result = cleanSymbol switch
            {
                "$" or "USD" => CurrencyType.USD,
                "€" or "EUR" => CurrencyType.EUR,
                "£" or "GBP" => CurrencyType.GBP,
                "¥" or "JPY" => CurrencyType.JPY,
                "AED" => CurrencyType.AED,
                "SAR" => CurrencyType.SAR,
                "KWD" => CurrencyType.KWD,
                "BHD" => CurrencyType.BHD,
                "OMR" => CurrencyType.OMR,
                "QAR" => CurrencyType.QAR,
                _ => null
            };

            _logger.LogInformation($"Parsed currency result: {result}");
            return result;
        }

        public async Task<bool> ValidateInvoiceFormatAsync(string filePath)
        {
            try
            {
                using var stream = File.OpenRead(filePath);
                var operation = await _client.AnalyzeDocumentAsync(WaitUntil.Completed, _modelId, stream);
                var result = operation.Value;
                return result?.Documents != null && result.Documents.Any();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating document format");
                return false;
            }
        }

        public async Task<double> GetConfidenceScoreAsync(string filePath)
        {
            try
            {
                using var stream = File.OpenRead(filePath);
                var operation = await _client.AnalyzeDocumentAsync(WaitUntil.Completed, _modelId, stream);
                var result = operation.Value;
                return result?.Documents.FirstOrDefault()?.Confidence ?? 0.0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting confidence score");
                return 0;
            }
        }

        public Task TrainModelAsync(string trainingDataPath)
        {
            throw new NotImplementedException("Model training is handled through the Azure Portal or Document Intelligence Studio");
        }
    }
}
