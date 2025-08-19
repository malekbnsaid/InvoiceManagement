using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using InvoiceManagement.Server.Application.DTOs;
using InvoiceManagement.Server.Domain.Enums;
using System.Linq; // Added for Sum()

namespace InvoiceManagement.Server.Application.Services.OCR
{
    public class OcrProcessingPipeline
    {
        private readonly ILogger<OcrProcessingPipeline> _logger;
        private readonly Dictionary<string, double> _fieldWeights;
        private readonly DateExtractionService _dateExtractor;

        public OcrProcessingPipeline(
            ILogger<OcrProcessingPipeline> logger,
            DateExtractionService dateExtractor)
        {
            _logger = logger;
            _dateExtractor = dateExtractor;
            _fieldWeights = new Dictionary<string, double>
            {
                { "InvoiceNumber", 1.0 },
                { "InvoiceDate", 0.9 },
                { "DueDate", 0.8 },
                { "TotalAmount", 1.0 },
                { "SubTotal", 0.9 },
                { "TaxAmount", 0.9 },
                { "VendorName", 1.0 },
                { "VendorTaxId", 0.9 },
                { "CustomerName", 0.8 },
                { "CustomerNumber", 0.7 }
            };
        }

        public OcrResult Process(OcrResult rawResult)
        {
            try
            {
                _logger.LogInformation("Starting OCR processing pipeline for invoice {InvoiceNumber}", 
                    rawResult.InvoiceNumber);
                
                _logger.LogInformation("Raw result contains {LineItemsCount} line items", 
                    rawResult.LineItems?.Count ?? 0);

                // Apply processing steps
                var result = rawResult;
                result = PreProcessAsync(result);
                _logger.LogInformation("After PreProcess: {LineItemsCount} line items", 
                    result.LineItems?.Count ?? 0);
                    
                result = ValidateFieldsAsync(result);
                _logger.LogInformation("After ValidateFields: {LineItemsCount} line items", 
                    result.LineItems?.Count ?? 0);
                    
                result = EnhanceFieldsAsync(result);
                _logger.LogInformation("After EnhanceFields: {LineItemsCount} line items", 
                    result.LineItems?.Count ?? 0);
                    
                result = PostProcessAsync(result);
                _logger.LogInformation("After PostProcess: {LineItemsCount} line items", 
                    result.LineItems?.Count ?? 0);

                // Calculate final confidence score
                result.ConfidenceScore = CalculateOverallConfidence(result);

                _logger.LogInformation("Completed OCR processing pipeline. Final confidence score: {Score}, Final line items count: {LineItemsCount}", 
                    result.ConfidenceScore, result.LineItems?.Count ?? 0);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OCR processing pipeline");
                throw;
            }
        }

        private OcrResult PreProcessAsync(OcrResult result)
        {
            _logger.LogInformation("Starting pre-processing step");

            // Clean and normalize text fields
            result.InvoiceNumber = NormalizeInvoiceNumber(result.InvoiceNumber);
            result.VendorName = NormalizeCompanyName(result.VendorName ?? string.Empty);
            result.CustomerName = NormalizeCompanyName(result.CustomerName ?? string.Empty);

            // Normalize dates
            result.InvoiceDate = NormalizeDate(result.InvoiceDate);
            result.DueDate = NormalizeDate(result.DueDate);

            // Normalize amounts
            result.InvoiceValue = NormalizeAmount(result.InvoiceValue);
            result.SubTotal = NormalizeAmount(result.SubTotal);
            result.TaxAmount = NormalizeAmount(result.TaxAmount);
            result.TotalAmount = NormalizeAmount(result.TotalAmount);

            return result;
        }

        private OcrResult ValidateFieldsAsync(OcrResult result)
        {
            _logger.LogInformation("Starting field validation step");

            var validationErrors = new List<string>();

            // Required fields validation
            if (string.IsNullOrEmpty(result.InvoiceNumber))
                validationErrors.Add("Invoice number is required");

            if (!result.InvoiceDate.HasValue)
                validationErrors.Add("Invoice date is required");

            if (!result.InvoiceValue.HasValue && !result.TotalAmount.HasValue)
                validationErrors.Add("Invoice amount is required");

            if (string.IsNullOrEmpty(result.VendorName))
                validationErrors.Add("Vendor name is required");

            // Logical validations
            if (result.InvoiceDate > DateTime.UtcNow)
                validationErrors.Add("Invoice date cannot be in the future");

            if (result.DueDate.HasValue && result.InvoiceDate.HasValue && result.DueDate < result.InvoiceDate)
                validationErrors.Add("Due date cannot be before invoice date");

            // Amount validations
            if (result.SubTotal.HasValue && result.TaxAmount.HasValue && result.TotalAmount.HasValue)
            {
                var calculatedTotal = result.SubTotal.Value + result.TaxAmount.Value;
                if (Math.Abs(calculatedTotal - result.TotalAmount.Value) > 0.01m)
                    validationErrors.Add("Total amount does not match subtotal + tax");
            }

            // Update result with validation errors
            if (validationErrors.Count > 0)
            {
                result.ErrorMessage = string.Join("; ", validationErrors);
                result.IsProcessed = false;
            }

            return result;
        }

        private OcrResult EnhanceFieldsAsync(OcrResult result)
        {
            _logger.LogInformation("Starting field enhancement step");

            // Enhance dates with better parsing
            if (!result.InvoiceDate.HasValue)
                result.InvoiceDate = ExtractDateFromText(result.RawText);

            if (!result.DueDate.HasValue)
                result.DueDate = ExtractDueDateFromText(result.RawText);

            // Enhance amounts
            if (!result.TotalAmount.HasValue && result.SubTotal.HasValue && result.TaxAmount.HasValue)
                result.TotalAmount = result.SubTotal.Value + result.TaxAmount.Value;

            // Enhance vendor information
            if (string.IsNullOrEmpty(result.VendorTaxId))
                result.VendorTaxId = ExtractTaxIdFromText(result.RawText);

            // Enhance line items
            if (result.LineItems?.Count > 0)
            {
                foreach (var item in result.LineItems)
                {
                    // Calculate missing amount if we have quantity and unit price
                    if (item.Amount == 0 && item.Quantity > 0 && item.UnitPrice > 0)
                        item.Amount = item.Quantity * item.UnitPrice;

                    // Calculate missing unit price if we have quantity and amount
                    if (item.UnitPrice == 0 && item.Quantity > 0 && item.Amount > 0)
                        item.UnitPrice = item.Amount / item.Quantity;

                    // Calculate missing quantity if we have unit price and amount
                    if (item.Quantity == 0 && item.UnitPrice > 0 && item.Amount > 0)
                        item.Quantity = item.Amount / item.UnitPrice;

                    // Validate amounts
                    if (item.Amount < 0) item.Amount = 0;
                    if (item.Quantity < 0) item.Quantity = 0;
                    if (item.UnitPrice < 0) item.UnitPrice = 0;

                    // Clean up description
                    if (!string.IsNullOrEmpty(item.Description))
                    {
                        item.Description = CleanLineItemDescription(item.Description);
                    }

                    // Set default confidence if not set
                    if (!item.ConfidenceScore.HasValue)
                    {
                        item.ConfidenceScore = CalculateLineItemConfidence(item);
                    }
                }

                // Validate line items against invoice total
                if (result.TotalAmount.HasValue)
                {
                    var lineItemsTotal = result.LineItems.Sum(x => x.Amount);
                    var difference = Math.Abs(lineItemsTotal - result.TotalAmount.Value);
                    var tolerance = result.TotalAmount.Value * 0.01m; // 1% tolerance

                    if (difference > tolerance)
                    {
                        _logger.LogWarning("Line items total ({LineItemsTotal}) differs from invoice total ({InvoiceTotal}) by {Difference}",
                            lineItemsTotal, result.TotalAmount.Value, difference);
                    }
                }
            }

            return result;
        }

        private OcrResult PostProcessAsync(OcrResult result)
        {
            _logger.LogInformation("Starting post-processing step");

            // Format currency values
            if (result.Currency.HasValue)
            {
                result.InvoiceValue = RoundToProperDecimals(result.InvoiceValue, result.Currency.Value);
                result.SubTotal = RoundToProperDecimals(result.SubTotal, result.Currency.Value);
                result.TaxAmount = RoundToProperDecimals(result.TaxAmount, result.Currency.Value);
                result.TotalAmount = RoundToProperDecimals(result.TotalAmount, result.Currency.Value);
            }

            // Calculate confidence scores for individual fields
            foreach (var field in _fieldWeights.Keys)
            {
                if (!result.FieldConfidenceScores.ContainsKey(field))
                    result.FieldConfidenceScores[field] = CalculateFieldConfidence(result, field);
            }

            return result;
        }

        private double CalculateOverallConfidence(OcrResult result)
        {
            double weightedSum = 0;
            double totalWeight = 0;

            foreach (var weight in _fieldWeights)
            {
                if (result.FieldConfidenceScores.TryGetValue(weight.Key, out double confidence))
                {
                    weightedSum += confidence * weight.Value;
                    totalWeight += weight.Value;
                }
            }

            return totalWeight > 0 ? weightedSum / totalWeight : 0;
        }

        private string NormalizeInvoiceNumber(string invoiceNumber)
        {
            if (string.IsNullOrEmpty(invoiceNumber)) return string.Empty;

            // Remove common prefixes
            invoiceNumber = Regex.Replace(invoiceNumber, @"^(?:INV|INVOICE|NO|NUM|#)\s*[:.-]?\s*", "", RegexOptions.IgnoreCase);
            
            // Remove whitespace and special characters
            invoiceNumber = Regex.Replace(invoiceNumber, @"[^\w-]", "");

            return invoiceNumber.Trim();
        }

        private string NormalizeCompanyName(string name)
        {
            if (string.IsNullOrEmpty(name)) return string.Empty;

            // Remove common suffixes
            name = Regex.Replace(name, @"\s+(?:LLC|LTD|INC|CORP|CO|COMPANY|CORPORATION)\.?$", "", RegexOptions.IgnoreCase);
            
            // Remove extra whitespace
            name = Regex.Replace(name, @"\s+", " ");

            return name.Trim();
        }

        private DateTime? NormalizeDate(DateTime? date)
        {
            if (!date.HasValue) return null;

            // Ensure date is not in the future
            if (date.Value > DateTime.UtcNow)
            {
                // Try previous year if date is in future
                return date.Value.AddYears(-1);
            }

            return date;
        }

        private decimal? NormalizeAmount(decimal? amount)
        {
            if (!amount.HasValue) return null;

            // Round to 2 decimal places
            return Math.Round(amount.Value, 2);
        }

        private decimal? RoundToProperDecimals(decimal? amount, CurrencyType currency)
        {
            if (!amount.HasValue) return null;

            // Different currencies have different decimal places
            int decimals = currency switch
            {
                CurrencyType.JPY => 0,
                CurrencyType.BHD or CurrencyType.KWD or CurrencyType.OMR => 3,
                _ => 2
            };

            return Math.Round(amount.Value, decimals);
        }

        private DateTime? ExtractDateFromText(string text)
        {
            return _dateExtractor.ExtractDate(text, "invoice date|date|issued|created");
        }

        private DateTime? ExtractDueDateFromText(string text)
        {
            return _dateExtractor.ExtractDate(text, "due date|payment due|pay by|expires|valid until");
        }

        private string ExtractTaxIdFromText(string text)
        {
            // Add sophisticated tax ID extraction logic here
            return string.Empty;
        }

        private double CalculateFieldConfidence(OcrResult result, string fieldName)
        {
            // Add sophisticated field confidence calculation logic here
            return 0.0;
        }

        private string CleanLineItemDescription(string description)
        {
            if (string.IsNullOrEmpty(description)) return string.Empty;

            // Remove common suffixes like "per unit" or "each"
            description = Regex.Replace(description, @"\s*(?:per unit|each)\.?$", "", RegexOptions.IgnoreCase);
            
            // Remove extra whitespace
            description = Regex.Replace(description, @"\s+", " ");

            return description.Trim();
        }

        private double CalculateLineItemConfidence(InvoiceLineItemDto item)
        {
            double confidence = 0;
            double totalWeight = 0;

            // Description confidence (30%)
            if (!string.IsNullOrEmpty(item.Description))
            {
                var descConfidence = CalculateDescriptionConfidence(item.Description);
                confidence += 0.3 * descConfidence;
                totalWeight += 0.3;
            }

            // Quantity confidence (20%)
            if (item.Quantity > 0)
            {
                var qtyConfidence = CalculateQuantityConfidence(item.Quantity);
                confidence += 0.2 * qtyConfidence;
                totalWeight += 0.2;
            }

            // Unit price confidence (20%)
            if (item.UnitPrice > 0)
            {
                var priceConfidence = CalculatePriceConfidence(item.UnitPrice);
                confidence += 0.2 * priceConfidence;
                totalWeight += 0.2;
            }

            // Amount confidence (30%)
            if (item.Amount > 0)
            {
                var amountConfidence = CalculateAmountConfidence(item.Amount);
                confidence += 0.3 * amountConfidence;
                totalWeight += 0.3;
            }

            // Bonus for calculated consistency
            if (item.Quantity > 0 && item.UnitPrice > 0 && item.Amount > 0)
            {
                var calculatedAmount = item.Quantity * item.UnitPrice;
                var difference = Math.Abs(calculatedAmount - item.Amount);
                var tolerance = item.Amount * 0.01m; // 1% tolerance
                
                if (difference <= tolerance)
                {
                    confidence += 0.1; // Bonus for consistency
                    totalWeight += 0.1;
                }
                else
                {
                    // Penalty for inconsistency
                    confidence -= 0.1;
                    totalWeight += 0.1;
                }
            }

            var finalConfidence = totalWeight > 0 ? confidence / totalWeight : 0;
            
            // Ensure confidence is between 0 and 1
            return Math.Max(0, Math.Min(1, finalConfidence));
        }

        private double CalculateDescriptionConfidence(string description)
        {
            if (string.IsNullOrEmpty(description))
                return 0;

            double confidence = 0.5; // Base confidence

            // Bonus for meaningful service/product words
            var serviceWords = new[] { "Fee", "Service", "Product", "Item", "Transaction", "Basic", "Additional", "Change", "User", "Account", "Guide", "Pos", "View" };
            var hasServiceWord = serviceWords.Any(word => description.Contains(word, StringComparison.OrdinalIgnoreCase));
            if (hasServiceWord)
                confidence += 0.3;

            // Bonus for reasonable length
            if (description.Length >= 5 && description.Length <= 100)
                confidence += 0.2;

            // Penalty for suspicious patterns
            var suspiciousPatterns = new[] { @"^\d+$", @"^[A-Z]{1,3}$", @"^[a-z]{1,3}$" };
            if (suspiciousPatterns.Any(pattern => Regex.IsMatch(description, pattern)))
                confidence -= 0.4;

            return Math.Max(0, Math.Min(1, confidence));
        }

        private double CalculateQuantityConfidence(decimal quantity)
        {
            if (quantity <= 0)
                return 0;

            double confidence = 0.5; // Base confidence

            // Bonus for reasonable quantities
            if (quantity >= 0.01m && quantity <= 1000)
                confidence += 0.3;

            // Penalty for very large quantities (likely errors)
            if (quantity > 10000)
                confidence -= 0.4;

            // Bonus for whole numbers
            if (quantity == Math.Floor(quantity))
                confidence += 0.2;

            return Math.Max(0, Math.Min(1, confidence));
        }

        private double CalculatePriceConfidence(decimal price)
        {
            if (price <= 0)
                return 0;

            double confidence = 0.5; // Base confidence

            // Bonus for reasonable prices
            if (price >= 0.01m && price <= 10000)
                confidence += 0.3;

            // Penalty for very high prices (likely errors)
            if (price > 100000)
                confidence -= 0.4;

            // Bonus for prices with 2 decimal places (typical for currency)
            var decimalPlaces = BitConverter.GetBytes(decimal.GetBits(price)[3])[2];
            if (decimalPlaces == 2)
                confidence += 0.2;

            return Math.Max(0, Math.Min(1, confidence));
        }

        private double CalculateAmountConfidence(decimal amount)
        {
            if (amount <= 0)
                return 0;

            double confidence = 0.5; // Base confidence

            // Bonus for reasonable amounts
            if (amount >= 0.01m && amount <= 100000)
                confidence += 0.3;

            // Penalty for very high amounts (likely errors)
            if (amount > 1000000)
                confidence -= 0.4;

            // Bonus for amounts with 2 decimal places
            var decimalPlaces = BitConverter.GetBytes(decimal.GetBits(amount)[3])[2];
            if (decimalPlaces == 2)
                confidence += 0.2;

            return Math.Max(0, Math.Min(1, confidence));
        }
    }
} 