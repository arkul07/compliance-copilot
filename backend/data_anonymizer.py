"""
Data Anonymization Module for Compliance Copilot
Handles sensitive data anonymization to protect privacy
"""

import re
import hashlib
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class DataAnonymizer:
    """Handles anonymization of sensitive data in compliance analysis"""
    
    def __init__(self):
        # Common patterns for sensitive data
        self.patterns = {
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phone': r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
            'ssn': r'\b\d{3}-?\d{2}-?\d{4}\b',
            'credit_card': r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
            'address': r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b',
            'name': r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b',  # Basic name pattern
            'company': r'\b[A-Z][a-zA-Z\s&.,]+(?:Inc|LLC|Corp|Corporation|Company|Ltd|Limited)\b',
            'ip_address': r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
            'date_of_birth': r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
            'account_number': r'\b\d{8,12}\b'
        }
        
        # Anonymization methods
        self.anonymization_methods = {
            'hash': self._hash_value,
            'mask': self._mask_value,
            'replace': self._replace_value,
            'remove': self._remove_value
        }
    
    def anonymize_text(self, text: str, method: str = 'mask', preserve_structure: bool = True) -> str:
        """
        Anonymize sensitive data in text
        
        Args:
            text: Input text to anonymize
            method: Anonymization method ('hash', 'mask', 'replace', 'remove')
            preserve_structure: Whether to preserve the structure of the data
            
        Returns:
            Anonymized text
        """
        if not text:
            return text
            
        anonymized_text = text
        
        for data_type, pattern in self.patterns.items():
            matches = re.finditer(pattern, anonymized_text, re.IGNORECASE)
            
            # Process matches in reverse order to maintain string positions
            for match in reversed(list(matches)):
                original_value = match.group()
                anonymized_value = self._anonymize_value(original_value, data_type, method, preserve_structure)
                anonymized_text = anonymized_text[:match.start()] + anonymized_value + anonymized_text[match.end():]
        
        return anonymized_text
    
    def anonymize_field(self, field: Dict[str, Any], method: str = 'mask') -> Dict[str, Any]:
        """
        Anonymize a single field
        
        Args:
            field: Field dictionary with name, value, etc.
            method: Anonymization method
            
        Returns:
            Anonymized field
        """
        if not field or 'value' not in field:
            return field
            
        # Create a copy to avoid modifying original
        anonymized_field = field.copy()
        
        # Anonymize the value
        if isinstance(field['value'], str):
            anonymized_field['value'] = self.anonymize_text(field['value'], method)
        elif isinstance(field['value'], list):
            anonymized_field['value'] = [self.anonymize_text(str(item), method) if isinstance(item, str) else item for item in field['value']]
        
        # Add anonymization metadata
        anonymized_field['anonymized'] = True
        anonymized_field['anonymization_method'] = method
        anonymized_field['anonymization_timestamp'] = datetime.now().isoformat()
        
        return anonymized_field
    
    def anonymize_flags(self, flags: List[Dict[str, Any]], method: str = 'mask') -> List[Dict[str, Any]]:
        """
        Anonymize compliance flags
        
        Args:
            flags: List of compliance flags
            method: Anonymization method
            
        Returns:
            Anonymized flags
        """
        anonymized_flags = []
        
        for flag in flags:
            anonymized_flag = flag.copy()
            
            # Anonymize field value if present
            if 'field_value' in flag and flag['field_value']:
                anonymized_flag['field_value'] = self.anonymize_text(str(flag['field_value']), method)
            
            # Anonymize description if present
            if 'description' in flag and flag['description']:
                anonymized_flag['description'] = self.anonymize_text(flag['description'], method)
            
            # Add anonymization metadata
            anonymized_flag['anonymized'] = True
            anonymized_flag['anonymization_method'] = method
            anonymized_flag['anonymization_timestamp'] = datetime.now().isoformat()
            
            anonymized_flags.append(anonymized_flag)
        
        return anonymized_flags
    
    def anonymize_risk_correlations(self, correlations: List[Dict[str, Any]], method: str = 'mask') -> List[Dict[str, Any]]:
        """
        Anonymize risk correlations
        
        Args:
            correlations: List of risk correlations
            method: Anonymization method
            
        Returns:
            Anonymized correlations
        """
        anonymized_correlations = []
        
        for correlation in correlations:
            anonymized_correlation = correlation.copy()
            
            # Anonymize description if present
            if 'description' in correlation and correlation['description']:
                anonymized_correlation['description'] = self.anonymize_text(correlation['description'], method)
            
            # Anonymize affected sections if present
            if 'affected_sections' in correlation and correlation['affected_sections']:
                if isinstance(correlation['affected_sections'], list):
                    anonymized_correlation['affected_sections'] = [
                        self.anonymize_text(str(section), method) if isinstance(section, str) else section
                        for section in correlation['affected_sections']
                    ]
                else:
                    anonymized_correlation['affected_sections'] = self.anonymize_text(str(correlation['affected_sections']), method)
            
            # Add anonymization metadata
            anonymized_correlation['anonymized'] = True
            anonymized_correlation['anonymization_method'] = method
            anonymized_correlation['anonymization_timestamp'] = datetime.now().isoformat()
            
            anonymized_correlations.append(anonymized_correlation)
        
        return anonymized_correlations
    
    def _anonymize_value(self, value: str, data_type: str, method: str, preserve_structure: bool = True) -> str:
        """Anonymize a single value based on type and method"""
        if method not in self.anonymization_methods:
            method = 'mask'
        
        return self.anonymization_methods[method](value, data_type, preserve_structure)
    
    def _hash_value(self, value: str, data_type: str, preserve_structure: bool = True) -> str:
        """Hash the value using SHA-256"""
        hash_obj = hashlib.sha256(value.encode())
        return f"[HASHED_{data_type.upper()}_{hash_obj.hexdigest()[:8]}]"
    
    def _mask_value(self, value: str, data_type: str, preserve_structure: bool = True) -> str:
        """Mask the value while preserving structure"""
        if data_type == 'email':
            # Keep first letter and domain
            parts = value.split('@')
            if len(parts) == 2:
                return f"{parts[0][0]}***@{parts[1]}"
            return "***@***.***"
        
        elif data_type == 'phone':
            # Keep last 4 digits
            digits = re.sub(r'\D', '', value)
            if len(digits) >= 4:
                return f"***-***-{digits[-4:]}"
            return "***-***-****"
        
        elif data_type == 'ssn':
            # Keep last 4 digits
            digits = re.sub(r'\D', '', value)
            if len(digits) == 9:
                return f"***-**-{digits[-4:]}"
            return "***-**-****"
        
        elif data_type == 'credit_card':
            # Keep last 4 digits
            digits = re.sub(r'\D', '', value)
            if len(digits) >= 4:
                return f"****-****-****-{digits[-4:]}"
            return "****-****-****-****"
        
        elif data_type == 'name':
            # Keep first letter of each name
            parts = value.split()
            if len(parts) >= 2:
                return f"{parts[0][0]}. {parts[-1][0]}."
            return "***"
        
        else:
            # Generic masking
            if len(value) <= 4:
                return "*" * len(value)
            else:
                return value[:2] + "*" * (len(value) - 4) + value[-2:]
    
    def _replace_value(self, value: str, data_type: str, preserve_structure: bool = True) -> str:
        """Replace with generic placeholder"""
        placeholders = {
            'email': '[EMAIL]',
            'phone': '[PHONE]',
            'ssn': '[SSN]',
            'credit_card': '[CREDIT_CARD]',
            'address': '[ADDRESS]',
            'name': '[NAME]',
            'company': '[COMPANY]',
            'ip_address': '[IP_ADDRESS]',
            'date_of_birth': '[DOB]',
            'account_number': '[ACCOUNT_NUMBER]'
        }
        return placeholders.get(data_type, '[SENSITIVE_DATA]')
    
    def _remove_value(self, value: str, data_type: str, preserve_structure: bool = True) -> str:
        """Remove the value entirely"""
        return '[REDACTED]'
    
    def get_anonymization_summary(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get summary of anonymization applied to data
        
        Args:
            data: List of anonymized data items
            
        Returns:
            Summary of anonymization
        """
        total_items = len(data)
        anonymized_items = sum(1 for item in data if item.get('anonymized', False))
        
        methods_used = set()
        for item in data:
            if 'anonymization_method' in item:
                methods_used.add(item['anonymization_method'])
        
        return {
            'total_items': total_items,
            'anonymized_items': anonymized_items,
            'anonymization_rate': anonymized_items / total_items if total_items > 0 else 0,
            'methods_used': list(methods_used),
            'timestamp': datetime.now().isoformat()
        }

# Global anonymizer instance
anonymizer = DataAnonymizer()
