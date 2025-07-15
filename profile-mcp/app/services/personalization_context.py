"""
Personalization Context Manager for AI Health Coach

This module implements the context engineering pattern for personalized AI interactions,
managing user-specific data injection into AI agent conversations while optimizing
for token limits and data relevance.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    User, SelfModel, BeliefSystem, Belief, Measurement, 
    ChecklistItem, DDUserData, ProtocolTemplate
)
from app.services.dd_sync import DDSyncService

logger = logging.getLogger(__name__)


class PersonalizationContextManager:
    """
    Main entry point for personalization in the health coach.
    Manages user state and injects relevant data into context windows.
    """
    
    def __init__(self, max_tokens: int = 8000):
        self.max_tokens = max_tokens
        self.dd_sync = DDSyncService()
        self.data_selector = DataRelevanceSelector()
        self.token_optimizer = TokenOptimizer(max_tokens)
        
    async def prepare_personalization_context(
        self, 
        session: AsyncSession,
        context_type: str, 
        user_id: str
    ) -> Dict[str, Any]:
        """
        Prepares personalized data package for a specific context type.
        
        Args:
            session: Database session
            context_type: Type of context (evidence_gathering, protocol_recommendation, etc.)
            user_id: User UUID string
            
        Returns:
            Optimized personalization data package
        """
        try:
            # Fetch all available user data
            user_data = await self._fetch_all_user_data(session, user_id)
            
            # Select relevant data for the context
            relevant_data = self.data_selector.select_for_context(user_data, context_type)
            
            # Optimize for token limit
            optimized_package = self.token_optimizer.optimize(relevant_data, context_type)
            
            # Add metadata
            optimized_package['_metadata'] = {
                'context_type': context_type,
                'user_id': user_id,
                'generated_at': datetime.utcnow().isoformat(),
                'token_count': self.token_optimizer.count_tokens(optimized_package),
                'data_sources': list(relevant_data.keys())
            }
            
            return optimized_package
            
        except Exception as e:
            logger.error(f"Error preparing personalization context: {str(e)}")
            return self._get_fallback_context(context_type, user_id)
    
    async def _fetch_all_user_data(self, session: AsyncSession, user_id: str) -> Dict[str, Any]:
        """
        Fetches all available user data from various sources.
        
        Returns:
            Dictionary containing all user data organized by type
        """
        user_uuid = UUID(user_id)
        user_data = {}
        
        try:
            # Core user data
            user_data['user_profile'] = await self._get_user_profile(session, user_uuid)
            user_data['self_model'] = await self._get_self_model(session, user_uuid)
            user_data['beliefs'] = await self._get_user_beliefs(session, user_uuid)
            user_data['measurements'] = await self._get_user_measurements(session, user_uuid)
            user_data['checklist_status'] = await self._get_checklist_status(session, user_id)
            
            # Don't Die integration data
            dd_data = await self._get_dd_data(session, user_id)
            if dd_data:
                user_data['biomarkers'] = dd_data.get_biomarkers()
                user_data['dd_scores'] = dd_data.get_dd_scores()
                user_data['protocols'] = dd_data.get_protocols()
                user_data['capabilities'] = dd_data.get_capabilities()
                user_data['dd_measurements'] = dd_data.get_measurements()
            
            # Protocol templates and trends
            user_data['protocol_templates'] = await self._get_protocol_templates(session)
            
        except Exception as e:
            logger.error(f"Error fetching user data: {str(e)}")
            
        return user_data
    
    async def _get_user_profile(self, session: AsyncSession, user_id: UUID) -> Optional[Dict[str, Any]]:
        """Get basic user profile information."""
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if user:
            return {
                'id': str(user.id),
                'dontdie_uid': user.dontdie_uid,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        return None
    
    async def _get_self_model(self, session: AsyncSession, user_id: UUID) -> Optional[Dict[str, Any]]:
        """Get user's self-model data."""
        result = await session.execute(
            select(SelfModel).where(SelfModel.user_id == user_id)
        )
        self_model = result.scalar_one_or_none()
        
        if self_model:
            return {
                'id': str(self_model.id),
                'created_at': self_model.created_at.isoformat() if self_model.created_at else None
            }
        return None
    
    async def _get_user_beliefs(self, session: AsyncSession, user_id: UUID) -> List[Dict[str, Any]]:
        """Get user's beliefs across all belief systems."""
        # First get belief systems for this user
        result = await session.execute(
            select(BeliefSystem)
            .join(SelfModel)
            .where(SelfModel.user_id == user_id)
        )
        belief_systems = result.scalars().all()
        
        beliefs = []
        for belief_system in belief_systems:
            # Get beliefs for each system
            belief_result = await session.execute(
                select(Belief).where(Belief.belief_system_id == belief_system.id)
            )
            system_beliefs = belief_result.scalars().all()
            
            for belief in system_beliefs:
                beliefs.append({
                    'id': str(belief.id),
                    'belief_system_name': belief_system.name,
                    'statement': belief.statement,
                    'confidence': belief.confidence,
                    'context_uuid': belief.context_uuid
                })
        
        return beliefs
    
    async def _get_user_measurements(self, session: AsyncSession, user_id: UUID) -> List[Dict[str, Any]]:
        """Get user's manual measurements."""
        result = await session.execute(
            select(Measurement).where(Measurement.user_id == user_id)
            .order_by(Measurement.captured_at.desc())
            .limit(50)  # Limit to recent measurements
        )
        measurements = result.scalars().all()
        
        return [
            {
                'id': str(measurement.id),
                'type': measurement.type,
                'value': measurement.value,
                'unit': measurement.unit,
                'captured_at': measurement.captured_at.isoformat() if measurement.captured_at else None
            }
            for measurement in measurements
        ]
    
    async def _get_checklist_status(self, session: AsyncSession, user_id: str) -> Dict[str, Any]:
        """Get user's checklist completion status."""
        result = await session.execute(
            select(ChecklistItem).where(ChecklistItem.user_id == user_id)
        )
        items = result.scalars().all()
        
        status = {}
        for item in items:
            status[item.bucket_code] = {
                'status': item.status,
                'updated_at': item.updated_at.isoformat() if item.updated_at else None,
                'source': item.source
            }
        
        return status
    
    async def _get_dd_data(self, session: AsyncSession, user_id: str) -> Optional[DDUserData]:
        """Get Don't Die synced data for user."""
        return await self.dd_sync.get_user_data(session, user_id)
    
    async def _get_protocol_templates(self, session: AsyncSession) -> List[Dict[str, Any]]:
        """Get available protocol templates."""
        result = await session.execute(
            select(ProtocolTemplate).where(ProtocolTemplate.is_active == True)
            .limit(10)  # Limit to avoid token bloat
        )
        templates = result.scalars().all()
        
        return [
            {
                'id': str(template.id),
                'habit_type': template.habit_type,
                'cue': template.cue,
                'routine': template.routine,
                'reward': template.reward
            }
            for template in templates
        ]
    
    def _get_fallback_context(self, context_type: str, user_id: str) -> Dict[str, Any]:
        """Return minimal fallback context when data fetching fails."""
        return {
            'user_profile': {'id': user_id},
            'context_note': 'Limited data available. Some personalization features may be reduced.',
            '_metadata': {
                'context_type': context_type,
                'user_id': user_id,
                'generated_at': datetime.utcnow().isoformat(),
                'is_fallback': True,
                'token_count': 50
            }
        }


class DataRelevanceSelector:
    """
    Selects relevant user data based on context requirements.
    """
    
    CONTEXT_REQUIREMENTS = {
        'evidence_gathering': {
            'required': ['beliefs', 'biomarkers', 'measurements'],
            'helpful': ['dd_scores', 'capabilities', 'checklist_status'],
            'priority_order': ['beliefs', 'biomarkers', 'measurements', 'dd_scores']
        },
        'protocol_recommendation': {
            'required': ['checklist_status', 'measurements', 'protocols'],
            'helpful': ['beliefs', 'capabilities', 'protocol_templates'],
            'priority_order': ['checklist_status', 'protocols', 'measurements', 'capabilities']
        },
        'progress_tracking': {
            'required': ['measurements', 'dd_measurements', 'protocols'],
            'helpful': ['dd_scores', 'capabilities', 'checklist_status'],
            'priority_order': ['dd_measurements', 'measurements', 'dd_scores', 'protocols']
        },
        'belief_revision': {
            'required': ['beliefs', 'self_model'],
            'helpful': ['measurements', 'dd_scores', 'protocols'],
            'priority_order': ['beliefs', 'self_model', 'dd_scores', 'measurements']
        }
    }
    
    def select_for_context(self, all_data: Dict[str, Any], context_type: str) -> Dict[str, Any]:
        """
        Select relevant data based on context type requirements.
        
        Args:
            all_data: All available user data
            context_type: Type of context being prepared
            
        Returns:
            Filtered data relevant to the context
        """
        requirements = self.CONTEXT_REQUIREMENTS.get(context_type, {})
        selected = {}
        
        # Always include user profile
        if 'user_profile' in all_data:
            selected['user_profile'] = all_data['user_profile']
        
        # Include required data
        for field in requirements.get('required', []):
            if field in all_data and all_data[field]:
                selected[field] = all_data[field]
        
        # Include helpful data
        for field in requirements.get('helpful', []):
            if field in all_data and all_data[field]:
                selected[field] = all_data[field]
        
        return selected


class TokenOptimizer:
    """
    Optimizes data inclusion within token limits using intelligent compression.
    """
    
    def __init__(self, max_tokens: int = 8000):
        self.max_tokens = max_tokens
        self.base_overhead = 200  # Reserve tokens for formatting and metadata
        
    def optimize(self, data_items: Dict[str, Any], context_type: str) -> Dict[str, Any]:
        """
        Optimize data package to fit within token limits.
        
        Args:
            data_items: Dictionary of data to optimize
            context_type: Context type for priority weighting
            
        Returns:
            Optimized data package within token limits
        """
        available_tokens = self.max_tokens - self.base_overhead
        optimized = {}
        current_tokens = 0
        
        # Get priority order for this context
        selector = DataRelevanceSelector()
        requirements = selector.CONTEXT_REQUIREMENTS.get(context_type, {})
        priority_order = requirements.get('priority_order', list(data_items.keys()))
        
        # Always include user_profile first
        if 'user_profile' in data_items:
            optimized['user_profile'] = data_items['user_profile']
            current_tokens += self.count_tokens(data_items['user_profile'])
        
        # Add items in priority order
        for item_key in priority_order:
            if item_key in data_items and item_key != 'user_profile':
                item_data = data_items[item_key]
                item_tokens = self.count_tokens(item_data)
                
                if current_tokens + item_tokens <= available_tokens:
                    optimized[item_key] = item_data
                    current_tokens += item_tokens
                elif self._can_compress(item_data):
                    compressed_data = self._compress_item(item_data, available_tokens - current_tokens)
                    if compressed_data:
                        optimized[item_key] = compressed_data
                        current_tokens += self.count_tokens(compressed_data)
        
        return optimized
    
    def count_tokens(self, data: Any) -> int:
        """
        Estimate token count for data (rough approximation).
        
        Args:
            data: Data to count tokens for
            
        Returns:
            Estimated token count
        """
        if isinstance(data, dict):
            text = json.dumps(data, ensure_ascii=False)
        elif isinstance(data, (list, tuple)):
            text = json.dumps(data, ensure_ascii=False)
        else:
            text = str(data)
        
        # Rough approximation: 1 token ≈ 4 characters
        return len(text) // 4
    
    def _can_compress(self, data: Any) -> bool:
        """Check if data can be compressed."""
        if isinstance(data, list) and len(data) > 5:
            return True
        if isinstance(data, dict) and len(str(data)) > 500:
            return True
        return False
    
    def _compress_item(self, data: Any, max_tokens: int) -> Any:
        """
        Compress data to fit within token limit.
        
        Args:
            data: Data to compress
            max_tokens: Maximum tokens allowed
            
        Returns:
            Compressed data or None if can't compress enough
        """
        if isinstance(data, list):
            # For lists, take most recent items up to token limit
            compressed = []
            current_tokens = 0
            
            for item in data:
                item_tokens = self.count_tokens(item)
                if current_tokens + item_tokens <= max_tokens:
                    compressed.append(item)
                    current_tokens += item_tokens
                else:
                    break
            
            if compressed:
                # Add indicator that data was truncated
                return compressed + [{'_truncated': True, 'original_count': len(data)}]
            
        elif isinstance(data, dict):
            # For dicts, prioritize shorter values and recent timestamps
            compressed = {}
            current_tokens = 0
            
            # Sort by estimated importance (shorter values first, recent dates prioritized)
            sorted_items = sorted(
                data.items(),
                key=lambda x: (
                    -1 if 'updated_at' in str(x[0]) or 'created_at' in str(x[0]) else 0,
                    len(str(x[1]))
                )
            )
            
            for key, value in sorted_items:
                item_tokens = self.count_tokens({key: value})
                if current_tokens + item_tokens <= max_tokens:
                    compressed[key] = value
                    current_tokens += item_tokens
                else:
                    break
            
            if compressed:
                compressed['_truncated'] = True
                return compressed
        
        return None