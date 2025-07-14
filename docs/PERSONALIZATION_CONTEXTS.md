# Personalization Context: An Architectural Pattern for AI Health Coaching

## Overview

The Personalization Context is a specialized architectural pattern that manages and optimizes user-specific data injection into AI agent conversations. Unlike task-oriented contexts that retrieve information to accomplish specific goals, the Personalization Context is state-oriented—it maintains a persistent user model that enriches all other contexts with relevant personal information.

This pattern is essential for health coaching applications where personalized recommendations depend on comprehensive user data including health metrics, beliefs, habits, and progress tracking.

## Core Architecture

### 1. Context Window Optimization

The primary challenge in personalization is fitting relevant user data within token limits while maintaining context quality. The Personalization Context solves this through intelligent data selection and prioritization.

```python
class PersonalizationContext:
    """
    Manages user state and injects relevant data into context windows
    """
    def __init__(self, profile_mcp_client, max_tokens=8000):
        self.profile_client = profile_mcp_client
        self.max_tokens = max_tokens
        self.data_prioritizer = DataPrioritizer()
        
    async def prepare_for_context(self, context_type: str, user_id: str) -> dict:
        """
        Prepares personalized data package for a specific context
        """
        # Fetch all available user data
        user_data = await self.fetch_all_user_data(user_id)
        
        # Select relevant data for the context
        relevant_data = self.select_relevant_data(user_data, context_type)
        
        # Optimize for token limit
        optimized_package = self.optimize_token_usage(relevant_data)
        
        return optimized_package
```

### 2. Data Source Integration with Profile MCP

The Personalization Context interfaces with your Profile MCP server to access various data types:

```python
class ProfileMCPDataSource:
    """
    Interfaces with Profile MCP server for data retrieval
    """
    async def fetch_all_user_data(self, user_id: str) -> dict:
        # Core user data
        self_model = await self.profile_client.get_self_model(user_id)
        beliefs = await self.profile_client.get_user_beliefs(user_id)
        measurements = await self.profile_client.get_user_measurements(user_id)
        
        # Progress and protocols
        progress = await self.profile_client.get_progress(user_id)
        protocols = await self.profile_client.get_user_protocols(user_id)
        
        # Don't Die integration
        dd_score = await self.profile_client.get_dd_score(user_id)
        biomarkers = await self.profile_client.get_biomarkers(user_id)
        
        return {
            'self_model': self_model,
            'beliefs': beliefs,
            'measurements': measurements,
            'progress': progress,
            'protocols': protocols,
            'health_metrics': {
                'dd_score': dd_score,
                'biomarkers': biomarkers
            }
        }
```

### 3. Context-Specific Data Selection

Different contexts require different subsets of user data:

```python
class DataRelevanceSelector:
    """
    Selects relevant user data based on context requirements
    """
    
    CONTEXT_REQUIREMENTS = {
        'evidence_gathering': {
            'required': ['beliefs', 'health_conditions'],
            'helpful': ['biomarkers', 'genetics'],
            'priority': 'beliefs_first'
        },
        'protocol_recommendation': {
            'required': ['goals', 'constraints', 'current_habits'],
            'helpful': ['past_protocols', 'success_patterns'],
            'priority': 'actionable_data'
        },
        'progress_tracking': {
            'required': ['active_protocols', 'recent_measurements'],
            'helpful': ['historical_trends', 'similar_user_outcomes'],
            'priority': 'temporal_relevance'
        },
        'belief_revision': {
            'required': ['current_beliefs', 'recent_experiences'],
            'helpful': ['belief_history', 'outcome_correlations'],
            'priority': 'belief_evolution'
        }
    }
    
    def select_for_context(self, all_data: dict, context_type: str) -> dict:
        requirements = self.CONTEXT_REQUIREMENTS.get(context_type, {})
        selected = {}
        
        # Always include required data
        for field in requirements.get('required', []):
            if field in all_data:
                selected[field] = all_data[field]
                
        # Include helpful data if space permits
        # Implementation continues...
```

### 4. Token Optimization Strategy

```python
class TokenOptimizer:
    """
    Optimizes data inclusion within token limits
    """
    
    def __init__(self, max_tokens=8000):
        self.max_tokens = max_tokens
        self.tokenizer = load_tokenizer()
        
    def optimize(self, data_items: list, priorities: dict) -> list:
        """
        Fits maximum valuable data within token limit
        """
        # Sort by priority
        sorted_items = sorted(
            data_items, 
            key=lambda x: priorities.get(x['type'], float('inf'))
        )
        
        included = []
        current_tokens = 0
        
        for item in sorted_items:
            item_tokens = self.count_tokens(item)
            if current_tokens + item_tokens <= self.max_tokens:
                included.append(item)
                current_tokens += item_tokens
            elif self.can_compress(item):
                compressed = self.compress_item(item)
                compressed_tokens = self.count_tokens(compressed)
                if current_tokens + compressed_tokens <= self.max_tokens:
                    included.append(compressed)
                    current_tokens += compressed_tokens
                    
        return included
```

## Implementation Guide

### Step 1: Create the Personalization Context Manager

```python
class PersonalizationContextManager:
    """
    Main entry point for personalization in the health coach
    """
    
    def __init__(self, profile_mcp_server_url: str):
        self.profile_client = ProfileMCPClient(profile_mcp_server_url)
        self.cache = PersonalizationCache()
        self.data_selector = DataRelevanceSelector()
        self.token_optimizer = TokenOptimizer()
        
    async def enrich_context(self, context_name: str, user_id: str, 
                           base_prompt: str) -> str:
        """
        Enriches a base prompt with personalized user data
        """
        # Check cache first
        cache_key = f"{user_id}:{context_name}"
        if self.cache.has_valid(cache_key):
            personalization_data = self.cache.get(cache_key)
        else:
            # Fetch and prepare fresh data
            personalization_data = await self.prepare_personalization(
                context_name, user_id
            )
            self.cache.set(cache_key, personalization_data)
            
        # Inject into prompt
        enriched_prompt = self.inject_personalization(
            base_prompt, personalization_data
        )
        
        return enriched_prompt
```

### Step 2: Integration with Context Router

```python
class HealthCoachContextRouter:
    """
    Routes conversations to appropriate contexts with personalization
    """
    
    def __init__(self, personalization_manager: PersonalizationContextManager):
        self.personalization = personalization_manager
        self.contexts = self.load_contexts()
        
    async def route_and_execute(self, user_message: str, user_id: str):
        # Identify target context
        context = self.identify_context(user_message)
        
        # Get base prompt for context
        base_prompt = context.get_base_prompt()
        
        # Enrich with personalization
        enriched_prompt = await self.personalization.enrich_context(
            context.name, user_id, base_prompt
        )
        
        # Execute with enriched context
        response = await context.execute(enriched_prompt, user_message)
        
        return response
```

### Step 3: Data Freshness Management

```python
class DataFreshnessManager:
    """
    Ensures personalization data is current
    """
    
    FRESHNESS_REQUIREMENTS = {
        'measurements': timedelta(days=1),
        'beliefs': timedelta(days=7),
        'protocols': timedelta(days=1),
        'biomarkers': timedelta(days=30)
    }
    
    async def ensure_fresh_data(self, user_id: str):
        """
        Syncs stale data from Don't Die and other sources
        """
        sync_status = await self.profile_client.get_sync_status(user_id)
        
        for data_type, max_age in self.FRESHNESS_REQUIREMENTS.items():
            if self.is_stale(sync_status[data_type], max_age):
                await self.sync_data_type(user_id, data_type)
```

### Step 4: Personalization Templates

```python
class PersonalizationTemplates:
    """
    Templates for injecting personalization into prompts
    """
    
    TEMPLATES = {
        'user_profile': """
User Profile:
- Name: {name}
- Age: {age}
- Health Goals: {goals}
- Active Conditions: {conditions}
- Current Protocols: {protocols}
""",
        
        'recent_progress': """
Recent Progress (Last 7 days):
- Sleep: {sleep_trend}
- Exercise: {exercise_adherence}
- Nutrition: {nutrition_score}
- Energy Levels: {energy_trend}
""",
        
        'belief_context': """
User's Health Beliefs:
{beliefs}

Confidence Levels:
{confidence_scores}
"""
    }
    
    def format_for_context(self, template_name: str, data: dict) -> str:
        template = self.TEMPLATES.get(template_name, "")
        return template.format(**data)
```

## Usage Examples

### Example 1: Protocol Recommendation Context

```python
# When user asks: "What should I do to improve my sleep?"

# System automatically:
1. Identifies Protocol Recommendation context
2. Personalization Context fetches:
   - Current sleep habits
   - Sleep-related beliefs
   - Past protocol attempts
   - Relevant biomarkers (cortisol, melatonin)
   - Constraints (work schedule, family)
   
3. Optimizes to fit in context window:
   - Prioritizes actionable data
   - Compresses historical data
   - Excludes irrelevant health data
   
4. Injects personalized context:
   "Based on your 11 PM bedtime, high evening cortisol (22 μg/dL), 
    and belief that you're a 'night owl', here are protocols that 
    have worked for similar users..."
```

### Example 2: Evidence Gathering Context

```python
# When user asks: "Is there evidence that magnesium helps with sleep?"

# Personalization Context includes:
- User's current magnesium levels (if available)
- Sleep quality metrics
- Relevant health conditions
- Past supplement experiences

# Enables response like:
"Given your magnesium level of 1.8 mg/dL (slightly low) and 
 your tracked sleep latency of 45 minutes..."
```

## Evaluation Metrics

```python
class PersonalizationMetrics:
    """
    Metrics for evaluating personalization effectiveness
    """
    
    async def evaluate(self, user_id: str, session_id: str):
        return {
            'data_utilization': self.calculate_data_usage_rate(),
            'relevance_score': self.calculate_relevance_score(),
            'token_efficiency': self.calculate_token_efficiency(),
            'cache_hit_rate': self.calculate_cache_performance(),
            'user_satisfaction': await self.get_user_feedback_score()
        }
```

## Best Practices

1. **Cache Aggressively**: Personalization data changes slowly, cache computed packages
2. **Fail Gracefully**: Always have defaults when personalization data is unavailable  
3. **Respect Privacy**: Only include data relevant to the current context
4. **Monitor Token Usage**: Track and optimize token consumption patterns
5. **Version Templates**: Allow easy updates to personalization formats

## Implementation Checklist

- [ ] Set up Profile MCP client connection
- [ ] Implement data fetching from all Profile MCP endpoints
- [ ] Create context-specific relevance selectors
- [ ] Build token optimization algorithm
- [ ] Implement caching layer
- [ ] Create personalization templates
- [ ] Integrate with context router
- [ ] Add metrics collection
- [ ] Test with various user data scenarios
- [ ] Optimize for production scale

This Personalization Context pattern ensures that every interaction with the AI health coach is deeply personalized while maintaining efficient use of context windows and API resources.