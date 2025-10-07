import { CurrencyType } from '../types/enums';

export const formatCurrency = (amount: number, currency?: CurrencyType): string => {
    const currencyMap: { [key in CurrencyType]: { locale: string, currency: string } } = {
        [CurrencyType.USD]: { locale: 'en-US', currency: 'USD' },
        [CurrencyType.EUR]: { locale: 'en-US', currency: 'EUR' },
        [CurrencyType.GBP]: { locale: 'en-US', currency: 'GBP' },
        [CurrencyType.AED]: { locale: 'en-US', currency: 'AED' },
        [CurrencyType.SAR]: { locale: 'en-US', currency: 'SAR' },
        [CurrencyType.QAR]: { locale: 'en-US', currency: 'QAR' },
        [CurrencyType.KWD]: { locale: 'en-US', currency: 'KWD' },
        [CurrencyType.BHD]: { locale: 'en-US', currency: 'BHD' },
        [CurrencyType.OMR]: { locale: 'en-US', currency: 'OMR' },
        [CurrencyType.JPY]: { locale: 'en-US', currency: 'JPY' }
    };

    const { locale, currency: currencyCode } = currency && currency in currencyMap
        ? currencyMap[currency]
        : currencyMap[CurrencyType.USD];

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode
    }).format(amount);
}; 