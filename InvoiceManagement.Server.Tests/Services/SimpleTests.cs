using Xunit;
using InvoiceManagement.Server.Domain.Enums;

namespace InvoiceManagement.Server.Tests.Services
{
    public class SimpleTests
    {
        [Fact]
        public void InvoiceStatus_ShouldHaveCorrectValues()
        {
            // Arrange & Act
            var submitted = InvoiceStatus.Submitted;
            var underReview = InvoiceStatus.UnderReview;
            var approved = InvoiceStatus.Approved;
            var inProgress = InvoiceStatus.InProgress;
            var pmoReview = InvoiceStatus.PMOReview;
            var completed = InvoiceStatus.Completed;
            var rejected = InvoiceStatus.Rejected;
            var cancelled = InvoiceStatus.Cancelled;
            var onHold = InvoiceStatus.OnHold;

            // Assert
            Assert.Equal(0, (int)submitted);
            Assert.Equal(1, (int)underReview);
            Assert.Equal(2, (int)approved);
            Assert.Equal(3, (int)inProgress);
            Assert.Equal(4, (int)pmoReview);
            Assert.Equal(5, (int)completed);
            Assert.Equal(6, (int)rejected);
            Assert.Equal(7, (int)cancelled);
            Assert.Equal(8, (int)onHold);
        }

        [Fact]
        public void CurrencyType_ShouldHaveCorrectValues()
        {
            // Arrange & Act
            var usd = CurrencyType.USD;
            var eur = CurrencyType.EUR;
            var gbp = CurrencyType.GBP;
            var aed = CurrencyType.AED;
            var sar = CurrencyType.SAR;

            // Assert
            Assert.Equal("USD", usd.ToString());
            Assert.Equal("EUR", eur.ToString());
            Assert.Equal("GBP", gbp.ToString());
            Assert.Equal("AED", aed.ToString());
            Assert.Equal("SAR", sar.ToString());
        }

        [Fact]
        public void UserRole_ShouldHaveCorrectValues()
        {
            // Arrange & Act
            var admin = UserRole.Admin;
            var head = UserRole.Head;
            var pmo = UserRole.PMO;
            var pm = UserRole.PM;
            var secretary = UserRole.Secretary;
            var readOnly = UserRole.ReadOnly;

            // Assert
            Assert.Equal("Admin", admin.ToString());
            Assert.Equal("Head", head.ToString());
            Assert.Equal("PMO", pmo.ToString());
            Assert.Equal("PM", pm.ToString());
            Assert.Equal("Secretary", secretary.ToString());
            Assert.Equal("ReadOnly", readOnly.ToString());
        }

        [Theory]
        [InlineData(InvoiceStatus.Submitted, "Submitted")]
        [InlineData(InvoiceStatus.UnderReview, "UnderReview")]
        [InlineData(InvoiceStatus.Approved, "Approved")]
        [InlineData(InvoiceStatus.InProgress, "InProgress")]
        [InlineData(InvoiceStatus.PMOReview, "PMOReview")]
        [InlineData(InvoiceStatus.Completed, "Completed")]
        [InlineData(InvoiceStatus.Rejected, "Rejected")]
        [InlineData(InvoiceStatus.Cancelled, "Cancelled")]
        [InlineData(InvoiceStatus.OnHold, "OnHold")]
        public void InvoiceStatus_ToString_ShouldReturnCorrectString(InvoiceStatus status, string expected)
        {
            // Act
            var result = status.ToString();

            // Assert
            Assert.Equal(expected, result);
        }

        [Theory]
        [InlineData(CurrencyType.USD, "USD")]
        [InlineData(CurrencyType.EUR, "EUR")]
        [InlineData(CurrencyType.GBP, "GBP")]
        [InlineData(CurrencyType.AED, "AED")]
        [InlineData(CurrencyType.SAR, "SAR")]
        [InlineData(CurrencyType.KWD, "KWD")]
        [InlineData(CurrencyType.BHD, "BHD")]
        [InlineData(CurrencyType.OMR, "OMR")]
        [InlineData(CurrencyType.QAR, "QAR")]
        [InlineData(CurrencyType.JPY, "JPY")]
        public void CurrencyType_ToString_ShouldReturnCorrectString(CurrencyType currency, string expected)
        {
            // Act
            var result = currency.ToString();

            // Assert
            Assert.Equal(expected, result);
        }

        [Fact]
        public void Math_Addition_ShouldWork()
        {
            // Arrange
            var a = 5;
            var b = 3;

            // Act
            var result = a + b;

            // Assert
            Assert.Equal(8, result);
        }

        [Fact]
        public void String_Concatenation_ShouldWork()
        {
            // Arrange
            var firstName = "John";
            var lastName = "Doe";

            // Act
            var result = firstName + " " + lastName;

            // Assert
            Assert.Equal("John Doe", result);
        }

        [Fact]
        public void DateTime_ShouldWork()
        {
            // Arrange
            var now = DateTime.UtcNow;

            // Act & Assert
            Assert.True(now > DateTime.MinValue);
            Assert.True(now < DateTime.MaxValue);
        }

        [Fact]
        public void List_Operations_ShouldWork()
        {
            // Arrange
            var numbers = new List<int> { 1, 2, 3, 4, 5 };

            // Act
            var count = numbers.Count;
            var sum = numbers.Sum();
            var first = numbers.First();
            var last = numbers.Last();

            // Assert
            Assert.Equal(5, count);
            Assert.Equal(15, sum);
            Assert.Equal(1, first);
            Assert.Equal(5, last);
        }

        [Fact]
        public void Boolean_Logic_ShouldWork()
        {
            // Arrange
            var isTrue = true;
            var isFalse = false;

            // Act & Assert
            Assert.True(isTrue);
            Assert.False(isFalse);
            Assert.True(isTrue && !isFalse);
            Assert.True(isTrue || isFalse);
        }
    }
}
