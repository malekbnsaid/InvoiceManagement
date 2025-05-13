namespace InvoiceManagement.Server.Domain.Entities
{
    public class SystemSetting : BaseEntity
    {
        public string Key { get; set; }
        public string Value { get; set; }
        public string Description { get; set; }
        public string Group { get; set; }
        public bool IsSecure { get; set; }
        public bool IsReadOnly { get; set; }
        public string DataType { get; set; } // "string", "int", "bool", "datetime", etc.
    }
} 
/*Added System Settings Entity:
 Centralized configuration management
 Type-safe settings with validation
Grouping of related settings
Security flags for sensitive information*/