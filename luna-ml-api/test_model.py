# test_models.py

import joblib

models = {
    "next_period": "models/next_period_predictor.pkl",
    "symptoms": "models/symptom_predictor.pkl",
    "irregular_cycle": "models/irregular_cycle_detector.pkl",
    "cycle_length": "models/cycle_length_model_minimal.pkl",
    "menses_length": "models/menses_length_model.pkl"   
}

for name, path in models.items():
    try:
        print(f"Loading {name} model from {path}...")
        model = joblib.load(path)
        print(f"✅ {name} model loaded successfully.")
    except Exception as e:
        print(f"❌ Error loading {name}: {e}")
