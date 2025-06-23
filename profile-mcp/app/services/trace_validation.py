import json
import pandas as pd
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from io import StringIO, BytesIO
import csv

@dataclass
class ValidationResult:
    """Result of trace file validation."""
    quality_score: float
    trace_count: int
    errors: List[str]
    warnings: List[str]
    
    @property
    def errors_json(self) -> Optional[str]:
        """Get errors and warnings as JSON string."""
        if not self.errors and not self.warnings:
            return None
        return json.dumps({
            "errors": self.errors,
            "warnings": self.warnings
        })

class TraceValidationService:
    """Service for validating uploaded trace files."""
    
    REQUIRED_FIELDS = ["conversation_id", "role", "content"]
    OPTIONAL_FIELDS = ["timestamp", "user_id", "model", "tokens", "metadata"]
    VALID_ROLES = ["user", "assistant", "system"]
    
    async def validate_trace_content(self, content: bytes, mime_type: str) -> ValidationResult:
        """Validate trace file content and return quality score."""
        
        errors = []
        warnings = []
        trace_count = 0
        quality_score = 0.0
        
        try:
            # Parse content based on MIME type
            if mime_type in ["text/csv", "text/plain"]:
                traces = await self._parse_csv_content(content)
            elif mime_type == "application/json":
                traces = await self._parse_json_content(content)
            else:
                errors.append(f"Unsupported file type: {mime_type}")
                return ValidationResult(0.0, 0, errors, warnings)
            
            if not traces:
                errors.append("No valid traces found in file")
                return ValidationResult(0.0, 0, errors, warnings)
            
            trace_count = len(traces)
            
            # Validate trace structure and content
            quality_metrics = await self._validate_traces(traces)
            errors.extend(quality_metrics["errors"])
            warnings.extend(quality_metrics["warnings"])
            
            # Calculate quality score (0-100)
            quality_score = await self._calculate_quality_score(traces, quality_metrics)
            
        except Exception as e:
            errors.append(f"Failed to process file: {str(e)}")
            return ValidationResult(0.0, 0, errors, warnings)
        
        return ValidationResult(quality_score, trace_count, errors, warnings)
    
    async def _parse_csv_content(self, content: bytes) -> List[Dict[str, Any]]:
        """Parse CSV content into trace records."""
        try:
            # Decode bytes to string
            text_content = content.decode('utf-8')
            
            # Use pandas to read CSV
            df = pd.read_csv(StringIO(text_content))
            
            # Convert to list of dictionaries
            traces = df.to_dict('records')
            
            # Clean up NaN values
            for trace in traces:
                for key, value in trace.items():
                    if pd.isna(value):
                        trace[key] = None
            
            return traces
            
        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {str(e)}")
    
    async def _parse_json_content(self, content: bytes) -> List[Dict[str, Any]]:
        """Parse JSON content into trace records."""
        try:
            # Decode bytes to string
            text_content = content.decode('utf-8')
            
            # Parse JSON
            data = json.loads(text_content)
            
            # Handle different JSON structures
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                # If it's a single object, wrap in list
                if "conversation_id" in data or "role" in data:
                    return [data]
                # If it has a traces key, use that
                elif "traces" in data:
                    return data["traces"]
                else:
                    raise ValueError("JSON structure not recognized")
            else:
                raise ValueError("JSON must be an object or array")
                
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to parse JSON: {str(e)}")
    
    async def _validate_traces(self, traces: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Validate trace structure and content quality."""
        errors = []
        warnings = []
        
        for i, trace in enumerate(traces):
            trace_prefix = f"Trace {i+1}:"
            
            # Check required fields
            for field in self.REQUIRED_FIELDS:
                if field not in trace or trace[field] is None or trace[field] == "":
                    errors.append(f"{trace_prefix} Missing required field '{field}'")
            
            # Validate role values
            if "role" in trace and trace["role"] not in self.VALID_ROLES:
                errors.append(f"{trace_prefix} Invalid role '{trace['role']}', must be one of {self.VALID_ROLES}")
            
            # Check content length
            if "content" in trace and trace["content"]:
                content_length = len(str(trace["content"]))
                if content_length < 5:
                    warnings.append(f"{trace_prefix} Very short content ({content_length} chars)")
                elif content_length > 10000:
                    warnings.append(f"{trace_prefix} Very long content ({content_length} chars)")
            
            # Check for conversation_id consistency
            if "conversation_id" in trace and not trace["conversation_id"]:
                warnings.append(f"{trace_prefix} Empty conversation_id")
        
        return {"errors": errors, "warnings": warnings}
    
    async def _calculate_quality_score(self, traces: List[Dict[str, Any]], quality_metrics: Dict[str, List[str]]) -> float:
        """Calculate overall quality score from 0 to 100."""
        
        total_traces = len(traces)
        if total_traces == 0:
            return 0.0
        
        # Base score
        base_score = 60.0
        
        # Penalize for errors (each error reduces score)
        error_penalty = len(quality_metrics["errors"]) * 10
        
        # Minor penalty for warnings
        warning_penalty = len(quality_metrics["warnings"]) * 2
        
        # Bonus for good structure
        structure_bonus = 0.0
        
        # Check for optional fields presence
        optional_field_count = 0
        for trace in traces:
            for field in self.OPTIONAL_FIELDS:
                if field in trace and trace[field] is not None:
                    optional_field_count += 1
        
        # Bonus for having optional fields (up to 20 points)
        if total_traces > 0:
            optional_field_ratio = optional_field_count / (total_traces * len(self.OPTIONAL_FIELDS))
            structure_bonus = optional_field_ratio * 20
        
        # Conversation flow bonus (up to 10 points)
        conversation_bonus = 0.0
        conversation_ids = set()
        role_transitions = 0
        
        for trace in traces:
            if "conversation_id" in trace and trace["conversation_id"]:
                conversation_ids.add(trace["conversation_id"])
        
        # Check for proper conversation flow
        conversations = {}
        for trace in traces:
            conv_id = trace.get("conversation_id", "unknown")
            if conv_id not in conversations:
                conversations[conv_id] = []
            conversations[conv_id].append(trace.get("role", "unknown"))
        
        # Bonus for conversations with user-assistant exchanges
        good_conversations = 0
        for conv_id, roles in conversations.items():
            if "user" in roles and "assistant" in roles:
                good_conversations += 1
        
        if len(conversations) > 0:
            conversation_bonus = (good_conversations / len(conversations)) * 10
        
        # Calculate final score
        final_score = base_score + structure_bonus + conversation_bonus - error_penalty - warning_penalty
        
        # Ensure score is between 0 and 100
        final_score = max(0.0, min(100.0, final_score))
        
        return round(final_score, 1)