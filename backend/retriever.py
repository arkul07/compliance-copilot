from typing import List, Tuple
from .pathway_pipeline import hybrid_search

KEYWORDS = {
    "privacy": ["gdpr", "personal data", "processing", "controller", "processor"],
    "labor":   ["notice", "termination", "employment", "working hours"],
    "tax":     ["withholding", "tax", "vat", "gst"],
}

# Region-specific keywords to ensure proper jurisdiction matching
REGION_KEYWORDS = {
    "EU": ["eu", "european", "gdpr", "directive", "regulation"],
    "US": ["us", "united states", "california", "ccpa", "federal", "state"],
    "IN": ["india", "indian", "gst", "companies act"],
    "UK": ["uk", "united kingdom", "british", "employment act"]
}

def retrieve(category: str, region: str, top_k: int = 3) -> List[Tuple[str, float]]:
    """Retrieve compliance rules for specific category and region"""
    words = KEYWORDS.get(category, [])
    region_words = REGION_KEYWORDS.get(region.upper(), [])
    
    # Combine category and region keywords for precise matching
    query = " ".join(words + region_words) if words else ""
    
    # Search with region-specific context - get more results to ensure we find region-specific rules
    results = hybrid_search(query, top_k=top_k * 3)  # Get more results to filter
    
    # Filter results to ensure they match the region
    filtered_results = []
    for rule_text, score in results:
        # Check if the rule text contains region-specific indicators
        if _is_rule_for_region(rule_text, region):
            filtered_results.append((rule_text, score))
    
    # If no region-specific results found, try a more specific search
    if not filtered_results:
        if region.upper() == "IN":
            # Try searching specifically for Indian rules
            indian_query = f"{category} india indian"
            indian_results = hybrid_search(indian_query, top_k=top_k)
            for rule_text, score in indian_results:
                if _is_rule_for_region(rule_text, region):
                    filtered_results.append((rule_text, score))
        elif region.upper() == "US":
            # Try searching specifically for US rules
            us_query = f"consumer rights under ccpa"
            us_results = hybrid_search(us_query, top_k=top_k)
            for rule_text, score in us_results:
                if _is_rule_for_region(rule_text, region):
                    filtered_results.append((rule_text, score))
        elif region.upper() == "EU":
            # Try searching specifically for EU rules
            eu_query = f"{category} eu gdpr european"
            eu_results = hybrid_search(eu_query, top_k=top_k)
            for rule_text, score in eu_results:
                if _is_rule_for_region(rule_text, region):
                    filtered_results.append((rule_text, score))
    
    return filtered_results[:top_k]

def _is_rule_for_region(rule_text: str, region: str) -> bool:
    """Check if a rule is applicable to the specified region"""
    rule_lower = rule_text.lower()
    region_upper = region.upper()
    
    # Define region-specific keywords
    region_keywords = {
        "EU": ["eu", "european", "directive", "gdpr", "european union"],
        "US": ["us", "united states", "california", "ccpa", "federal", "american"],
        "IN": ["india", "indian", "gst", "companies act"],
        "UK": ["uk", "united kingdom", "british", "employment act"]
    }
    
    # Get target region keywords
    target_keywords = region_keywords.get(region_upper, [])
    if not target_keywords:
        return True
    
    # Check if rule contains target region keywords
    has_target_region = any(keyword in rule_lower for keyword in target_keywords)
    
    # For US region, prioritize US-specific rules and exclude pure EU rules
    if region_upper == "US":
        us_specific_keywords = ["ccpa", "california", "federal", "american", "united states"]
        has_us_specific = any(keyword in rule_lower for keyword in us_specific_keywords)
        
        # If it has US-specific terms, it's good
        if has_us_specific:
            return True
        
        # If it's primarily EU (GDPR) without US context, exclude it
        # Check for strong EU indicators
        eu_strong_indicators = ["eu gdpr", "european gdpr", "gdpr regulation", "eu directive"]
        is_eu_primary = any(keyword in rule_lower for keyword in eu_strong_indicators)
        
        # Count mentions for analysis
        gdpr_mentions = rule_lower.count("gdpr")
        ccpa_mentions = rule_lower.count("ccpa")
        california_mentions = rule_lower.count("california")
        federal_mentions = rule_lower.count("federal")
        
        # If it's clearly EU (GDPR) without any US privacy context, exclude it
        if is_eu_primary or (gdpr_mentions > 0 and ccpa_mentions == 0 and california_mentions == 0 and federal_mentions == 0):
            return False
    
    # For EU region, prioritize EU-specific rules and exclude pure US rules
    elif region_upper == "EU":
        eu_specific_keywords = ["eu", "european", "gdpr", "directive"]
        has_eu_specific = any(keyword in rule_lower for keyword in eu_specific_keywords)
        
        # If it has EU-specific terms, it's good
        if has_eu_specific:
            return True
        
        # If it's primarily US (CCPA) without EU context, exclude it
        us_primary_keywords = ["ccpa california", "us federal", "american law"]
        is_us_primary = any(keyword in rule_lower for keyword in us_primary_keywords)
        if is_us_primary:
            return False
    
    return has_target_region