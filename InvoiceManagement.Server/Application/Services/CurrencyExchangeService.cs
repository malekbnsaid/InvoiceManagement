using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Application.Services
{
    public interface ICurrencyExchangeService
    {
        decimal ConvertToQAR(decimal amount, CurrencyType fromCurrency);
        decimal ConvertFromQAR(decimal amount, CurrencyType toCurrency);
        decimal GetExchangeRate(CurrencyType fromCurrency, CurrencyType toCurrency);
    }

    public class CurrencyExchangeService : ICurrencyExchangeService
    {
        private readonly ILogger<CurrencyExchangeService> _logger;
        
        // Simple hardcoded exchange rates - in production, these should come from an external API
        private readonly Dictionary<(CurrencyType from, CurrencyType to), decimal> _exchangeRates = new()
        {
            // QAR as base currency
            [(CurrencyType.USD, CurrencyType.QAR)] = 3.65m,  // 1 USD = 3.65 QAR
            [(CurrencyType.EUR, CurrencyType.QAR)] = 4.00m,  // 1 EUR = 4.00 QAR
            [(CurrencyType.GBP, CurrencyType.QAR)] = 4.60m,  // 1 GBP = 4.60 QAR
            [(CurrencyType.QAR, CurrencyType.QAR)] = 1.00m,  // 1 QAR = 1.00 QAR
            
            // Reverse rates
            [(CurrencyType.QAR, CurrencyType.USD)] = 0.274m, // 1 QAR = 0.274 USD
            [(CurrencyType.QAR, CurrencyType.EUR)] = 0.25m,  // 1 QAR = 0.25 EUR
            [(CurrencyType.QAR, CurrencyType.GBP)] = 0.217m, // 1 QAR = 0.217 GBP
        };

        public CurrencyExchangeService(ILogger<CurrencyExchangeService> logger)
        {
            _logger = logger;
        }

        public decimal ConvertToQAR(decimal amount, CurrencyType fromCurrency)
        {
            if (fromCurrency == CurrencyType.QAR)
                return amount;

            var rate = GetExchangeRate(fromCurrency, CurrencyType.QAR);
            var convertedAmount = amount * rate;
            
            _logger.LogInformation("Converted {Amount} {FromCurrency} to {ConvertedAmount} QAR (rate: {Rate})", 
                amount, fromCurrency, convertedAmount, rate);
            
            return convertedAmount;
        }

        public decimal ConvertFromQAR(decimal amount, CurrencyType toCurrency)
        {
            if (toCurrency == CurrencyType.QAR)
                return amount;

            var rate = GetExchangeRate(CurrencyType.QAR, toCurrency);
            var convertedAmount = amount * rate;
            
            _logger.LogInformation("Converted {Amount} QAR to {ConvertedAmount} {ToCurrency} (rate: {Rate})", 
                amount, convertedAmount, toCurrency, rate);
            
            return convertedAmount;
        }

        public decimal GetExchangeRate(CurrencyType fromCurrency, CurrencyType toCurrency)
        {
            if (fromCurrency == toCurrency)
                return 1.0m;

            if (_exchangeRates.TryGetValue((fromCurrency, toCurrency), out var rate))
            {
                return rate;
            }

            _logger.LogWarning("Exchange rate not found for {FromCurrency} to {ToCurrency}, using 1.0", 
                fromCurrency, toCurrency);
            return 1.0m;
        }
    }
}
