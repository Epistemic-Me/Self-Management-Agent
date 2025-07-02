"""
Sample queries for testing the Health Coach Agent
These will generate evaluation datasets
"""

SAMPLE_QUERIES = {
    "evidence_research_exercise": [
        "What does the research say about optimal training frequency for muscle growth?",
        "Show me meta-analyses on resistance training volume for hypertrophy",
        "What's the scientific evidence for high-intensity interval training benefits?",
        "Are there studies comparing strength training vs bodybuilding approaches?",
        "What does research show about rest periods between sets for strength gains?"
    ],
    
    "evidence_research_nutrition": [
        "What do meta-analyses say about intermittent fasting for weight loss?",
        "Show me research on protein timing for muscle building",
        "What does the evidence say about meal frequency and metabolism?",
        "Are there studies on the Mediterranean diet and longevity?",
        "What's the research on vitamin D supplementation benefits?"
    ],
    
    "evidence_research_sleep": [
        "What does research show about optimal sleep duration for health?",
        "Show me studies on blue light exposure and sleep quality",
        "What's the evidence for sleep and cognitive performance?",
        "Are there meta-analyses on sleep and immune function?",
        "What does research say about naps and nighttime sleep quality?"
    ],
    
    "plan_exercise": [
        "Help me design a 3-day strength training program",
        "Create a workout plan for a beginner wanting to build muscle",
        "Design a cardio program for improving cardiovascular health",
        "Plan a progressive overload strategy for my training",
        "Help me structure a weekly training split for muscle growth"
    ],
    
    "plan_nutrition": [
        "Design a meal plan for muscle gain on a 2800 calorie diet",
        "Create a nutrition strategy for fat loss while preserving muscle",
        "Plan my macronutrient distribution for athletic performance",
        "Help me design a plant-based meal plan for health",
        "Create a meal prep strategy for busy weekdays"
    ],
    
    "plan_sleep": [
        "Help me design an optimal sleep schedule for shift work",
        "Create a bedtime routine to improve sleep quality",
        "Plan my evening routine to optimize sleep",
        "Design a strategy to fix my sleep-wake cycle",
        "Help me create a sleep optimization plan"
    ],
    
    "task_exercise": [
        "Set up tracking for my daily step count",
        "Create reminders for my workout schedule",
        "Help me automate my exercise logging",
        "Set up progress tracking for my strength training",
        "Create a system to track my weekly activity levels"
    ],
    
    "task_nutrition": [
        "Set up meal prep reminders for Sunday",
        "Create a system to track my daily water intake",
        "Help me automate my calorie tracking",
        "Set up reminders for my supplement schedule",
        "Create a grocery shopping automation system"
    ],
    
    "task_sleep": [
        "Set up reminders for my bedtime routine",
        "Create a sleep tracking system",
        "Automate my bedroom environment for better sleep",
        "Set up wind-down routine reminders",
        "Create a morning routine automation"
    ],
    
    "opinion_research_exercise": [
        "What do fitness influencers say about training frequency?",
        "Compare different trainers' approaches to muscle building",
        "What are the popular opinions on cardio vs weights for fat loss?",
        "How do different fitness communities view rest days?",
        "What do bodybuilders vs powerlifters think about rep ranges?"
    ],
    
    "opinion_research_nutrition": [
        "What do nutrition experts think about keto vs low-fat diets?",
        "Compare different diet philosophies for longevity",
        "What are the popular opinions on supplement timing?",
        "How do different nutrition schools view meal frequency?",
        "What do health influencers say about cheat meals?"
    ],
    
    "opinion_research_sleep": [
        "What do sleep experts think about polyphasic sleep?",
        "Compare different approaches to sleep optimization",
        "What are popular opinions on sleep tracking devices?",
        "How do different sleep coaches view napping?",
        "What do wellness influencers say about sleep hygiene?"
    ]
}

COHORT_VARIATIONS = {
    "sedentary_beginner": {
        "prefixes": [
            "As someone new to health habits, ",
            "I'm just starting my health journey, ",
            "I have no experience with this, ",
            "As a complete beginner, "
        ],
        "constraints_to_test": ["simple_language", "foundational_only"]
    },
    
    "health_enthusiast": {
        "prefixes": [
            "I exercise regularly and want to optimize, ",
            "I have good baseline habits but need guidance on ",
            "As someone with decent health habits, ",
            "I'm already active but curious about "
        ],
        "constraints_to_test": ["balanced_advice", "practical_focus"]
    },
    
    "optimizer": {
        "prefixes": [
            "I track my metrics and want to understand ",
            "Based on my data analysis, ",
            "I'm experimenting with protocols and need info on ",
            "As someone who measures everything, "
        ],
        "constraints_to_test": ["quantitative_data", "metric_focus"]
    },
    
    "biohacker": {
        "prefixes": [
            "I'm interested in cutting-edge research on ",
            "What are the latest experimental protocols for ",
            "I want to try advanced optimization techniques for ",
            "From a biohacking perspective, "
        ],
        "constraints_to_test": ["advanced_protocols", "experimental_data"]
    }
}

def generate_test_dataset(num_queries_per_category=20):
    """Generate a comprehensive test dataset"""
    dataset = []
    
    for intent_category, base_queries in SAMPLE_QUERIES.items():
        for cohort, cohort_data in COHORT_VARIATIONS.items():
            for i, base_query in enumerate(base_queries):
                # Add cohort-specific variations
                for prefix in cohort_data["prefixes"]:
                    query_id = f"{intent_category}_{cohort}_{i}_{len(dataset)}"
                    
                    dataset.append({
                        "id": query_id,
                        "query": prefix + base_query.lower(),
                        "expected_cohort": cohort,
                        "expected_category": intent_category.split("_")[-1],  # exercise, nutrition, sleep
                        "expected_intent": "_".join(intent_category.split("_")[:-1]),  # evidence_research, plan, etc.
                        "constraints_to_validate": cohort_data["constraints_to_test"],
                        "test_type": "routing_accuracy"
                    })
                    
                    if len(dataset) >= num_queries_per_category:
                        break
                        
                if len(dataset) >= num_queries_per_category:
                    break
                    
            if len(dataset) >= num_queries_per_category:
                break
    
    return dataset

def generate_constraint_violation_tests():
    """Generate tests specifically for constraint violations"""
    violation_tests = []
    
    # Test for anecdotal evidence violation
    violation_tests.extend([
        {
            "id": "violation_anecdotal_1",
            "query": "What does research say about protein timing?",
            "expected_response_should_not_contain": ["my friend", "I know someone", "personally"],
            "constraint_type": "scope_boundary",
            "violation_type": "anecdotal_evidence"
        },
        {
            "id": "violation_jargon_1", 
            "query": "Explain muscle building for a beginner",
            "cohort": "sedentary_beginner",
            "expected_response_should_not_contain": ["myofibrillar hypertrophy", "sarcoplasmic", "periodization"],
            "constraint_type": "tone",
            "violation_type": "technical_jargon"
        }
    ])
    
    return violation_tests

if __name__ == "__main__":
    # Generate datasets
    import json
    
    test_dataset = generate_test_dataset(100)
    violation_tests = generate_constraint_violation_tests()
    
    # Save datasets
    with open("health_coach_test_dataset.json", "w") as f:
        json.dump({
            "dataset": test_dataset,
            "violation_tests": violation_tests,
            "metadata": {
                "total_queries": len(test_dataset),
                "categories": list(set(q["expected_category"] for q in test_dataset)),
                "intents": list(set(q["expected_intent"] for q in test_dataset)),
                "cohorts": list(set(q["expected_cohort"] for q in test_dataset))
            }
        }, f, indent=2)
    
    print(f"Generated {len(test_dataset)} test queries")
    print(f"Generated {len(violation_tests)} violation tests")
    print("Dataset saved to health_coach_test_dataset.json")