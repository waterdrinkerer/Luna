# 🎭 Daily Symptom Prediction Model for Luna
# This model predicts daily period symptoms with intensity levels

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Load the dataset
print("📊 Loading dataset for Symptom Prediction...")
df = pd.read_csv("models/data/menstrual_data.csv")

print(f"Original dataset shape: {df.shape}")

# ===================================
# FEATURE ENGINEERING FOR SYMPTOM PREDICTION
# ===================================

def create_symptom_features(df):
    """
    Create features for predicting daily menstrual symptoms
    """
    print("🔧 Engineering features for symptom prediction...")
    
    # Clean the data
    df_clean = df.copy()
    
    # Convert string columns to numeric, handling blanks
    numeric_columns = ['LengthofCycle', 'EstimatedDayofOvulation', 'LengthofMenses',
                      'MensesScoreDayOne', 'MensesScoreDayTwo', 'MensesScoreDayThree',
                      'MensesScoreDayFour', 'MensesScoreDayFive', 'TotalMensesScore',
                      'MeanBleedingIntensity', 'Age', 'BMI', 'Numberpreg']
    
    for col in numeric_columns:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
    
    # Focus on rows with period intensity data
    valid_rows = df_clean.dropna(subset=['MensesScoreDayOne', 'LengthofCycle', 'Age'])
    
    print(f"Rows with valid symptom data: {len(valid_rows)}")
    
    # === CREATE MULTIPLE DAYS OF DATA ===
    # Each cycle will generate multiple rows (one for each day of period)
    
    features_list = []
    targets_list = []
    
    for _, row in valid_rows.iterrows():
        cycle_length = row['LengthofCycle']
        menses_length = row['LengthofMenses']
        age = row['Age']
        bmi = row['BMI'] if not pd.isna(row['BMI']) else 25
        mean_intensity = row['MeanBleedingIntensity'] if not pd.isna(row['MeanBleedingIntensity']) else 5
        
        # Get daily scores (convert to 0-10 scale from original 0-3 scale)
        daily_scores = []
        for day in ['One', 'Two', 'Three', 'Four', 'Five']:
            score = row[f'MensesScoreDay{day}']
            if not pd.isna(score):
                # Convert from 0-3 to 0-10 scale and add variability
                converted_score = score * 3.33  # 3 becomes ~10
                daily_scores.append(converted_score)
            else:
                daily_scores.append(None)
        
        # Create data points for each day of the cycle
        for cycle_day in range(1, int(cycle_length) + 1):
            
            # === FEATURES ===
            features = {
                # Cycle timing features
                'cycle_day': cycle_day,
                'cycle_length': cycle_length,
                'menses_length': menses_length,
                'days_since_period_start': max(0, cycle_day - 1),
                'days_until_next_period': max(0, cycle_length - cycle_day),
                
                # Cycle phase features
                'is_period_phase': 1 if cycle_day <= menses_length else 0,
                'is_follicular_phase': 1 if menses_length < cycle_day <= (cycle_length - 14 - 3) else 0,
                'is_ovulation_phase': 1 if (cycle_length - 14 - 3) < cycle_day <= (cycle_length - 14 + 3) else 0,
                'is_luteal_phase': 1 if (cycle_length - 14 + 3) < cycle_day <= (cycle_length - 5) else 0,
                'is_pms_phase': 1 if cycle_day > (cycle_length - 5) else 0,
                
                # Period day specific
                'period_day': min(cycle_day, menses_length) if cycle_day <= menses_length else 0,
                'period_day_normalized': (min(cycle_day, menses_length) / menses_length) if cycle_day <= menses_length and menses_length > 0 else 0,
                
                # Personal characteristics
                'age': age,
                'bmi': bmi,
                'pregnancies': row['Numberpreg'] if not pd.isna(row['Numberpreg']) else 0,
                'mean_bleeding_intensity': mean_intensity,
                
                # Cycle position ratios
                'cycle_day_ratio': cycle_day / cycle_length,
                'ovulation_proximity': abs(cycle_day - (cycle_length - 14)) / cycle_length,
                
                # Age-related factors
                'is_teenager': 1 if age < 20 else 0,
                'is_adult': 1 if 20 <= age <= 35 else 0,
                'is_older_adult': 1 if age > 35 else 0,
            }
            
            # === TARGETS (Symptom intensities) ===
            targets = {
                'cramp_intensity': 0,
                'flow_intensity': 0,
                'fatigue_level': 0,
                'mood_impact': 0,
                'overall_discomfort': 0
            }
            
            # Period-specific symptoms
            if cycle_day <= menses_length and cycle_day <= len(daily_scores):
                period_day_idx = cycle_day - 1
                if period_day_idx < len(daily_scores) and daily_scores[period_day_idx] is not None:
                    base_intensity = daily_scores[period_day_idx]
                    
                    # Cramps typically peak on days 1-2
                    if cycle_day <= 2:
                        targets['cramp_intensity'] = min(10, base_intensity * 1.2)
                    elif cycle_day <= 3:
                        targets['cramp_intensity'] = base_intensity
                    else:
                        targets['cramp_intensity'] = max(0, base_intensity * 0.6)
                    
                    # Flow follows the daily scores directly
                    targets['flow_intensity'] = base_intensity
                    
                    # Fatigue often accompanies heavy flow
                    targets['fatigue_level'] = min(10, base_intensity * 0.8 + (2 if cycle_day <= 2 else 0))
                    
                    # Mood impact during period
                    targets['mood_impact'] = min(10, base_intensity * 0.6 + (1 if cycle_day <= 3 else 0))
                    
                    # Overall discomfort
                    targets['overall_discomfort'] = (targets['cramp_intensity'] + targets['flow_intensity'] + targets['fatigue_level']) / 3
            
            # PMS symptoms (5 days before period)
            elif cycle_day > (cycle_length - 5):
                days_before_period = cycle_length - cycle_day
                pms_intensity = max(0, (5 - days_before_period) * 2)  # Increases closer to period
                
                targets['cramp_intensity'] = min(5, pms_intensity * 0.4)  # Mild cramps
                targets['flow_intensity'] = 0  # No flow during PMS
                targets['fatigue_level'] = min(7, pms_intensity * 0.8)   # Fatigue
                targets['mood_impact'] = min(8, pms_intensity)           # Mood swings
                targets['overall_discomfort'] = (targets['cramp_intensity'] + targets['fatigue_level'] + targets['mood_impact']) / 3
            
            # Ovulation symptoms (around day cycle_length - 14)
            elif abs(cycle_day - (cycle_length - 14)) <= 1:
                targets['cramp_intensity'] = 2  # Mild ovulation cramps
                targets['flow_intensity'] = 0   # No flow
                targets['fatigue_level'] = 1    # Minimal fatigue
                targets['mood_impact'] = 0      # Usually positive mood
                targets['overall_discomfort'] = 1
            
            # Add some realistic variability
            for key in targets:
                if targets[key] > 0:
                    noise = np.random.normal(0, 0.5)  # Small random variation
                    targets[key] = max(0, min(10, targets[key] + noise))
            
            features_list.append(features)
            targets_list.append(targets)
    
    # Convert to DataFrames
    features_df = pd.DataFrame(features_list)
    targets_df = pd.DataFrame(targets_list)
    
    print(f"✅ Created {len(features_df)} data points from {len(valid_rows)} cycles")
    print(f"Features: {features_df.shape}, Targets: {targets_df.shape}")
    
    return features_df, targets_df

# Create features and targets
features_df, targets_df = create_symptom_features(df)

# Define feature columns
feature_columns = [
    'cycle_day', 'cycle_length', 'menses_length', 'days_since_period_start',
    'days_until_next_period', 'is_period_phase', 'is_follicular_phase',
    'is_ovulation_phase', 'is_luteal_phase', 'is_pms_phase',
    'period_day', 'period_day_normalized', 'age', 'bmi', 'pregnancies',
    'mean_bleeding_intensity', 'cycle_day_ratio', 'ovulation_proximity',
    'is_teenager', 'is_adult', 'is_older_adult'
]

# Target columns
target_columns = ['cramp_intensity', 'flow_intensity', 'fatigue_level', 'mood_impact', 'overall_discomfort']

X = features_df[feature_columns]
y = targets_df[target_columns]

print(f"📊 Final dataset: {X.shape[0]} samples, {X.shape[1]} features, {y.shape[1]} targets")

# ===================================
# TRAIN THE MODEL
# ===================================

# Split the data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"Training set: {X_train.shape}")
print(f"Test set: {X_test.shape}")

# Train multi-output model
print("🚀 Training Daily Symptom Prediction Model...")
base_model = RandomForestRegressor(
    n_estimators=150,
    max_depth=12,
    min_samples_split=5,
    min_samples_leaf=3,
    random_state=42
)

model = MultiOutputRegressor(base_model)
model.fit(X_train, y_train)

# Evaluate the model
predictions = model.predict(X_test)
y_test_array = y_test.values

print(f"\n🎯 DAILY SYMPTOM PREDICTION MODEL PERFORMANCE:")

# Calculate metrics for each symptom
for i, symptom in enumerate(target_columns):
    mae = mean_absolute_error(y_test_array[:, i], predictions[:, i])
    r2 = r2_score(y_test_array[:, i], predictions[:, i])
    
    # Calculate accuracy within different tolerance levels
    errors = np.abs(y_test_array[:, i] - predictions[:, i])
    within_1 = np.sum(errors <= 1) / len(errors) * 100
    within_2 = np.sum(errors <= 2) / len(errors) * 100
    
    print(f"\n   {symptom.replace('_', ' ').title()}:")
    print(f"     MAE: {mae:.2f}")
    print(f"     R²: {r2:.3f}")
    print(f"     Within 1 point: {within_1:.1f}%")
    print(f"     Within 2 points: {within_2:.1f}%")

# Overall model performance
overall_mae = mean_absolute_error(y_test_array, predictions)
print(f"\n📊 Overall Performance:")
print(f"   Average MAE across all symptoms: {overall_mae:.2f}")

# Feature importance (from the first estimator as example)
feature_importance = pd.DataFrame({
    'feature': feature_columns,
    'importance': model.estimators_[0].feature_importances_
}).sort_values('importance', ascending=False)

print(f"\n🔍 Top 10 Most Important Features:")
for _, row in feature_importance.head(10).iterrows():
    print(f"   {row['feature']}: {row['importance']:.3f}")

# Save the model
joblib.dump(model, "symptom_predictor.pkl")
print("\n✅ Daily Symptom Prediction Model saved as 'symptom_predictor.pkl'")

# ===================================
# PRODUCTION UTILITY FUNCTIONS
# ===================================

def predict_daily_symptoms(
    current_cycle_day: int,
    cycle_length: int,
    menses_length: int,
    age: int,
    bmi: float = 25,
    pregnancies: int = 0,
    mean_bleeding_intensity: float = 5,
    model_path: str = "symptom_predictor.pkl"
) -> dict:
    """
    Predict symptom intensities for Luna user on a specific cycle day
    
    Args:
        current_cycle_day: Current day in cycle (1-based)
        cycle_length: Total cycle length
        menses_length: Length of menstrual period
        age: User's age
        bmi: User's BMI
        pregnancies: Number of pregnancies
        mean_bleeding_intensity: Average bleeding intensity
        model_path: Path to trained model
    
    Returns:
        Dictionary with symptom predictions
    """
    
    # Load the model
    model = joblib.load(model_path)
    
    # Create feature vector
    features = np.array([[
        current_cycle_day,
        cycle_length,
        menses_length,
        max(0, current_cycle_day - 1),  # days_since_period_start
        max(0, cycle_length - current_cycle_day),  # days_until_next_period
        1 if current_cycle_day <= menses_length else 0,  # is_period_phase
        1 if menses_length < current_cycle_day <= (cycle_length - 14 - 3) else 0,  # is_follicular_phase
        1 if (cycle_length - 14 - 3) < current_cycle_day <= (cycle_length - 14 + 3) else 0,  # is_ovulation_phase
        1 if (cycle_length - 14 + 3) < current_cycle_day <= (cycle_length - 5) else 0,  # is_luteal_phase
        1 if current_cycle_day > (cycle_length - 5) else 0,  # is_pms_phase
        min(current_cycle_day, menses_length) if current_cycle_day <= menses_length else 0,  # period_day
        (min(current_cycle_day, menses_length) / menses_length) if current_cycle_day <= menses_length and menses_length > 0 else 0,  # period_day_normalized
        age,
        bmi,
        pregnancies,
        mean_bleeding_intensity,
        current_cycle_day / cycle_length,  # cycle_day_ratio
        abs(current_cycle_day - (cycle_length - 14)) / cycle_length,  # ovulation_proximity
        1 if age < 20 else 0,  # is_teenager
        1 if 20 <= age <= 35 else 0,  # is_adult
        1 if age > 35 else 0  # is_older_adult
    ]])
    
    # Get predictions
    predictions = model.predict(features)[0]
    
    symptom_names = ['cramp_intensity', 'flow_intensity', 'fatigue_level', 'mood_impact', 'overall_discomfort']
    
    # Determine confidence based on cycle phase and data quality
    confidence = 'medium'
    if current_cycle_day <= menses_length:
        confidence = 'high'  # Most confident during period
    elif current_cycle_day > (cycle_length - 5):
        confidence = 'high'  # Confident about PMS
    elif abs(current_cycle_day - (cycle_length - 14)) <= 2:
        confidence = 'medium'  # Moderate confidence around ovulation
    
    # Create user-friendly symptom descriptions
    def get_symptom_description(intensity):
        if intensity <= 2:
            return "None to minimal"
        elif intensity <= 4:
            return "Mild"
        elif intensity <= 6:
            return "Moderate"
        elif intensity <= 8:
            return "Strong"
        else:
            return "Severe"
    
    # Determine cycle phase for context
    if current_cycle_day <= menses_length:
        phase = "menstrual"
        phase_message = f"Day {current_cycle_day} of your period"
    elif current_cycle_day > (cycle_length - 5):
        phase = "pms"
        phase_message = f"{cycle_length - current_cycle_day + 1} days until period"
    elif abs(current_cycle_day - (cycle_length - 14)) <= 2:
        phase = "ovulation"
        phase_message = "Around ovulation time"
    elif current_cycle_day <= (cycle_length - 14 - 3):
        phase = "follicular"
        phase_message = "Follicular phase"
    else:
        phase = "luteal"
        phase_message = "Luteal phase"
    
    return {
        'predictions': {
            'cramp_intensity': round(predictions[0], 1),
            'flow_intensity': round(predictions[1], 1),
            'fatigue_level': round(predictions[2], 1),
            'mood_impact': round(predictions[3], 1),
            'overall_discomfort': round(predictions[4], 1)
        },
        'descriptions': {
            'cramps': get_symptom_description(predictions[0]),
            'flow': get_symptom_description(predictions[1]),
            'fatigue': get_symptom_description(predictions[2]),
            'mood': get_symptom_description(predictions[3]),
            'overall': get_symptom_description(predictions[4])
        },
        'phase': phase,
        'phase_message': phase_message,
        'confidence': confidence,
        'top_symptoms': sorted([
            ('cramps', predictions[0]),
            ('fatigue', predictions[2]),
            ('mood_changes', predictions[3])
        ], key=lambda x: x[1], reverse=True)[:2]  # Top 2 symptoms
    }

# ===================================
# TEST THE PRODUCTION FUNCTION
# ===================================

print("\n🧪 Testing symptom prediction function...")

# Test case 1: Day 2 of period
period_test = predict_daily_symptoms(
    current_cycle_day=2,
    cycle_length=28,
    menses_length=5,
    age=25,
    bmi=22,
    mean_bleeding_intensity=7
)

print(f"Day 2 of period test: {period_test}")

# Test case 2: PMS phase
pms_test = predict_daily_symptoms(
    current_cycle_day=26,
    cycle_length=28,
    menses_length=5,
    age=30,
    bmi=24,
    pregnancies=1
)

print(f"PMS phase test: {pms_test}")

# Test case 3: Ovulation
ovulation_test = predict_daily_symptoms(
    current_cycle_day=14,
    cycle_length=28,
    menses_length=5,
    age=27,
    bmi=23
)

print(f"Ovulation test: {ovulation_test}")

print("\n🚀 Daily Symptom Prediction Model is ready for Luna integration!")