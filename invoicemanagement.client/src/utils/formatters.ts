import { CurrencyType } from '../types/enums';

export const formatCurrency = (amount: number, currency?: CurrencyType): string => {
    const currencyMap: { [key in CurrencyType]: { locale: string, currency: string } } = {
        [CurrencyType.USD]: { locale: 'en-US', currency: 'USD' },
        [CurrencyType.EUR]: { locale: 'de-DE', currency: 'EUR' },
        [CurrencyType.GBP]: { locale: 'en-GB', currency: 'GBP' },
        [CurrencyType.AED]: { locale: 'ar-AE', currency: 'AED' },
        [CurrencyType.SAR]: { locale: 'ar-SA', currency: 'SAR' },
        [CurrencyType.KWD]: { locale: 'ar-KW', currency: 'KWD' },
        [CurrencyType.BHD]: { locale: 'ar-BH', currency: 'BHD' },
        [CurrencyType.OMR]: { locale: 'ar-OM', currency: 'OMR' },
        [CurrencyType.QAR]: { locale: 'ar-QA', currency: 'QAR' },
        [CurrencyType.JPY]: { locale: 'ja-JP', currency: 'JPY' }
    };

    const { locale, currency: currencyCode } = currency && currency in currencyMap
        ? currencyMap[currency]
        : currencyMap[CurrencyType.USD];

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode
    }).format(amount);
}; 