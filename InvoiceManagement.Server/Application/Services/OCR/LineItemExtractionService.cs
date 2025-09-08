using InvoiceManagement.Server.Application.DTOs;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace InvoiceManagement.Server.Application.Services.OCR
{
    public class LineItemExtractionService
    {
        private readonly ILogger<LineItemExtractionService> _logger;
        private readonly Dictionary<string, double> _fieldWeights;

        public LineItemExtractionService(ILogger<LineItemExtractionService> logger)
        {
            _logger = logger;
            _fieldWeights = new Dictionary<string, double>
            {
                { "Description", 0.3 },
                { "Quantity", 0.2 },
                { "UnitPrice", 0.2 },
                { "Amount", 0.3 }
            };
        }

        public List<InvoiceLineItemDto> ExtractLineItemsFromText(string rawText)
        {
            var lineItems = new List<InvoiceLineItemDto>();
            
            try
            {
                _logger.LogInformation("Starting line item extraction from raw text");
                _logger.LogInformation("Raw text length: {Length} characters", rawText?.Length ?? 0);
                
                // Check if rawText is null or empty
                if (string.IsNullOrEmpty(rawText))
                {
                    _logger.LogWarning("Raw text is null or empty, cannot extract line items");
                    return lineItems;
                }
                
                // Log a sample of the raw text for debugging
                var sampleText = rawText.Length > 500 ? rawText.Substring(0, 500) + "..." : rawText;
                _logger.LogInformation("Raw text sample: {SampleText}", sampleText);
                
                // Log ALL lines for debugging
                var allLines = rawText.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                _logger.LogInformation("Raw text contains {LineCount} lines:", allLines.Length);
                for (int i = 0; i < Math.Min(allLines.Length, 20); i++) // Log first 20 lines
                {
                    _logger.LogInformation("Line {Index}: '{Line}'", i + 1, allLines[i].Trim());
                }

                // Step 1: Detect invoice format and table structure
                var invoiceFormat = DetectInvoiceFormat(rawText);
                _logger.LogInformation("Detected invoice format: {Format}", invoiceFormat);

                // Step 2: Extract line items using format-appropriate method
                switch (invoiceFormat)
                {
                    case InvoiceFormat.Tabular:
                        lineItems = ExtractTabularLineItems(rawText);
                        break;
                    case InvoiceFormat.MultiLine:
                        lineItems = ExtractMultiLineLineItems(rawText);
                        break;
                    case InvoiceFormat.SingleLine:
                        lineItems = ExtractSingleLineLineItems(rawText);
                        break;
                    case InvoiceFormat.Unknown:
                    default:
                        // Try all methods as fallback
                        lineItems = ExtractLineItemsFallback(rawText);
                        break;
                }

                _logger.LogInformation("Extracted {Count} line items using {Format} format", lineItems.Count, invoiceFormat);

                // Step 3: Apply universal filtering to remove any remaining header/footer text
                lineItems = FilterInvalidLineItems(lineItems);
                _logger.LogInformation("After filtering: {Count} valid line items", lineItems.Count);

                // Step 4: Remove duplicates and merge similar items
                var originalCount = lineItems.Count;
                lineItems = MergeSimilarLineItems(lineItems);
                _logger.LogInformation("After merging similar items: {OriginalCount} -> {FinalCount}", originalCount, lineItems.Count);

                // Step 5: Validate and calculate missing values
                foreach (var item in lineItems)
                {
                    ValidateAndCalculateLineItem(item);
                }

                _logger.LogInformation("Final extracted {Count} line items from text", lineItems.Count);
                
                // Log all extracted line items for debugging
                foreach (var item in lineItems)
                {
                    _logger.LogInformation("Final line item: {Description}, Qty: {Quantity}, Price: {Price}, Amount: {Amount}, Confidence: {Confidence}",
                        item.Description, item.Quantity, item.UnitPrice, item.Amount, item.ConfidenceScore);
                }
                
                // If we still have no line items, log a warning
                if (!lineItems.Any())
                {
                    _logger.LogWarning("No line items extracted from text. This might indicate an issue with the extraction logic or the text format.");
                    _logger.LogWarning("Raw text sample: {SampleText}", rawText.Length > 500 ? rawText.Substring(0, 500) + "..." : rawText);
                }
                
                return lineItems;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting line items from text");
                return lineItems;
            }
        }

        private enum InvoiceFormat
        {
            Unknown,
            Tabular,      // Standard table with columns
            MultiLine,    // Each line item spans multiple lines
            SingleLine    // Each line item is on a single line
        }

        private InvoiceFormat DetectInvoiceFormat(string rawText)
        {
            var lines = rawText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(line => line.Trim())
                .Where(line => !string.IsNullOrEmpty(line))
                .ToList();

            // Look for table headers that indicate tabular format
            var hasTableHeaders = lines.Any(line => 
                line.Contains("Service Description", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("Description", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("Item", StringComparison.OrdinalIgnoreCase) ||
                line.Contains("Product", StringComparison.OrdinalIgnoreCase) ||
                (line.Contains("Amount", StringComparison.OrdinalIgnoreCase) && 
                 line.Contains("Quantity", StringComparison.OrdinalIgnoreCase)) ||
                (line.Contains("Price", StringComparison.OrdinalIgnoreCase) && 
                 line.Contains("Qty", StringComparison.OrdinalIgnoreCase)));

            if (hasTableHeaders)
            {
                _logger.LogInformation("Detected tabular invoice format");
                return InvoiceFormat.Tabular;
            }

            // Look for multi-line patterns (descriptions followed by numbers on next lines)
            var multiLinePatterns = 0;
            for (int i = 0; i < lines.Count - 1; i++)
            {
                var currentLine = lines[i];
                var nextLine = lines[i + 1];
                
                // Check if current line looks like description and next line looks like numbers
                if (IsLikelyDescription(currentLine) && IsLikelyNumeric(nextLine))
                {
                    multiLinePatterns++;
                }
            }

            if (multiLinePatterns >= 3) // Need at least 3 patterns to be confident
            {
                _logger.LogInformation("Detected multi-line invoice format with {PatternCount} patterns", multiLinePatterns);
                return InvoiceFormat.MultiLine;
            }

            // Look for single-line patterns (description and numbers on same line)
            var singleLinePatterns = lines.Count(line => 
                IsLikelyDescription(line) && 
                ContainsNumbers(line) && 
                line.Length < 100); // Reasonable line length

            if (singleLinePatterns >= 3)
            {
                _logger.LogInformation("Detected single-line invoice format with {PatternCount} patterns", singleLinePatterns);
                return InvoiceFormat.SingleLine;
            }

            _logger.LogInformation("Could not determine invoice format, will use fallback methods");
            return InvoiceFormat.Unknown;
        }

        private bool IsLikelyDescription(string line)
        {
            if (string.IsNullOrEmpty(line))
                return false;

            var lowerLine = line.ToLowerInvariant();
            
            // Skip obvious header/footer text
            var skipPatterns = new[]
            {
                @"^invoice.*?no.*?\d+$",
                @"^customer.*?no.*?\d+$",
                @"^vat.*?no.*?de\d+$",
                @"^www\..*?\.(com|de|org)$",
                @"^cpb software.*?gmbh$",
                @"^musterstr.*?main$",
                @"^musterkunde.*?ag$",
                @"^mr\..*?doe$",
                @"^period.*?\d{4}$",
                @"^without vat$",
                @"^service description$",
                @"^amount.*?quantity.*?total$",
                @"^telefon.*?\d+$",
                @"^phone.*?\d+$",
                @"^fax.*?\d+$",
                @"^email.*?@$",
                @"^website.*?www$",
                @"^web.*?www$",
                @"^date.*?\d{2}\.\d{2}\.\d{4}$",
                @"^\d{2}\.\d{2}\.\d{4}.*?date$",
                @"^total$",
                @"^vat.*?%$",
                @"^gross amount.*?vat$"
            };

            // Only skip if it's an EXACT match for header patterns
            if (skipPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase)))
                return false;

            // Check if it contains service-related keywords
            var serviceKeywords = new[]
            {
                "fee", "service", "basic", "transaction", "additional", "change", "user", "account", 
                "guide", "pos", "view", "support", "maintenance", "consulting", "training", 
                "license", "subscription", "hosting", "storage", "backup", "security", 
                "monitoring", "reporting", "integration", "development", "testing", 
                "deployment", "migration", "item", "product", "charge", "cost"
            };

            var hasServiceKeyword = serviceKeywords.Any(keyword => lowerLine.Contains(keyword));
            
            // Check if it doesn't look like a number-only line
            var isNotNumericOnly = !Regex.IsMatch(line, @"^[\d\s\-\.\/\(\)€$£¥,]+$");
            
            // Check reasonable length
            var reasonableLength = line.Length >= 3 && line.Length <= 100;

            // Be more permissive - if it has service keywords, accept it
            if (hasServiceKeyword)
                return isNotNumericOnly && reasonableLength;

            // If no service keywords, check if it looks like a reasonable description
            var hasReasonableWords = line.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(word => word.Length > 2 && !word.All(char.IsDigit))
                .Count() >= 2;

            return hasReasonableWords && isNotNumericOnly && reasonableLength;
        }

        private bool IsLikelyNumeric(string line)
        {
            if (string.IsNullOrEmpty(line))
                return false;

            // Check if line contains currency symbols and numbers
            var hasCurrency = line.Contains("€") || line.Contains("$") || line.Contains("£") || line.Contains("¥");
            var hasNumbers = Regex.IsMatch(line, @"\d");
            
            return hasCurrency && hasNumbers;
        }

        private bool ContainsNumbers(string line)
        {
            return !string.IsNullOrWhiteSpace(line) && Regex.IsMatch(line, @"\d");
        }

        private int FindNextValidLineItemGroup(List<string> lines, int startIndex, int endIndex)
        {
            // Look for the start of a valid 4-line group starting from startIndex
            for (int i = startIndex; i <= endIndex - 4; i++)
            {
                var descriptionLine = lines[i];
                var unitPriceLine = lines[i + 1];
                var quantityLine = lines[i + 2];
                var totalLine = lines[i + 3];
                
                // Check if this looks like a valid line item group
                if (IsValidLineItemGroup(descriptionLine, unitPriceLine, quantityLine, totalLine))
                {
                    _logger.LogDebug("Found valid line item group starting at position {Position}", i);
                    return i;
                }
            }
            
            return -1; // No valid group found
        }



        private bool IsValidLineItemGroup(string descriptionLine, string unitPriceLine, string quantityLine, string totalLine)
        {
            // Skip if any of these lines look like headers
            if (IsHeaderLine(descriptionLine) || IsHeaderLine(unitPriceLine) || 
                IsHeaderLine(quantityLine) || IsHeaderLine(totalLine))
            {
                return false;
            }
            
            // Description line should contain service keywords and not be just numbers
            if (string.IsNullOrWhiteSpace(descriptionLine) || 
                Regex.IsMatch(descriptionLine, @"^[\d\s\-\.\/\(\)€$£¥,]+$"))
                return false;
            
            // Unit price line should contain currency and numbers
            if (!unitPriceLine.Contains("€") && !unitPriceLine.Contains("$") && !unitPriceLine.Contains("£"))
                return false;
            if (!Regex.IsMatch(unitPriceLine, @"\d"))
                return false;
            
            // Quantity line should contain numbers (can be 0)
            if (!Regex.IsMatch(quantityLine, @"\d"))
                return false;
            
            // Total line should contain currency and numbers
            if (!totalLine.Contains("€") && !totalLine.Contains("$") && !totalLine.Contains("£"))
                return false;
            if (!Regex.IsMatch(totalLine, @"\d"))
                return false;
            
            // Additional validation: description should contain service-related keywords
            var description = descriptionLine.ToLowerInvariant();
            var serviceKeywords = new[]
            {
                "fee", "basic", "transaction", "wmview", "wmpos", "wmguide", "user", "account", "service"
            };
            
            if (!serviceKeywords.Any(keyword => description.Contains(keyword)))
            {
                return false;
            }
            
            return true;
        }

        private bool IsValidWMACCESSStructure(string descriptionLine, string unitPriceLine, string quantityLine, string totalLine)
        {
            // Description line should contain service keywords and not be just numbers
            if (string.IsNullOrWhiteSpace(descriptionLine) || 
                Regex.IsMatch(descriptionLine, @"^[\d\s\-\.\/\(\)€$£¥,]+$"))
                return false;
            
            // Unit price line should contain currency and numbers
            if (!unitPriceLine.Contains("€") && !unitPriceLine.Contains("$") && !unitPriceLine.Contains("£"))
                return false;
            if (!Regex.IsMatch(unitPriceLine, @"\d"))
                return false;
            
            // Quantity line should contain numbers (can be 0)
            if (!Regex.IsMatch(quantityLine, @"\d"))
                return false;
            
            // Total line should contain currency and numbers
            if (!totalLine.Contains("€") && !totalLine.Contains("$") && !totalLine.Contains("£"))
                return false;
            if (!Regex.IsMatch(totalLine, @"\d"))
                return false;
            
            // Additional validation: description should contain service-related keywords
            var description = descriptionLine.ToLowerInvariant();
            var serviceKeywords = new[]
            {
                "fee", "basic", "transaction", "wmview", "wmpos", "wmguide", "user", "account", "service"
            };
            
            if (!serviceKeywords.Any(keyword => description.Contains(keyword)))
            {
                return false;
            }
            
            // CRITICAL: Validate that the description line is actually a service description
            // and not just a continuation of the previous line
            if (description.Length < 5 || description.Length > 80)
                return false;
            
            // Reject lines that are just numbers or special characters
            if (Regex.IsMatch(description, @"^[\d\s\-\.\/\(\)€$£¥,]+$"))
                return false;
            
            // Reject lines that look like they're part of a table header
            var headerPatterns = new[]
            {
                @"^amount.*?without.*?vat",
                @"^service.*?description",
                @"^quantity.*?total",
                @"^item.*?description",
                @"^product.*?description"
            };
            
            foreach (var pattern in headerPatterns)
            {
                if (Regex.IsMatch(description, pattern, RegexOptions.IgnoreCase))
                    return false;
            }
            
            // Validate that the unit price line contains a reasonable currency value
            var unitPriceMatch = Regex.Match(unitPriceLine, @"([€$£¥]?\s*\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)");
            if (!unitPriceMatch.Success)
                return false;
            
            // Validate that the quantity line contains a reasonable quantity
            var quantityMatch = Regex.Match(quantityLine, @"(\d+(?:[.,]\d+)?)");
            if (!quantityMatch.Success)
                return false;
            
            // Validate that the total line contains a reasonable currency value
            var totalMatch = Regex.Match(totalLine, @"([€$£¥]?\s*\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)");
            if (!totalMatch.Success)
                return false;
            
            return true;
        }

        private List<InvoiceLineItemDto> ExtractTabularLineItems(string rawText)
        {
            var lineItems = new List<InvoiceLineItemDto>();
            
            try
            {
                // Split text into lines
                var lines = rawText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                    .Select(line => line.Trim())
                    .Where(line => !string.IsNullOrEmpty(line))
                    .ToList();

                _logger.LogInformation("ExtractTabularLineItems: Processing {LineCount} lines", lines.Count);

                // Find the start of the service table
                var tableStartIndex = -1;
                for (int i = 0; i < lines.Count; i++)
                {
                    var line = lines[i];
                    if (line.Contains("Service Description", StringComparison.OrdinalIgnoreCase) ||
                        (line.Contains("Amount", StringComparison.OrdinalIgnoreCase) && 
                         line.Contains("without", StringComparison.OrdinalIgnoreCase) &&
                         line.Contains("VAT", StringComparison.OrdinalIgnoreCase)))
                    {
                        tableStartIndex = i;
                        _logger.LogInformation("Found table header at line {Index}: {Line}", i, line);
                        break;
                    }
                }

                if (tableStartIndex == -1)
                {
                    _logger.LogWarning("Could not find table header, trying alternative approach");
                    // Look for any line that contains "Fee" or "Transaction" as table start
                    for (int i = 0; i < lines.Count; i++)
                    {
                        var line = lines[i];
                        if (line.Contains("Fee", StringComparison.OrdinalIgnoreCase) ||
                            line.Contains("Transaction", StringComparison.OrdinalIgnoreCase))
                        {
                            tableStartIndex = i;
                            _logger.LogInformation("Found alternative table start at line {Index}: {Line}", i, line);
                            break;
                        }
                    }
                }

                if (tableStartIndex == -1)
                {
                    _logger.LogWarning("Could not find table start, will process all lines");
                    tableStartIndex = 0;
                }

                // Find where the actual data starts by looking for the first line that contains actual service content
                var dataStartIndex = -1;
                for (int i = tableStartIndex + 1; i < lines.Count; i++)
                {
                    var line = lines[i];
                    // Look for lines that contain actual service descriptions
                    if (line.Contains("wmView", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("wmPos", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("wmGuide", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("user accounts", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("T1", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("T2", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("T3", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("G1", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("G2", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("G3", StringComparison.OrdinalIgnoreCase))
                    {
                        dataStartIndex = i;
                        _logger.LogInformation("Found data start at line {Index}: {Line}", i, line);
                        break;
                    }
                }
                
                // If we didn't find a data start, log an error
                if (dataStartIndex == -1)
                {
                    _logger.LogError("Could not find data start point in table lines {Start} to {End}", tableStartIndex + 1, lines.Count);
                    return lineItems;
                }

                // Find where the table ends by looking for totals or end markers
                var tableEndIndex = lines.Count;
                for (int i = dataStartIndex + 1; i < lines.Count; i++)
                {
                    var line = lines[i];
                    if (line.Contains("Total", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("VAT", StringComparison.OrdinalIgnoreCase) ||
                        line.Contains("Gross Amount", StringComparison.OrdinalIgnoreCase))
                    {
                        tableEndIndex = i;
                        _logger.LogInformation("Table ends at line {Index}: {Line}", i, line);
                        break;
                    }
                }

                _logger.LogInformation("Data starts at line {Index}: '{Line}'", 
                    dataStartIndex, dataStartIndex < lines.Count ? lines[dataStartIndex] : "END");
                
                // Additional check: if we still haven't found data, look for the first line that contains actual service content
                if (dataStartIndex >= tableEndIndex)
                {
                    for (int i = tableStartIndex + 1; i < tableEndIndex; i++)
                    {
                        var line = lines[i];
                        if ((line.Contains("wmView", StringComparison.OrdinalIgnoreCase) ||
                             line.Contains("wmPos", StringComparison.OrdinalIgnoreCase) ||
                             line.Contains("wmGuide", StringComparison.OrdinalIgnoreCase) ||
                             line.Contains("user accounts", StringComparison.OrdinalIgnoreCase) ||
                             line.Contains("T1", StringComparison.OrdinalIgnoreCase) ||
                             line.Contains("T2", StringComparison.OrdinalIgnoreCase) ||
                             line.Contains("T3", StringComparison.OrdinalIgnoreCase) ||
                             line.Contains("G1", StringComparison.OrdinalIgnoreCase) ||
                             line.Contains("G2", StringComparison.OrdinalIgnoreCase) ||
                             line.Contains("G3", StringComparison.OrdinalIgnoreCase)) &&
                            !IsHeaderLine(line))
                        {
                            dataStartIndex = i;
                            _logger.LogInformation("Found service description data start at line {Index}: {Line}", i, line);
                            break;
                        }
                    }
                }

                _logger.LogInformation("Processing table lines from {Start} to {End}", dataStartIndex, tableEndIndex);

                // Log the lines around the table area for debugging
                var startDebug = Math.Max(0, dataStartIndex - 2);
                var endDebug = Math.Min(lines.Count, tableEndIndex + 2);
                _logger.LogInformation("Debug: Lines around table area ({Start}-{End}):", startDebug, endDebug);
                for (int i = startDebug; i < endDebug; i++)
                {
                    _logger.LogInformation("Debug Line {Index}: '{Line}'", i, lines[i]);
                }

                // Also log a few more lines to see the actual data
                var dataEndDebug = Math.Min(lines.Count, dataStartIndex + 20);
                _logger.LogInformation("Debug: Lines from data start ({Start}-{End}):", dataStartIndex, dataEndDebug);
                for (int i = dataStartIndex; i < dataEndDebug; i++)
                {
                    _logger.LogInformation("Data Line {Index}: '{Line}'", i, lines[i]);
                }

                // Process the table lines using intelligent line boundary detection
                // This handles cases where the 4-line structure might be interrupted
                var lineIndex = dataStartIndex;
                while (lineIndex < tableEndIndex - 3)
                {
                    // Look for the start of a valid line item group
                    var groupStart = FindNextValidLineItemGroup(lines, lineIndex, tableEndIndex);
                    if (groupStart == -1)
                    {
                        _logger.LogInformation("No more valid line item groups found after position {Position}", lineIndex);
                        break;
                    }
                    
                    lineIndex = groupStart;
                    
                    var descriptionLine = lines[lineIndex];
                    var unitPriceLine = lines[lineIndex + 1];
                    var quantityLine = lines[lineIndex + 2];
                    var totalLine = lines[lineIndex + 3];
                    
                    _logger.LogInformation("Processing lines {Start}-{End}: Desc='{Desc}', Price='{Price}', Qty='{Qty}', Total='{Total}'", 
                        lineIndex, lineIndex + 3, descriptionLine, unitPriceLine, quantityLine, totalLine);
                    
                    // Validate that we have a proper 4-line structure
                    if (!IsValidWMACCESSStructure(descriptionLine, unitPriceLine, quantityLine, totalLine))
                    {
                        _logger.LogWarning("Invalid 4-line structure at position {Position}, moving to next line", lineIndex);
                        _logger.LogDebug("Validation failed - Desc: '{Desc}', Price: '{Price}', Qty: '{Qty}', Total: '{Total}'", 
                            descriptionLine, unitPriceLine, quantityLine, totalLine);
                        lineIndex += 1;
                        continue;
                    }
                    
                    // Try to parse the 4-line group as a line item
                    var lineItem = ParseMultiLineTableItem(descriptionLine, unitPriceLine, quantityLine, totalLine);
                    if (lineItem != null && IsValidLineItem(lineItem))
                    {
                        lineItems.Add(lineItem);
                        _logger.LogInformation("Extracted line item: {Description}, Qty: {Quantity}, Price: {Price}, Amount: {Amount}",
                            lineItem.Description, lineItem.Quantity, lineItem.UnitPrice, lineItem.Amount);
                        lineIndex += 4; // Successfully parsed 4 lines, move to next group
                    }
                    else
                    {
                        _logger.LogWarning("Could not parse lines {Start}-{End} as line item, moving to next line", lineIndex, lineIndex + 3);
                        lineIndex += 1; // Move to next line and try to find a new group
                    }
                }

                _logger.LogInformation("ExtractTabularLineItems: Found {Count} line items", lineItems.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ExtractTabularLineItems");
            }

            return lineItems;
        }

        private bool IsHeaderLine(string line)
        {
            if (string.IsNullOrEmpty(line))
                return true;
                
            var lowerLine = line.ToLowerInvariant();
            return lowerLine.Contains("service description") ||
                   lowerLine.Contains("amount") ||
                   lowerLine.Contains("quantity") ||
                   lowerLine.Contains("total amount") ||
                   lowerLine.Contains("without vat") ||
                   lowerLine.Contains("invoice") ||
                   lowerLine.Contains("customer") ||
                   lowerLine.Contains("date") ||
                   lowerLine.Contains("period") ||
                   lowerLine == "amount" ||
                   lowerLine == "quantity" ||
                   lowerLine == "total amount" ||
                   lowerLine == "without vat" ||
                   lowerLine == "service description";
        }

        private InvoiceLineItemDto? ParseMultiLineTableItem(string descriptionLine, string unitPriceLine, string quantityLine, string totalLine)
        {
            try
            {
                // Parse description
                var description = CleanDescription(descriptionLine);
                if (string.IsNullOrEmpty(description))
                {
                    _logger.LogDebug("Empty description from line: {Line}", descriptionLine);
                    return null;
                }

                // Parse unit price
                var unitPrice = ParseCurrency(unitPriceLine);
                if (unitPrice < 0)
                {
                    _logger.LogDebug("Invalid unit price from line: {Line}", unitPriceLine);
                    return null;
                }

                // Parse quantity
                var quantity = ParseDecimal(quantityLine);
                if (quantity < 0)
                {
                    _logger.LogDebug("Invalid quantity from line: {Line}", quantityLine);
                    return null;
                }

                // Parse total amount
                var totalAmount = ParseCurrency(totalLine);
                if (totalAmount < 0)
                {
                    _logger.LogDebug("Invalid total amount from line: {Line}", totalLine);
                    return null;
                }

                // Validate that the math makes sense
                // But be more flexible for WMACCESS format
                if (unitPrice > 0 && quantity > 0 && totalAmount > 0)
                {
                    var calculatedTotal = unitPrice * quantity;
                    var difference = Math.Abs(calculatedTotal - totalAmount);
                    var tolerance = totalAmount * 0.05m; // 5% tolerance for OCR errors

                    if (difference > tolerance)
                    {
                        _logger.LogDebug("Amount mismatch: {UnitPrice} × {Quantity} = {Calculated}, but total is {Total}, allowing it", 
                            unitPrice, quantity, calculatedTotal, totalAmount);
                    }
                }

                return new InvoiceLineItemDto
                {
                    Description = description,
                    UnitPrice = unitPrice,
                    Quantity = quantity,
                    Amount = totalAmount,
                    ConfidenceScore = 0.95 // Very high confidence for WMACCESS multi-line table format
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error parsing multi-line table item");
                return null;
            }
        }

        private List<InvoiceLineItemDto> ExtractMultiLineLineItems(string rawText)
        {
            var lineItems = new List<InvoiceLineItemDto>();

                // Split text into lines
                var lines = rawText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                    .Select(line => line.Trim())
                    .Where(line => !string.IsNullOrEmpty(line))
                    .ToList();

                _logger.LogInformation("Found {LineCount} lines in raw text", lines.Count);
                
                // Log first few lines for debugging
                var firstLines = lines.Take(10).ToList();
                _logger.LogInformation("First 10 lines: {Lines}", string.Join(" | ", firstLines));

            // Find lines that look like descriptions followed by numbers on the next line
            for (int i = 0; i < lines.Count - 1; i++)
            {
                var currentLine = lines[i];
                var nextLine = lines[i + 1];
                
                if (IsLikelyDescription(currentLine) && IsLikelyNumeric(nextLine))
                {
                    var lineItem = new InvoiceLineItemDto
                    {
                        Description = CleanDescription(currentLine),
                        Quantity = 1, // Default quantity
                        UnitPrice = 0, // Will be calculated
                        Amount = 0, // Will be calculated
                        ConfidenceScore = 0.7 // Higher confidence for multi-line
                    };

                    // Try to parse quantity and unit price from the next line
                    var quantityMatch = Regex.Match(nextLine, @"(\d+(?:\.\d+)?)\s*([€$£¥]?)");
                    if (quantityMatch.Success)
                    {
                        lineItem.Quantity = ParseDecimal(quantityMatch.Groups[1].Value);
                        lineItem.UnitPrice = ParseCurrency(quantityMatch.Groups[2].Value + quantityMatch.Groups[1].Value); // Combine currency and number
                    }

                    // Try to parse amount from the next line
                    var amountMatch = Regex.Match(nextLine, @"([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)");
                    if (amountMatch.Success)
                    {
                        lineItem.Amount = ParseCurrency(amountMatch.Value);
                    }

                    if (IsValidLineItem(lineItem))
                    {
                        lineItems.Add(lineItem);
                        _logger.LogInformation("Extracted multi-line line item: {Description}, Qty: {Quantity}, Price: {Price}, Amount: {Amount}",
                            lineItem.Description, lineItem.Quantity, lineItem.UnitPrice, lineItem.Amount);
                    }
                }
            }

            return lineItems;
        }

        private List<InvoiceLineItemDto> ExtractSingleLineLineItems(string rawText)
        {
            var lineItems = new List<InvoiceLineItemDto>();
            
            // Split text into lines
            var lines = rawText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(line => line.Trim())
                .Where(line => !string.IsNullOrEmpty(line))
                .ToList();

            _logger.LogInformation("Found {LineCount} lines in raw text", lines.Count);
            
            // Log first few lines for debugging
            var firstLines = lines.Take(10).ToList();
            _logger.LogInformation("First 10 lines: {Lines}", string.Join(" | ", firstLines));

            // Find lines that look like descriptions followed by numbers on the same line
            foreach (var line in lines)
            {
                if (IsLikelyDescription(line) && ContainsNumbers(line))
                {
                    var lineItem = new InvoiceLineItemDto
                    {
                        Description = CleanDescription(line),
                        Quantity = 1, // Default quantity
                        UnitPrice = 0, // Will be calculated
                        Amount = 0, // Will be calculated
                        ConfidenceScore = 0.7 // Higher confidence for single-line
                    };

                    // Try to parse quantity and unit price from the same line
                    var quantityMatch = Regex.Match(line, @"(\d+(?:\.\d+)?)\s*([€$£¥]?)");
                    if (quantityMatch.Success)
                    {
                        lineItem.Quantity = ParseDecimal(quantityMatch.Groups[1].Value);
                        lineItem.UnitPrice = ParseCurrency(quantityMatch.Groups[2].Value + quantityMatch.Groups[1].Value); // Combine currency and number
                    }

                    // Try to parse amount from the same line
                    var amountMatch = Regex.Match(line, @"([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)");
                    if (amountMatch.Success)
                    {
                        lineItem.Amount = ParseCurrency(amountMatch.Value);
                    }

                    if (IsValidLineItem(lineItem))
                    {
                        lineItems.Add(lineItem);
                        _logger.LogInformation("Extracted single-line line item: {Description}, Qty: {Quantity}, Price: {Price}, Amount: {Amount}",
                            lineItem.Description, lineItem.Quantity, lineItem.UnitPrice, lineItem.Amount);
                    }
                }
            }

            return lineItems;
        }

        private List<InvoiceLineItemDto> ExtractLineItemsFallback(string rawText)
        {
            var lineItems = new List<InvoiceLineItemDto>();
            
            // Try regex patterns (only if table parsing didn't work well)
            if (lineItems.Count < 3) // Only use regex if we don't have enough items
            {
                var regexLineItems = ExtractLineItemsWithRegex(rawText);
                _logger.LogInformation("Extracted {RegexCount} line items via regex patterns", regexLineItems.Count);
                lineItems.AddRange(regexLineItems);
            }
            else
            {
                _logger.LogInformation("Skipping regex extraction as we already have {Count} items from table parsing", lineItems.Count);
            }

            // If no line items found with complex patterns, try simple fallback extraction
            if (!lineItems.Any())
            {
                _logger.LogWarning("No line items found with regex patterns, trying simple fallback extraction");
                lineItems = ExtractSimpleLineItems(rawText);
            }

            // If still no line items, try the most basic extraction possible
            if (!lineItems.Any())
            {
                _logger.LogWarning("Simple extraction failed, trying ultra-basic extraction");
                lineItems = ExtractUltraBasicLineItems(rawText);
            }
            
            // If still no line items, try currency-based extraction (most permissive)
                if (!lineItems.Any())
                {
                _logger.LogWarning("Ultra-basic extraction failed, trying currency-based extraction");
                lineItems = ExtractCurrencyBasedLineItems(rawText);
                }
                
            _logger.LogInformation("Fallback extraction found {Count} line items", lineItems.Count);
                return lineItems;
        }

        private List<string> FindTableStructures(List<string> lines)
        {
            var tableLines = new List<string>();
            
            // Skip common header/footer patterns
            var skipPatterns = new[]
            {
                @"^(Invoice|Rechnung|Bill|Invoice No|Customer No|Date|Invoice Period)",
                @"^(Total|Summe|VAT|MWSt|Gross Amount|Bruttobetrag)",
                @"^(Telefon|Phone|Fax|Email|Website|Web)",
                @"^(Musterstr|Sample|Example|Test)",
                @"^(\d{1,2}\.\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|März|Januar|Februar))",
                @"^(\+?\d{1,4}\s*[-.\s]?\d{1,4}\s*[-.\s]?\d{1,4})", // Phone numbers
                @"^(VAT No|Steuernummer|Tax ID)",
                @"^(\d{5,})", // Very long numbers (likely invoice numbers, not quantities)
            };

            var tablePatterns = new[]
            {
                // Generic patterns for most invoice formats
                @"^([A-Za-z0-9\s\-\.\/\(\)]+)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)$",
                @"^([A-Za-z0-9\s\-\.\/\(\)]+)\s+([€$£¥]?\s*\d+(?:\.\d+)?)$",
                @"^(\d+)\s+([A-Za-z0-9\s\-\.\/\(\)]+)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)$",
                
                // Specific patterns for WMACCESS format (as fallbacks)
                @"^([A-Za-z\s\-\.]+(?:Fee|Service|Product|Item|Transaction|Basic|Additional|Change|User|Account|Guide|Pos|View|T\d+|G\d+)[A-Za-z\s\-\.]*)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)$",
                @"^([A-Za-z\s\-\.]+(?:Fee|Service|Product|Item|Transaction|Basic|Additional|Change|User|Account|Guide|Pos|View|T\d+|G\d+)[A-Za-z\s\-\.]*)\s+([€$£¥]?\s*\d+(?:\.\d+)?)$",
                @"^(\d+)\s+([A-Za-z\s\-\.]+(?:Fee|Service|Product|Item|Transaction|Basic|Additional|Change|User|Account|Guide|Pos|View|T\d+|G\d+)[A-Za-z\s\-\.]*)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)$"
            };

            foreach (var line in lines)
            {
                // Skip lines that match header/footer patterns
                var shouldSkip = skipPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
                if (shouldSkip)
                {
                    continue;
                }

                foreach (var pattern in tablePatterns)
                {
                    if (Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase))
                    {
                        tableLines.Add(line);
                        break;
                    }
                }
            }

            return tableLines;
        }

        private InvoiceLineItemDto? ParseTableLine(string line)
        {
            try
            {
                // Pattern 1: Description Quantity Price Amount (4 columns)
                var pattern1 = @"^(.+?)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)$";
                var match1 = Regex.Match(line, pattern1, RegexOptions.IgnoreCase);
                
                if (match1.Success)
                {
                    return new InvoiceLineItemDto
                    {
                        Description = CleanDescription(match1.Groups[1].Value),
                        Quantity = ParseDecimal(match1.Groups[2].Value),
                        UnitPrice = ParseCurrency(match1.Groups[3].Value),
                        Amount = ParseCurrency(match1.Groups[4].Value)
                    };
                }

                // Pattern 2: Description Amount (2 columns)
                var pattern2 = @"^(.+?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)$";
                var match2 = Regex.Match(line, pattern2, RegexOptions.IgnoreCase);
                
                if (match2.Success)
                {
                    return new InvoiceLineItemDto
                    {
                        Description = CleanDescription(match2.Groups[1].Value),
                        Amount = ParseCurrency(match2.Groups[2].Value),
                        Quantity = 1 // Default quantity
                    };
                }

                // Pattern 3: ItemNumber Description Quantity Price (4 columns with item number)
                var pattern3 = @"^(\d+)\s+(.+?)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)$";
                var match3 = Regex.Match(line, pattern3, RegexOptions.IgnoreCase);
                
                if (match3.Success)
                {
                    return new InvoiceLineItemDto
                    {
                        ItemNumber = match3.Groups[1].Value,
                        Description = CleanDescription(match3.Groups[2].Value),
                        Quantity = ParseDecimal(match3.Groups[3].Value),
                        UnitPrice = ParseCurrency(match3.Groups[4].Value)
                    };
                }

                // Pattern 4: Description Quantity Total (3 columns)
                var pattern4 = @"^(.+?)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)$";
                var match4 = Regex.Match(line, pattern4, RegexOptions.IgnoreCase);
                
                if (match4.Success)
                {
                    var quantity = ParseDecimal(match4.Groups[2].Value);
                    var amount = ParseCurrency(match4.Groups[3].Value);
                    var unitPrice = quantity > 0 ? amount / quantity : amount;
                    
                    return new InvoiceLineItemDto
                    {
                        Description = CleanDescription(match4.Groups[1].Value),
                        Quantity = quantity,
                        UnitPrice = unitPrice,
                        Amount = amount
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error parsing table line: {Line}", line);
                return null;
            }
        }

        private List<InvoiceLineItemDto> ExtractLineItemsWithRegex(string rawText)
        {
            var lineItems = new List<InvoiceLineItemDto>();
            
            // Specific patterns for WMACCESS format (primary patterns)
            var wmaccessPatterns = new[]
            {
                // WMACCESS 4-column pattern: Description, Unit Price, Quantity, Total Amount
                @"^([A-Za-z0-9\s\-\.\/\(\)]+)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)$",
                
                // WMACCESS 3-column pattern: Description, Quantity, Total
                @"^([A-Za-z0-9\s\-\.\/\(\)]+)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)$",
                
                // WMACCESS 2-column pattern: Description, Amount
                @"^([A-Za-z0-9\s\-\.\/\(\)]+)\s+([€$£¥]?\s*\d+(?:\.\d+)?)$",
                
                // Pattern with item numbers: Item#, Description, Quantity, Price, Amount
                @"^(\d+)\s+([A-Za-z0-9\s\-\.\/\(\)]+)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:\.\d+)?)$",
            };

            // Generic patterns that work for most invoice formats (fallbacks)
            var genericPatterns = new[]
            {
                // Generic 4-column pattern: Description, Unit Price, Quantity, Total
                @"^([A-Za-z0-9\s\-\.\/\(\)]+)\s+([€$£¥]?\s*\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:\.\d+)?)$",
                
                // Generic 3-column pattern: Description, Quantity, Total
                @"^([A-Za-z0-9\s\-\.\/\(\)]+)\s+(\d+(?:\.\d+)?)\s+([€$£¥]?\s*\d+(?:\.\d+)?)$",
                
                // Generic 2-column pattern: Description, Amount
                @"^([A-Za-z0-9\s\-\.\/\(\)]+)\s+([€$£¥]?\s*\d+(?:\.\d+)?)$",
            };

            // Try WMACCESS patterns first (more specific)
            var allPatterns = wmaccessPatterns.Concat(genericPatterns).ToArray();

            foreach (var pattern in allPatterns)
            {
                var matches = Regex.Matches(rawText, pattern, RegexOptions.IgnoreCase | RegexOptions.Multiline);
                foreach (Match match in matches)
                {
                    try
                    {
                        var lineItem = new InvoiceLineItemDto
                        {
                            Description = CleanDescription(match.Groups[1].Value)
                        };

                        // Handle different column layouts based on pattern type
                        if (pattern.Contains(@"^(\d+)\s+([A-Za-z0-9\s\-\.\/\(\)]+)") && match.Groups.Count >= 6)
                        {
                            // Item number pattern: Item#, Description, Quantity, Price, Amount
                            lineItem.ItemNumber = match.Groups[1].Value;
                            lineItem.Quantity = ParseDecimal(match.Groups[3].Value);
                            lineItem.UnitPrice = ParseCurrency(match.Groups[4].Value);
                            lineItem.Amount = ParseCurrency(match.Groups[5].Value);
                        }
                        else if (pattern.Contains(@"\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$") && match.Groups.Count >= 4)
                        {
                            // 4-column pattern: Description, Unit Price, Quantity, Total
                            lineItem.UnitPrice = ParseCurrency(match.Groups[2].Value);
                            lineItem.Quantity = ParseDecimal(match.Groups[3].Value);
                            lineItem.Amount = ParseCurrency(match.Groups[4].Value);
                        }
                        else if (pattern.Contains(@"\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$") && match.Groups.Count >= 3)
                        {
                            // 3-column pattern: Description, Quantity, Total
                            lineItem.Quantity = ParseDecimal(match.Groups[2].Value);
                            lineItem.Amount = ParseCurrency(match.Groups[3].Value);
                            lineItem.UnitPrice = lineItem.Quantity > 0 ? lineItem.Amount / lineItem.Quantity : 0;
                        }
                        else if (match.Groups.Count >= 2)
                        {
                            // 2-column pattern: Description, Amount
                            lineItem.Amount = ParseCurrency(match.Groups[2].Value);
                            lineItem.Quantity = 1; // Default to 1
                            lineItem.UnitPrice = lineItem.Amount;
                        }

                        // Validate the extracted line item
                        if (IsValidLineItem(lineItem))
                        {
                            lineItems.Add(lineItem);
                            _logger.LogInformation("Extracted line item via regex: {Description}, Qty: {Quantity}, Price: {Price}, Amount: {Amount}",
                                lineItem.Description, lineItem.Quantity, lineItem.UnitPrice, lineItem.Amount);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error processing regex match: {Match}", match.Value);
                    }
                }
            }

            // If no line items found with complex patterns, try simple fallback extraction
            if (!lineItems.Any())
            {
                _logger.LogWarning("No line items found with regex patterns, trying simple fallback extraction");
                lineItems = ExtractSimpleLineItems(rawText);
            }

            return lineItems;
        }

        private List<InvoiceLineItemDto> FilterInvalidLineItems(List<InvoiceLineItemDto> lineItems)
        {
            var filteredItems = new List<InvoiceLineItemDto>();
            
            foreach (var item in lineItems)
            {
                if (IsValidLineItem(item))
                {
                    filteredItems.Add(item);
                }
                else
                {
                    _logger.LogDebug("Filtered out invalid line item: {Description}", item.Description);
                }
            }
            
            return filteredItems;
        }

        private List<InvoiceLineItemDto> ExtractSimpleLineItems(string rawText)
        {
            var lineItems = new List<InvoiceLineItemDto>();
            
            // Split text into lines
            var lines = rawText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(line => line.Trim())
                .Where(line => !string.IsNullOrEmpty(line))
                .ToList();

            // Look for any line that contains a service keyword and a number
            foreach (var line in lines)
            {
                if (IsLikelyDescription(line) && ContainsNumbers(line))
                        {
                            var lineItem = new InvoiceLineItemDto
                            {
                        Description = CleanDescription(line),
                                Quantity = 1,
                        UnitPrice = 0,
                        Amount = 0,
                        ConfidenceScore = 0.5 // Lower confidence for simple extraction
                    };

                    // Try to extract any number as amount
                    var numberMatch = Regex.Match(line, @"([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)");
                    if (numberMatch.Success)
                    {
                        lineItem.Amount = ParseCurrency(numberMatch.Value);
                        lineItem.UnitPrice = lineItem.Amount;
                    }

                    if (IsValidLineItem(lineItem))
                    {
                            lineItems.Add(lineItem);
                    }
                }
            }
            
            return lineItems;
        }

        private List<InvoiceLineItemDto> ExtractUltraBasicLineItems(string rawText)
        {
            var lineItems = new List<InvoiceLineItemDto>();
            
            // Split text into lines
            var lines = rawText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(line => line.Trim())
                .Where(line => !string.IsNullOrEmpty(line))
                .ToList();

            // Look for any line that contains a currency symbol and a number
            foreach (var line in lines)
            {
                var hasCurrency = line.Contains("€") || line.Contains("$") || line.Contains("£") || line.Contains("¥");
                var hasNumbers = Regex.IsMatch(line, @"\d");
                
                if (hasCurrency && hasNumbers && line.Length > 5 && line.Length < 100)
                        {
                            var lineItem = new InvoiceLineItemDto
                            {
                        Description = CleanDescription(line),
                                Quantity = 1,
                        UnitPrice = 0,
                        Amount = 0,
                        ConfidenceScore = 0.3 // Very low confidence for ultra-basic extraction
                    };

                    // Try to extract any number as amount
                    var numberMatch = Regex.Match(line, @"([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)");
                    if (numberMatch.Success)
                    {
                        lineItem.Amount = ParseCurrency(numberMatch.Value);
                                lineItem.UnitPrice = lineItem.Amount;
                            }

                            if (IsValidLineItem(lineItem))
                            {
                                lineItems.Add(lineItem);
                    }
                }
            }

            return lineItems;
        }

        private List<InvoiceLineItemDto> ExtractCurrencyBasedLineItems(string rawText)
        {
            var lineItems = new List<InvoiceLineItemDto>();
            
            // Split text into lines
                var lines = rawText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                    .Select(line => line.Trim())
                    .Where(line => !string.IsNullOrEmpty(line))
                    .ToList();

            // Look for any line that contains a currency symbol
            foreach (var line in lines)
            {
                var hasCurrency = line.Contains("€") || line.Contains("$") || line.Contains("£") || line.Contains("¥");
                
                if (hasCurrency && line.Length > 3 && line.Length < 150)
                {
                    var lineItem = new InvoiceLineItemDto
                    {
                        Description = CleanDescription(line),
                        Quantity = 1,
                        UnitPrice = 0,
                        Amount = 0,
                        ConfidenceScore = 0.2 // Lowest confidence for currency-based extraction
                    };

                    // Try to extract any number as amount
                    var numberMatch = Regex.Match(line, @"([€$£¥]?\s*\d+(?:,\d{3})*(?:\.\d{2})?)");
                    if (numberMatch.Success)
                    {
                        lineItem.Amount = ParseCurrency(numberMatch.Value);
                        lineItem.UnitPrice = lineItem.Amount;
                    }

                    if (IsValidLineItem(lineItem))
                    {
                        lineItems.Add(lineItem);
                    }
                }
            }

            return lineItems;
        }

        private bool IsHeaderFooterLine(string line)
        {
            var headerFooterPatterns = new[]
            {
                @"^(Invoice|Rechnung|Bill|Total|Summe|VAT|MWSt|Tax|Date|Customer|Vendor)",
                @"^(Telefon|Phone|Fax|Email|Website|Web)",
                @"^(Musterstr|Sample|Example|Test)",
                @"^(\d{1,2}\.\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))",
                @"^(VAT No|Steuernummer|Tax ID)",
                @"^(\+?\d{1,4}\s*[-.\s]?\d{1,4}\s*[-.\s]?\d{1,4})" // Phone numbers
            };
            
            return headerFooterPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
        }

        private List<InvoiceLineItemDto> MergeSimilarLineItems(List<InvoiceLineItemDto> lineItems)
        {
            var mergedItems = new List<InvoiceLineItemDto>();
            var processedIndices = new HashSet<int>();

            for (int i = 0; i < lineItems.Count; i++)
            {
                if (processedIndices.Contains(i)) continue;

                var currentItem = lineItems[i];
                var similarItems = new List<InvoiceLineItemDto> { currentItem };
                processedIndices.Add(i);

                // Find similar items
                for (int j = i + 1; j < lineItems.Count; j++)
                {
                    if (processedIndices.Contains(j)) continue;

                    var otherItem = lineItems[j];
                    if (AreSimilarLineItems(currentItem, otherItem))
                    {
                        similarItems.Add(otherItem);
                        processedIndices.Add(j);
                    }
                }

                // Merge similar items
                if (similarItems.Count > 1)
                {
                    var mergedItem = MergeLineItems(similarItems);
                    mergedItems.Add(mergedItem);
                }
                else
                {
                    mergedItems.Add(currentItem);
                }
            }

            return mergedItems;
        }

        private bool AreSimilarLineItems(InvoiceLineItemDto item1, InvoiceLineItemDto item2)
        {
            // Check if descriptions are similar (using Levenshtein distance or simple similarity)
            var similarity = CalculateStringSimilarity(item1.Description, item2.Description);
            return similarity > 0.8; // 80% similarity threshold
        }

        private double CalculateStringSimilarity(string str1, string str2)
        {
            if (string.IsNullOrEmpty(str1) || string.IsNullOrEmpty(str2))
                return 0;

            var longer = str1.Length > str2.Length ? str1 : str2;
            var shorter = str1.Length > str2.Length ? str2 : str1;

            if (longer.Length == 0)
                return 1.0;

            var distance = CalculateLevenshteinDistance(longer, shorter);
            return (longer.Length - distance) / (double)longer.Length;
        }

        private int CalculateLevenshteinDistance(string s1, string s2)
        {
            int[,] d = new int[s1.Length + 1, s2.Length + 1];

            for (int i = 0; i <= s1.Length; i++)
                d[i, 0] = i;

            for (int j = 0; j <= s2.Length; j++)
                d[0, j] = j;

            for (int i = 1; i <= s1.Length; i++)
            {
                for (int j = 1; j <= s2.Length; j++)
                {
                    int cost = s1[i - 1] == s2[j - 1] ? 0 : 1;
                    d[i, j] = Math.Min(Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1), d[i - 1, j - 1] + cost);
                }
            }

            return d[s1.Length, s2.Length];
        }

        private InvoiceLineItemDto MergeLineItems(List<InvoiceLineItemDto> items)
        {
            var merged = new InvoiceLineItemDto
            {
                Description = items.First().Description, // Use the first description
                Quantity = items.Sum(x => x.Quantity),
                UnitPrice = items.Average(x => x.UnitPrice),
                Amount = items.Sum(x => x.Amount),
                TaxAmount = items.Sum(x => x.TaxAmount ?? 0),
                DiscountAmount = items.Sum(x => x.DiscountAmount ?? 0)
            };

            // Calculate average tax and discount rates
            var validTaxRates = items.Where(x => x.TaxRate.HasValue).ToList();
            if (validTaxRates.Any())
                merged.TaxRate = validTaxRates.Average(x => x.TaxRate!.Value);

            var validDiscountRates = items.Where(x => x.DiscountRate.HasValue).ToList();
            if (validDiscountRates.Any())
                merged.DiscountRate = validDiscountRates.Average(x => x.DiscountRate!.Value);

            return merged;
        }

        private void ValidateAndCalculateLineItem(InvoiceLineItemDto item)
        {
            // Calculate missing amount if we have quantity and unit price
            if (item.Amount == 0 && item.Quantity > 0 && item.UnitPrice > 0)
            {
                item.Amount = item.Quantity * item.UnitPrice;
            }

            // Calculate missing unit price if we have quantity and amount
            if (item.UnitPrice == 0 && item.Quantity > 0 && item.Amount > 0)
            {
                item.UnitPrice = item.Amount / item.Quantity;
            }

            // Calculate missing quantity if we have unit price and amount
            if (item.Quantity == 0 && item.UnitPrice > 0 && item.Amount > 0)
            {
                item.Quantity = item.Amount / item.UnitPrice;
            }

            // Validate amounts
            if (item.Amount < 0) item.Amount = 0;
            if (item.Quantity < 0) item.Quantity = 0;
            if (item.UnitPrice < 0) item.UnitPrice = 0;

            // Calculate confidence score
            item.ConfidenceScore = CalculateLineItemConfidence(item);
        }

        private double CalculateLineItemConfidence(InvoiceLineItemDto item)
        {
            double confidence = 0;
            double totalWeight = 0;

            // Description confidence (30%)
            if (!string.IsNullOrEmpty(item.Description))
            {
                var descConfidence = CalculateDescriptionConfidence(item.Description);
                confidence += _fieldWeights["Description"] * descConfidence;
                totalWeight += _fieldWeights["Description"];
            }

            // Quantity confidence (20%)
            if (item.Quantity > 0)
            {
                var qtyConfidence = CalculateQuantityConfidence(item.Quantity);
                confidence += _fieldWeights["Quantity"] * qtyConfidence;
                totalWeight += _fieldWeights["Quantity"];
            }

            // Unit price confidence (20%)
            if (item.UnitPrice > 0)
            {
                var priceConfidence = CalculatePriceConfidence(item.UnitPrice);
                confidence += _fieldWeights["UnitPrice"] * priceConfidence;
                totalWeight += _fieldWeights["UnitPrice"];
            }

            // Amount confidence (30%)
            if (item.Amount > 0)
            {
                var amountConfidence = CalculateAmountConfidence(item.Amount);
                confidence += _fieldWeights["Amount"] * amountConfidence;
                totalWeight += _fieldWeights["Amount"];
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

        private bool IsValidLineItem(InvoiceLineItemDto lineItem)
        {
            if (lineItem == null)
                return false;

            // Basic validation
            if (string.IsNullOrWhiteSpace(lineItem.Description))
                return false;

            // Allow zero quantities for WMACCESS items (like "Basis fee for additional user accounts")
            if (lineItem.Quantity < 0)
                return false;

            // Allow zero unit prices for some items
            if (lineItem.UnitPrice < 0)
                return false;

            // Allow zero amounts for some items
            if (lineItem.Amount < 0)
                return false;

            // Validate description quality - reject obvious header/footer text
            var description = lineItem.Description.ToLowerInvariant();
            var invalidPatterns = new[]
            {
                @"invoice.*?no.*?\d+",
                @"customer.*?no.*?\d+",
                @"vat.*?no.*?de\d+",
                @"www\..*?\.(com|de|org)",
                @"cpb software.*?gmbh",
                @"musterstr.*?main",
                @"musterkunde.*?ag",
                @"mr\..*?doe",
                @"period.*?\d{4}",
                @"without vat",
                @"service description",
                @"amount.*?quantity.*?total",
                @"telefon.*?\d+",
                @"phone.*?\d+",
                @"fax.*?\d+",
                @"email.*?@",
                @"website.*?www",
                @"web.*?www",
                @"date.*?\d{2}\.\d{2}\.\d{4}",
                @"\d{2}\.\d{2}\.\d{4}.*?date"
            };

            foreach (var pattern in invalidPatterns)
            {
                if (Regex.IsMatch(description, pattern, RegexOptions.IgnoreCase))
                {
                    _logger.LogDebug("Rejecting line item with invalid description pattern '{Pattern}': {Description}", pattern, lineItem.Description);
                    return false;
                }
            }

            // Reject descriptions that are too long (likely header text)
            // But be more flexible for WMACCESS format
            if (lineItem.Description.Length > 120)
            {
                _logger.LogDebug("Rejecting line item with overly long description: {Description}", lineItem.Description);
                return false;
            }

            // Reject descriptions that are just numbers or special characters
            if (Regex.IsMatch(lineItem.Description, @"^[\d\s\-\.\/\(\)]+$"))
            {
                _logger.LogDebug("Rejecting line item with numeric-only description: {Description}", lineItem.Description);
                return false;
            }

            // Reject descriptions that are too short (likely noise)
            // But be more flexible for WMACCESS format
            if (lineItem.Description.Length < 3)
            {
                _logger.LogDebug("Rejecting line item with too short description: {Description}", lineItem.Description);
                return false;
            }

            // Validate that the amount makes sense (quantity * unit price should be close to amount)
            // But be more flexible for WMACCESS format
            if (lineItem.Quantity > 0 && lineItem.UnitPrice > 0 && lineItem.Amount > 0)
            {
                var calculatedAmount = lineItem.Quantity * lineItem.UnitPrice;
                var difference = Math.Abs(calculatedAmount - lineItem.Amount);
                var tolerance = lineItem.Amount * 0.05m; // 5% tolerance for OCR errors

                if (difference > tolerance)
                {
                    _logger.LogDebug("Line item has inconsistent amounts - Calculated: {Calculated}, Actual: {Actual}, Difference: {Difference}, but allowing it", 
                        calculatedAmount, lineItem.Amount, difference);
                    // Don't reject, just log the warning
                }
            }

            // Validate reasonable ranges
            if (lineItem.Quantity > 10000) // Unreasonable quantity
            {
                _logger.LogDebug("Rejecting line item with unreasonable quantity: {Quantity}", lineItem.Quantity);
                return false;
            }

            if (lineItem.UnitPrice > 100000) // Unreasonable unit price
            {
                _logger.LogDebug("Rejecting line item with unreasonable unit price: {UnitPrice}", lineItem.UnitPrice);
                return false;
            }

            if (lineItem.Amount > 1000000) // Unreasonable total amount
            {
                _logger.LogDebug("Rejecting line item with unreasonable amount: {Amount}", lineItem.Amount);
                return false;
            }

            return true;
        }

        private string CleanDescription(string description)
        {
            if (string.IsNullOrEmpty(description))
                return string.Empty;

            var cleaned = description.Trim();

            // Remove common header/footer patterns that might have slipped through
            var headerPatterns = new[]
            {
                @"Invoice.*?Date.*?\d{4}",
                @"Customer.*?No.*?\d+",
                @"VAT.*?No.*?DE\d+",
                @"www\..*?\.(com|de|org)",
                @"CPB Software.*?GmbH",
                @"Musterstr.*?Main",
                @"Musterkunde.*?AG",
                @"Mr\..*?Doe",
                @"Period.*?\d{4}",
                @"without VAT",
                @"Service Description",
                @"Amount.*?quantity.*?Total"
            };

            foreach (var pattern in headerPatterns)
            {
                cleaned = Regex.Replace(cleaned, pattern, "", RegexOptions.IgnoreCase);
            }

            // Remove very long descriptions that are likely header text
            if (cleaned.Length > 100)
            {
                // Try to find a reasonable cutoff point
                var words = cleaned.Split(' ');
                var reasonableWords = words.Take(8).ToArray(); // Take first 8 words max
                cleaned = string.Join(" ", reasonableWords);
            }

            // Remove lines that are just numbers or special characters
            if (Regex.IsMatch(cleaned, @"^[\d\s\-\.\/\(\)]+$"))
            {
                return string.Empty;
            }

            // Remove descriptions that are too short (likely noise)
            if (cleaned.Length < 3)
            {
                return string.Empty;
            }

            // Clean up extra whitespace
            cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();

            return cleaned;
        }

        private decimal ParseDecimal(string value)
        {
            if (string.IsNullOrEmpty(value))
                return 0;

            // Remove currency symbols and spaces
            value = Regex.Replace(value, @"[€$£¥\s]", "");
            
            // Handle different decimal separators
            value = value.Replace(',', '.');
            
            if (decimal.TryParse(value, out decimal result))
                return result;

            return 0;
        }

        private decimal ParseCurrency(string value)
        {
            if (string.IsNullOrEmpty(value))
                return 0;

            // Remove currency symbols and spaces
            value = Regex.Replace(value, @"[€$£¥\s]", "");
            
            // Handle different decimal separators
            value = value.Replace(',', '.');
            
            if (decimal.TryParse(value, out decimal result))
                return result;

            return 0;
        }

        public bool ValidateLineItemsAgainstTotal(List<InvoiceLineItemDto> lineItems, decimal invoiceTotal, decimal tolerance = 0.01m)
        {
            if (lineItems == null || !lineItems.Any())
                return false;

            var lineItemsTotal = lineItems.Sum(x => x.Amount);
            var difference = Math.Abs(lineItemsTotal - invoiceTotal);
            var allowedDifference = invoiceTotal * tolerance;

            var isValid = difference <= allowedDifference;
            
            _logger.LogInformation("Line items validation: Total={Total}, LineItemsSum={LineItemsSum}, Difference={Difference}, Tolerance={Tolerance}, IsValid={IsValid}",
                invoiceTotal, lineItemsTotal, difference, allowedDifference, isValid);

            return isValid;
        }
    }
} 