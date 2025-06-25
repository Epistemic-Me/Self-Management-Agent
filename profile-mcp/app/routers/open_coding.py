"""
Open Coding API Router

Handles batch trace execution and systematic annotation for open coding analysis.
"""

import json
import csv
import io
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, HTTPException, status, Response
from pydantic import BaseModel
import logging

import os
from dotenv import load_dotenv

# Initialize logger
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import existing services
try:
    from app.services.openai_service import openai_service
    ai_service = openai_service
    logger.info("Successfully initialized OpenAI service for open coding")
except Exception as e:
    logger.error(f"Failed to initialize OpenAI service: {e}")
    raise RuntimeError(f"OpenAI service initialization failed: {e}")

router = APIRouter(prefix="/api/open-coding", tags=["open-coding"])

# Storage paths
TRACES_DIR = Path("traces")
ANNOTATIONS_DIR = Path("annotations") 
TRACES_DIR.mkdir(exist_ok=True)
ANNOTATIONS_DIR.mkdir(exist_ok=True)

# Data Models
class SampleQuery(BaseModel):
    id: str
    text: str

class BatchExecutionRequest(BaseModel):
    project_id: str
    system_prompt: str
    sample_queries: List[SampleQuery]

class TraceData(BaseModel):
    id: str
    query: str
    response: str
    timestamp: str
    project_id: str

class AnnotationData(BaseModel):
    trace_id: str
    open_code_notes: str
    failure_modes: Dict[str, bool] = {}
    timestamp: Optional[str] = None

class BatchExecutionResponse(BaseModel):
    success: bool
    total_traces: int
    execution_id: str
    message: str

class ProgressResponse(BaseModel):
    total_traces: int
    annotated_traces: int
    completion_percentage: float

# Failure mode taxonomy for prompt evaluation
FAILURE_MODES = [
    "incomplete_response",
    "hallucination_issues", 
    "prompt_instruction_ignored",
    "inappropriate_tone",
    "missing_context_awareness",
    "factual_accuracy_errors",
    "formatting_inconsistencies",
    "bias_or_unfairness"
]

@router.post("/execute-batch", response_model=BatchExecutionResponse)
async def execute_batch_traces(request: BatchExecutionRequest) -> BatchExecutionResponse:
    """
    Execute all sample queries with the system prompt and store traces.
    """
    try:
        execution_id = f"{request.project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        traces = []
        
        logger.info(f"Starting batch execution for project {request.project_id} with {len(request.sample_queries)} queries")
        
        for query in request.sample_queries:
            try:
                # Execute query using existing OpenAI service
                result = await ai_service.test_prompt(
                    system_prompt=request.system_prompt,
                    user_message=query.text
                )
                
                if result["success"]:
                    trace = TraceData(
                        id=f"{execution_id}_{query.id}",
                        query=query.text,
                        response=result["response"],
                        timestamp=datetime.now().isoformat(),
                        project_id=request.project_id
                    )
                    traces.append(trace)
                else:
                    logger.error(f"Failed to execute query {query.id}: {result.get('error', 'Unknown error')}")
                    
            except Exception as e:
                logger.error(f"Error executing query {query.id}: {e}")
                continue
        
        # Store traces to file
        traces_file = TRACES_DIR / f"{execution_id}.json"
        with open(traces_file, 'w') as f:
            json.dump([trace.model_dump() for trace in traces], f, indent=2)
        
        logger.info(f"Batch execution completed. {len(traces)} traces generated and stored.")
        
        return BatchExecutionResponse(
            success=True,
            total_traces=len(traces),
            execution_id=execution_id,
            message=f"Successfully executed {len(traces)} traces"
        )
        
    except Exception as e:
        logger.error(f"Batch execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch execution failed: {str(e)}"
        )

@router.get("/traces/{execution_id}")
async def get_traces(execution_id: str) -> List[TraceData]:
    """
    Get all traces for a specific execution.
    """
    try:
        traces_file = TRACES_DIR / f"{execution_id}.json"
        if not traces_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Traces not found for execution_id: {execution_id}"
            )
        
        with open(traces_file, 'r') as f:
            traces_data = json.load(f)
        
        return [TraceData(**trace) for trace in traces_data]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving traces: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving traces: {str(e)}"
        )

@router.get("/annotations/{execution_id}")
async def get_annotations(execution_id: str) -> Dict[str, Any]:
    """
    Get all annotations for a specific execution.
    """
    try:
        annotations_file = ANNOTATIONS_DIR / f"{execution_id}.json"
        if not annotations_file.exists():
            return {}
        
        with open(annotations_file, 'r') as f:
            return json.load(f)
            
    except Exception as e:
        logger.error(f"Error retrieving annotations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving annotations: {str(e)}"
        )

@router.post("/annotations/{execution_id}")
async def save_annotation(execution_id: str, annotation: AnnotationData) -> Dict[str, Any]:
    """
    Save annotation for a specific trace.
    """
    try:
        annotations_file = ANNOTATIONS_DIR / f"{execution_id}.json"
        
        # Load existing annotations
        annotations = {}
        if annotations_file.exists():
            with open(annotations_file, 'r') as f:
                annotations = json.load(f)
        
        # Add timestamp if not provided
        if not annotation.timestamp:
            annotation.timestamp = datetime.now().isoformat()
        
        # Save annotation
        annotations[annotation.trace_id] = annotation.model_dump()
        
        with open(annotations_file, 'w') as f:
            json.dump(annotations, f, indent=2)
        
        return {"success": True, "message": "Annotation saved successfully"}
        
    except Exception as e:
        logger.error(f"Error saving annotation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving annotation: {str(e)}"
        )

@router.get("/progress/{execution_id}")
async def get_progress(execution_id: str) -> ProgressResponse:
    """
    Get annotation progress for a specific execution.
    """
    try:
        # Get total traces
        traces_file = TRACES_DIR / f"{execution_id}.json"
        if not traces_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Execution not found: {execution_id}"
            )
        
        with open(traces_file, 'r') as f:
            traces = json.load(f)
        total_traces = len(traces)
        
        # Get annotations count
        annotations_file = ANNOTATIONS_DIR / f"{execution_id}.json"
        annotated_traces = 0
        if annotations_file.exists():
            with open(annotations_file, 'r') as f:
                annotations = json.load(f)
            annotated_traces = len(annotations)
        
        completion_percentage = (annotated_traces / total_traces * 100) if total_traces > 0 else 0
        
        return ProgressResponse(
            total_traces=total_traces,
            annotated_traces=annotated_traces,
            completion_percentage=round(completion_percentage, 1)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting progress: {str(e)}"
        )

@router.get("/export/{execution_id}")
async def export_csv(execution_id: str) -> Response:
    """
    Export traces and annotations to CSV format.
    """
    try:
        # Load traces
        traces_file = TRACES_DIR / f"{execution_id}.json"
        if not traces_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Execution not found: {execution_id}"
            )
        
        with open(traces_file, 'r') as f:
            traces = json.load(f)
        
        # Load annotations
        annotations_file = ANNOTATIONS_DIR / f"{execution_id}.json"
        annotations = {}
        if annotations_file.exists():
            with open(annotations_file, 'r') as f:
                annotations = json.load(f)
        
        # Create CSV content
        output = io.StringIO()
        fieldnames = ['trace_id', 'query', 'response', 'timestamp', 'open_code_notes'] + FAILURE_MODES
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for trace in traces:
            annotation = annotations.get(trace['id'], {})
            failure_modes = annotation.get('failure_modes', {})
            
            row = {
                'trace_id': trace['id'],
                'query': trace['query'],
                'response': trace['response'][:500] + '...' if len(trace['response']) > 500 else trace['response'],
                'timestamp': trace['timestamp'],
                'open_code_notes': annotation.get('open_code_notes', '')
            }
            
            # Add failure mode columns
            for mode in FAILURE_MODES:
                row[mode] = 1 if failure_modes.get(mode, False) else 0
            
            writer.writerow(row)
        
        csv_content = output.getvalue()
        output.close()
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=open_coding_export_{execution_id}.csv"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting CSV: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting CSV: {str(e)}"
        )

@router.get("/failure-modes")
async def get_failure_modes() -> List[str]:
    """
    Get the list of available failure modes for annotation.
    """
    return FAILURE_MODES

@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check for open coding service.
    """
    try:
        # Test basic functionality
        TRACES_DIR.mkdir(exist_ok=True)
        ANNOTATIONS_DIR.mkdir(exist_ok=True)
        
        return {
            "status": "healthy",
            "service": "open-coding",
            "ai_service": "available" if ai_service else "unavailable"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy", 
            "service": "open-coding",
            "error": str(e)
        }