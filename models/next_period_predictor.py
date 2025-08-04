# 🔮 WORKING Next Period Prediction Model for Luna
# This model predicts the exact date of the next period start

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Load the dataset
print("📊 Loading dataset for Next Period Prediction...")
df = pd.read_csv("models/data/menstrual_data.csv")

print(f"Original dataset shape: {df.shape}")

# ===================================
# ROBUST FEATURE ENGINEERING
# ===================================

def create_next_period_features(df):
    """
    Create features for predicting days until next period with ROBUST data cleaning
    """
    print("🔧 Engineering features for next period prediction...")
    
    df_clean = df.copy()
    
    # ✅ SUPER ROBUST DATA CLEANING
    numeric_columns = ['LengthofCycle', 'MeanCycleLength', 'EstimatedDayofOvulation', 
                      'LengthofLutealPhase', 'TotalDaysofFertility', 'Age', 'BMI',
                      'LengthofMenses', 'MeanMensesLength', 'Numberpreg', 'UnusualBleeding',
                      'CycleWithPeakorNot']
    
    for col in numeric_columns:
        if col in df_clean.columns:
            # Handle ALL types of missing/problematic values
            df_clean[col] = df_clean[col].astype(str)  # Convert to string first
            df_clean[col] = df_clean[col].str.strip()  # Remove whitespace
            df_clean[col] = df_clean[col].replace(['', ' ', '  ', 'nan', 'NaN', 'None'], np.nan)
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
    
    # Drop rows missing critical data
    df_clean = df_clean.dropna(subset=['LengthofCycle', 'Age'])
    
    print(f"After cleaning: {len(df_clean)} rows remaining")
    
    if len(df_clean) < 50:
        print("⚠️  Warning: Very few rows remaining. Check your data quality.")
    
    # === BUILD FEATURES ===
    features_df = pd.DataFrame(index=df_clean.index)
    
    # 1. Core cycle characteristics
    features_df['CurrentCycleLength'] = df_clean['LengthofCycle']
    features_df['MeanCycleLength'] = df_clean['MeanCycleLength'].fillna(df_clean['LengthofCycle'])
    features_df['CycleVariability'] = abs(features_df['CurrentCycleLength'] - features_df['MeanCycleLength']).fillna(2)
    
    # 2. Ovulation and luteal phase
    features_df['EstimatedDayofOvulation'] = df_clean['EstimatedDayofOvulation'].fillna(
        features_df['CurrentCycleLength'] - 14
    )
    features_df['LutealPhaseLength'] = df_clean['LengthofLutealPhase'].fillna(14)
    
    # 3. Menstrual characteristics
    features_df['MensesLength'] = df_clean['LengthofMenses'].fillna(5)
    features_df['MeanMensesLength'] = df_clean['MeanMensesLength'].fillna(features_df['MensesLength'])
    
    # 4. Demographics
    features_df['Age'] = df_clean['Age']
    features_df['BMI'] = df_clean['BMI'].fillna(25)
    features_df['NumberPregnancies'] = df_clean['Numberpreg'].fillna(0)
    
    # 5. Binary indicators (ensure they are 0 or 1)
    features_df['CycleWithPeak'] = df_clean['CycleWithPeakorNot'].fillna(1).astype(int)
    features_df['UnusualBleeding'] = df_clean['UnusualBleeding'].fillna(0).astype(int)
    
    # 6. Calculated ratios
    features_df['OvulationTiming'] = features_df['EstimatedDayofOvulation'] / features_df['CurrentCycleLength']
    features_df['LutealRatio'] = features_df['LutealPhaseLength'] / features_df['CurrentCycleLength']
    features_df['MensesRatio'] = features_df['MensesLength'] / features_df['CurrentCycleLength']
    features_df['AgeAdjustedCycle'] = features_df['CurrentCycleLength'] * (features_df['Age'] / 28)
    features_df['FertilityRatio'] = 6 / features_df['CurrentCycleLength']  # 6 fertile days
    
    # ✅ FINAL CLEANUP: Remove any remaining problematic values
    features_df = features_df.replace([np.inf, -np.inf], np.nan)
    features_df = features_df.fillna(0)
    
    # Ensure all columns are numeric
    for col in features_df.columns:
        features_df[col] = pd.to_numeric(features_df[col], errors='coerce')
    
    features_df = features_df.fillna(0)  # Final NaN cleanup
    
    # Target variable
    target = features_df['CurrentCycleLength'].copy()
    
    print(f"✅ Features created: {features_df.shape}")
    print(f"Target range: {target.min():.1f} - {target.max():.1f} days")
    
    return features_df, target

# Create features
features_df, target = create_next_period_features(df)

# Define feature columns (excluding target)
feature_columns = [
    'MeanCycleLength', 'CycleVariability', 'EstimatedDayofOvulation',
    'LutealPhaseLength', 'MensesLength', 'Age', 'BMI', 'NumberPregnancies',
    'CycleWithPeak', 'UnusualBleeding', 'OvulationTiming', 'LutealRatio',
    'MensesRatio', 'AgeAdjustedCycle', 'FertilityRatio'
]

X = features_df[feature_columns].copy()
y = target.copy()

# ✅ FINAL DATA VALIDATION
print(f"📊 Final dataset shape: {X.shape}")
print(f"Data types check:")
for col in X.columns:
    print(f"   {col}: {X[col].dtype}")

# Ensure everything is numeric
X = X.astype(float)
y = y.astype(float)

print(f"✅ All data converted to float successfully!")
print(f"Any NaN in X: {X.isnull().sum().sum()}")
print(f"Any NaN in y: {y.isnull().sum()}")

# ===================================
# TRAIN THE MODEL
# ===================================

if len(X) < 20:
    print("❌ Error: Not enough data to train model. Need at least 20 samples.")
    exit()

# Split the data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"Training set: {X_train.shape}")
print(f"Test set: {X_test.shape}")

# Train the model
print("🚀 Training Next Period Prediction Model...")
model = RandomForestRegressor(
    n_estimators=100,  # Reduced for smaller dataset
    max_depth=10,
    min_samples_split=3,
    min_samples_leaf=2,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate the model
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

# Calculate practical accuracy
error_distribution = np.abs(predictions - y_test)
within_1_day = np.sum(error_distribution <= 1) / len(error_distribution) * 100
within_2_days = np.sum(error_distribution <= 2) / len(error_distribution) * 100
within_3_days = np.sum(error_distribution <= 3) / len(error_distribution) * 100

print(f"\n🎯 NEXT PERIOD PREDICTION MODEL PERFORMANCE:")
print(f"   MAE: {mae:.2f} days")
print(f"   R²: {r2:.3f}")
print(f"   Within 1 day: {within_1_day:.1f}%")
print(f"   Within 2 days: {within_2_days:.1f}%")
print(f"   Within 3 days: {within_3_days:.1f}%")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': feature_columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(f"\n🔍 Top 10 Most Important Features:")
for _, row in feature_importance.head(10).iterrows():
    print(f"   {row['feature']}: {row['importance']:.3f}")

# Save the model
joblib.dump(model, "next_period_predictor.pkl")
print("\n✅ Next Period Prediction Model saved as 'next_period_predictor.pkl'")

# ===================================
# SIMPLE PRODUCTION FUNCTION
# ===================================

def predict_next_period_date(
    current_cycle_day: int,
    mean_cycle_length: float = 28,
    age: int = 25,
    bmi: float = 25,
    menses_length: float = 5,
    model_path: str = "next_period_predictor.pkl"
) -> dict:
    """
    Simplified prediction function for Luna
    """
    try:
        # Load the model
        model = joblib.load(model_path)
        
        # Create feature vector with reasonable defaults
        estimated_ovulation = mean_cycle_length - 14
        luteal_phase = 14
        cycle_variability = 2
        
        features = np.array([[
            mean_cycle_length,          # MeanCycleLength
            cycle_variability,          # CycleVariability  
            estimated_ovulation,        # EstimatedDayofOvulation
            luteal_phase,              # LutealPhaseLength
            menses_length,             # MensesLength
            age,                       # Age
            bmi,                       # BMI
            0,                         # NumberPregnancies
            1,                         # CycleWithPeak
            0,                         # UnusualBleeding
            estimated_ovulation / mean_cycle_length,  # OvulationTiming
            luteal_phase / mean_cycle_length,         # LutealRatio
            menses_length / mean_cycle_length,        # MensesRatio
            mean_cycle_length * (age / 28),           # AgeAdjustedCycle
            6 / mean_cycle_length                     # FertilityRatio
        ]], dtype=float)
        
        # Predict cycle length
        predicted_cycle_length = model.predict(features)[0]
        
        # Calculate days until next period
        days_until_next = predicted_cycle_length - current_cycle_day
        
        if days_until_next <= 0:
            days_until_next += predicted_cycle_length
        
        return {
            'days_until_next_period': int(round(days_until_next)),
            'predicted_cycle_length': round(predicted_cycle_length, 1),
            'confidence': 'medium',
            'explanation': f"Based on {predicted_cycle_length:.1f}-day cycle pattern"
        }
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return {
            'days_until_next_period': max(1, 28 - current_cycle_day),
            'predicted_cycle_length': 28.0,
            'confidence': 'low',
            'explanation': "Using default 28-day cycle (model unavailable)"
        }

# Test the function
print("\n🧪 Testing prediction function...")
test_result = predict_next_period_date(
    current_cycle_day=15,
    mean_cycle_length=28,
    age=25
)
print(f"Test prediction: {test_result}")

print("\n🚀 Next Period Prediction Model is ready for Luna integration!")