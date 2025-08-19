using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Globalization;
using Microsoft.Extensions.Logging;

namespace InvoiceManagement.Server.Application.Services.OCR
{
    public class DateExtractionService
    {
        private readonly ILogger<DateExtractionService> _logger;
        private readonly List<(string Pattern, string Format)> _datePatterns;

        public DateExtractionService(ILogger<DateExtractionService> logger)
        {
            _logger = logger;
            _datePatterns = new List<(string Pattern, string Format)>
            {
                // Standard formats
                (@"\b\d{4}-\d{2}-\d{2}\b", "yyyy-MM-dd"),
                (@"\b\d{2}/\d{2}/\d{4}\b", "dd/MM/yyyy"),
                (@"\b\d{2}-\d{2}-\d{4}\b", "dd-MM-yyyy"),
                (@"\b\d{2}\.\d{2}\.\d{4}\b", "dd.MM.yyyy"),
                
                // Month name formats
                (@"\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b", "d MMMM yyyy"),
                (@"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b", "MMMM d, yyyy"),
                (@"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b", "MMM d, yyyy"),
                
                // Short year formats
                (@"\b\d{2}/\d{2}/\d{2}\b", "dd/MM/yy"),
                (@"\b\d{2}-\d{2}-\d{2}\b", "dd-MM-yy"),
                
                // Special formats
                (@"\b\d{8}\b", "yyyyMMdd"), // YYYYMMDD
                (@"\b\d{1,2}/\d{1,2}/\d{4}\b", "M/d/yyyy"), // Flexible day/month
                (@"\b\d{4}/\d{1,2}/\d{1,2}\b", "yyyy/M/d"), // Japanese format
            };
        }

        public DateTime? ExtractDate(string text, string context = "")
        {
            if (string.IsNullOrEmpty(text))
                return null;

            _logger.LogInformation("Attempting to extract date from text with context: {Context}", context);

            // First, try to find dates near context keywords
            if (!string.IsNullOrEmpty(context))
            {
                var contextualDate = ExtractDateNearContext(text, context);
                if (contextualDate.HasValue)
                {
                    _logger.LogInformation("Found date {Date} near context {Context}", contextualDate, context);
                    return contextualDate;
                }
            }

            // Try all patterns
            foreach (var (pattern, format) in _datePatterns)
            {
                var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    var dateStr = match.Value;
                    if (TryParseDate(dateStr, format, out var date))
                    {
                        _logger.LogInformation("Successfully parsed date {Date} using pattern {Pattern}", date, pattern);
                        return date;
                    }
                }
            }

            // Try natural language processing
            var nlpDate = ExtractNaturalLanguageDate(text);
            if (nlpDate.HasValue)
            {
                _logger.LogInformation("Extracted date {Date} using natural language processing", nlpDate);
                return nlpDate;
            }

            _logger.LogWarning("No valid date found in text");
            return null;
        }

        private DateTime? ExtractDateNearContext(string text, string context)
        {
            // Look for dates within 50 characters of the context
            var contextPattern = $@"(?:{context}[^\n]{{0,50}})|([^\n]{{0,50}}{context})";
            var contextMatch = Regex.Match(text, contextPattern, RegexOptions.IgnoreCase);
            
            if (contextMatch.Success)
            {
                var contextText = contextMatch.Value;
                foreach (var (pattern, format) in _datePatterns)
                {
                    var match = Regex.Match(contextText, pattern, RegexOptions.IgnoreCase);
                    if (match.Success && TryParseDate(match.Value, format, out var date))
                    {
                        return date;
                    }
                }
            }

            return null;
        }

        private bool TryParseDate(string dateStr, string format, out DateTime result)
        {
            // Try with invariant culture first
            if (DateTime.TryParseExact(dateStr, format, CultureInfo.InvariantCulture, 
                DateTimeStyles.None, out result))
            {
                return ValidateExtractedDate(result);
            }

            // Try with common cultures
            var cultures = new[] { "en-US", "en-GB", "fr-FR", "de-DE", "es-ES", "ar-SA" };
            foreach (var cultureName in cultures)
            {
                try
                {
                    var culture = CultureInfo.GetCultureInfo(cultureName);
                    if (DateTime.TryParseExact(dateStr, format, culture, 
                        DateTimeStyles.None, out result))
                    {
                        return ValidateExtractedDate(result);
                    }
                }
                catch (CultureNotFoundException)
                {
                    continue;
                }
            }

            result = DateTime.MinValue;
            return false;
        }

        private bool ValidateExtractedDate(DateTime date)
        {
            // Validate year is reasonable (not too old or future)
            var currentYear = DateTime.UtcNow.Year;
            if (date.Year < currentYear - 10 || date.Year > currentYear + 1)
                return false;

            return true;
        }

        private DateTime? ExtractNaturalLanguageDate(string text)
        {
            // Common natural language date patterns
            var patterns = new Dictionary<string, Func<Match, DateTime?>>
            {
                // "Today", "Yesterday", etc.
                {@"\b(?:today|yesterday|tomorrow)\b", match =>
                {
                    return match.Value.ToLower() switch
                    {
                        "today" => DateTime.UtcNow.Date,
                        "yesterday" => DateTime.UtcNow.Date.AddDays(-1),
                        "tomorrow" => DateTime.UtcNow.Date.AddDays(1),
                        _ => null
                    };
                }},

                // "X days ago"
                {@"\b(\d+)\s+days?\s+ago\b", match =>
                {
                    if (int.TryParse(match.Groups[1].Value, out var days))
                        return DateTime.UtcNow.Date.AddDays(-days);
                    return null;
                }},

                // "Last month", "Next month"
                {@"\b(?:last|next)\s+month\b", match =>
                {
                    return match.Value.StartsWith("last", StringComparison.OrdinalIgnoreCase)
                        ? DateTime.UtcNow.Date.AddMonths(-1)
                        : DateTime.UtcNow.Date.AddMonths(1);
                }},

                // "End of month", "Beginning of month"
                {@"\b(?:end|beginning)\s+of\s+month\b", match =>
                {
                    var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                    return match.Value.StartsWith("end", StringComparison.OrdinalIgnoreCase)
                        ? currentMonth.AddMonths(1).AddDays(-1)
                        : currentMonth;
                }}
            };

            foreach (var pattern in patterns)
            {
                var match = Regex.Match(text, pattern.Key, RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    var date = pattern.Value(match);
                    if (date.HasValue)
                    {
                        _logger.LogInformation("Extracted natural language date: {Date} from pattern: {Pattern}", 
                            date, pattern.Key);
                        return date;
                    }
                }
            }

            return null;
        }
    }
} 