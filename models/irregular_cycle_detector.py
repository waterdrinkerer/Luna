# ⚠️ Irregular Cycle Detection Model for Luna
# This model detects PCOS, hormonal imbalances, and cycle irregularities

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib

# Load the dataset
print("📊 Loading dataset for Irregular Cycle Detection...")
df = pd.read_csv("data/menstrual_data.csv")

print(f"Original dataset shape: {df.shape}")

# ===================================
# FEATURE ENGINEERING FOR IRREGULARITY DETECTION
# ===================================

def create_irregularity_features(df):
    """
    Create features for detecting irregular cycles and potential health issues
    """
    print("🔧 Engineering features for irregularity detection...")
    
    # Clean the data
    df_clean = df.copy()
    
    # Convert string columns to numeric, handling blanks
    numeric_columns = ['LengthofCycle', 'MeanCycleLength', 'EstimatedDayofOvulation', 
                      'LengthofLutealPhase', 'TotalDaysofFertility', 'Age', 'BMI',
                      'LengthofMenses', 'MeanMensesLength', 'UnusualBleeding',
                      'CycleWithPeakorNot', 'Numberpreg', 'MeanBleedingIntensity']
    
    for col in numeric_columns:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
    
    # Drop rows with missing critical data
    df_clean = df_clean.dropna(subset=['LengthofCycle', 'Age'])
    
    # === FEATURES FOR IRREGULARITY DETECTION ===
    features_df = pd.DataFrame()
    
    # 1. Cycle length characteristics
    features_df['CycleLength'] = df_clean['LengthofCycle']
    features_df['MeanCycleLength'] = df_clean['MeanCycleLength'].fillna(df_clean['LengthofCycle'])
    
    # 2. Cycle variability (key indicator of irregularity)
    features_df['CycleVariability'] = abs(features_df['CycleLength'] - features_df['MeanCycleLength'])
    
    # 3. Cycle length categories (medical standards)
    features_df['CycleTooShort'] = (features_df['CycleLength'] < 21).astype(int)  # < 21 days
    features_df['CycleTooLong'] = (features_df['CycleLength'] > 35).astype(int)   # > 35 days
    features_df['CycleNormal'] = ((features_df['CycleLength'] >= 21) & 
                                 (features_df['CycleLength'] <= 35)).astype(int)
    
    # 4. Ovulation indicators
    features_df['CycleWithPeak'] = df_clean['CycleWithPeakorNot'].fillna(1)
    features_df['NoOvulationDetected'] = (features_df['CycleWithPeak'] == 0).astype(int)
    
    # 5. Luteal phase characteristics
    features_df['LutealPhaseLength'] = df_clean['LengthofLutealPhase'].fillna(14)
    features_df['LutealPhaseTooShort'] = (features_df['LutealPhaseLength'] < 10).astype(int)
    features_df['LutealPhaseTooLong'] = (features_df['LutealPhaseLength'] > 16).astype(int)
    
    # 6. Menstrual characteristics
    features_df['MensesLength'] = df_clean['LengthofMenses'].fillna(5)
    features_df['MensesTooShort'] = (features_df['MensesLength'] < 3).astype(int)
    features_df['MensesTooLong'] = (features_df['MensesLength'] > 7).astype(int)
    
    # 7. Bleeding abnormalities
    features_df['UnusualBleeding'] = df_clean['UnusualBleeding'].fillna(0)
    features_df['BleedingIntensity'] = df_clean['MeanBleedingIntensity'].fillna(5)
    features_df['VeryHeavyBleeding'] = (features_df['BleedingIntensity'] > 10).astype(int)
    features_df['VeryLightBleeding'] = (features_df['BleedingIntensity'] < 3).astype(int)
    
    # 8. Demographics and risk factors
    features_df['Age'] = df_clean['Age']
    features_df['BMI'] = df_clean['BMI'].fillna(25)
    features_df['UnderweightBMI'] = (features_df['BMI'] < 18.5).astype(int)
    features_df['OverweightBMI'] = (features_df['BMI'] > 25).astype(int)
    features_df['ObeseBMI'] = (features_df['BMI'] > 30).astype(int)
    
    # 9. Reproductive history
    features_df['NumberPregnancies'] = df_clean['Numberpreg'].fillna(0)
    features_df['NullipariousAdult'] = ((features_df['Age'] > 30) & 
                                       (features_df['NumberPregnancies'] == 0)).astype(int)
    
    # 10. Age-related factors
    features_df['TeenageYears'] = (features_df['Age'] < 20).astype(int)
    features_df['Perimenopause'] = (features_df['Age'] > 40).astype(int)
    
    # 11. Complex indicators
    features_df['PCOSRiskScore'] = (
        features_df['CycleTooLong'] + 
        features_df['NoOvulationDetected'] + 
        features_df['ObeseBMI'] + 
        features_df['UnusualBleeding']
    )
    
    features_df['HormonalImbalanceScore'] = (
        features_df['CycleVariability'] / 5 +  # Normalize variability
        features_df['LutealPhaseTooShort'] + 
        features_df['VeryHeavyBleeding'] + 
        features_df['VeryLightBleeding']
    )
    
    # === CREATE TARGET VARIABLE ===
    # Define irregularity based on medical criteria
    irregular_conditions = (
        (features_df['CycleVariability'] > 7) |  # High cycle variability
        (features_df['CycleTooShort'] == 1) |    # Cycle < 21 days
        (features_df['CycleTooLong'] == 1) |     # Cycle > 35 days
        (features_df['NoOvulationDetected'] == 1) |  # No ovulation
        (features_df['LutealPhaseTooShort'] == 1) |  # Luteal phase < 10 days
        (features_df['UnusualBleeding'] == 1) |     # Unusual bleeding
        (features_df['MensesTooShort'] == 1) |      # Menses < 3 days
        (features_df['MensesTooLong'] == 1)         # Menses > 7 days
    )
    
    target = irregular_conditions.astype(int)
    
    print(f"✅ Features created: {features_df.shape}")
    print(f"Irregular cycles detected: {target.sum()} out of {len(target)} ({target.mean()*100:.1f}%)")
    
    return features_df, target

# Create features
features_df, target = create_irregularity_features(df)

# Define feature columns for the model
feature_columns = [
    'CycleLength', 'MeanCycleLength', 'CycleVariability',
    'CycleTooShort', 'CycleTooLong', 'CycleWithPeak', 'NoOvulationDetected',
    'LutealPhaseLength', 'LutealPhaseTooShort', 'LutealPhaseTooLong',
    'MensesLength', 'MensesTooShort', 'MensesTooLong',
    'UnusualBleeding', 'BleedingIntensity', 'VeryHeavyBleeding', 'VeryLightBleeding',
    'Age', 'BMI', 'UnderweightBMI', 'OverweightBMI', 'ObeseBMI',
    'NumberPregnancies', 'NullipariousAdult', 'TeenageYears', 'Perimenopause',
    'PCOSRiskScore', 'HormonalImbalanceScore'
]

X = features_df[feature_columns]
y = target

print(f"📊 Final dataset shape: {X.shape}")
print(f"Features: {len(feature_columns)} features")

# ===================================
# TRAIN THE MODEL
# ===================================

# Split the data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training set: {X_train.shape}, Irregular: {y_train.sum()}/{len(y_train)}")
print(f"Test set: {X_test.shape}, Irregular: {y_test.sum()}/{len(y_test)}")

# Train the model
print("🚀 Training Irregular Cycle Detection Model...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight='balanced',  # Handle class imbalance
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate the model
predictions = model.predict(X_test)
prediction_proba = model.predict_proba(X_test)[:, 1]

# Calculate metrics
auc_score = roc_auc_score(y_test, prediction_proba)

print(f"\n🎯 IRREGULAR CYCLE DETECTION MODEL PERFORMANCE:")
print(f"   AUC Score: {auc_score:.3f}")
print(f"   Classification Report:")
print(classification_report(y_test, predictions, target_names=['Regular', 'Irregular']))

# Confusion Matrix
cm = confusion_matrix(y_test, predictions)
tn, fp, fn, tp = cm.ravel()
sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
specificity = tn / (tn + fp) if (tn + fp) > 0 else 0

print(f"\n📊 Detailed Metrics:")
print(f"   Sensitivity (True Positive Rate): {sensitivity:.3f}")
print(f"   Specificity (True Negative Rate): {specificity:.3f}")
print(f"   False Positive Rate: {fp / (fp + tn):.3f}")
print(f"   False Negative Rate: {fn / (fn + tp):.3f}")

# Feature importance
feature_importance = pd.DataFrame({
    'feature': feature_columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(f"\n🔍 Top 15 Most Important Features:")
for _, row in feature_importance.head(15).iterrows():
    print(f"   {row['feature']}: {row['importance']:.3f}")

# Save the model
joblib.dump(model, "irregular_cycle_detector.pkl")
print("\n✅ Irregular Cycle Detection Model saved as 'irregular_cycle_detector.pkl'")

# ===================================
# PRODUCTION UTILITY FUNCTIONS
# ===================================

def assess_cycle_irregularity(
    recent_cycle_lengths: list,
    mean_cycle_length: float,
    ovulation_detected: bool,
    luteal_phase_length: float,
    menses_length: float,
    unusual_bleeding: bool,
    bleeding_intensity: float,
    age: int,
    bmi: float,
    number_pregnancies: int = 0,
    model_path: str = "irregular_cycle_detector.pkl"
) -> dict:
    """
    Assess cycle irregularity for a Luna user
    
    Args:
        recent_cycle_lengths: List of recent cycle lengths (last 3-6 cycles)
        mean_cycle_length: Average cycle length
        ovulation_detected: Whether ovulation is typically detected
        luteal_phase_length: Length of luteal phase
        menses_length: Length of menstrual period
        unusual_bleeding: Whether user experiences unusual bleeding
        bleeding_intensity: Average bleeding intensity (1-10 scale)
        age: User's age
        bmi: User's BMI
        number_pregnancies: Number of previous pregnancies
        model_path: Path to the trained model
    
    Returns:
        Dictionary with irregularity assessment
    """
    
    # Load the model
    model = joblib.load(model_path)
    
    # Calculate cycle variability
    if len(recent_cycle_lengths) > 1:
        cycle_variability = np.std(recent_cycle_lengths)
    else:
        cycle_variability = 0
    
    # Use most recent cycle length
    current_cycle_length = recent_cycle_lengths[0] if recent_cycle_lengths else mean_cycle_length
    
    # Create feature vector matching training data
    features = np.array([[
        current_cycle_length,
        mean_cycle_length,
        cycle_variability,
        1 if current_cycle_length < 21 else 0,  # CycleTooShort
        1 if current_cycle_length > 35 else 0,  # CycleTooLong
        1 if ovulation_detected else 0,         # CycleWithPeak
        1 if not ovulation_detected else 0,     # NoOvulationDetected
        luteal_phase_length,
        1 if luteal_phase_length < 10 else 0,   # LutealPhaseTooShort
        1 if luteal_phase_length > 16 else 0,   # LutealPhaseTooLong
        menses_length,
        1 if menses_length < 3 else 0,          # MensesTooShort
        1 if menses_length > 7 else 0,          # MensesTooLong
        1 if unusual_bleeding else 0,           # UnusualBleeding
        bleeding_intensity,
        1 if bleeding_intensity > 10 else 0,    # VeryHeavyBleeding
        1 if bleeding_intensity < 3 else 0,     # VeryLightBleeding
        age,
        bmi,
        1 if bmi < 18.5 else 0,                 # UnderweightBMI
        1 if bmi > 25 else 0,                   # OverweightBMI
        1 if bmi > 30 else 0,                   # ObeseBMI
        number_pregnancies,
        1 if (age > 30 and number_pregnancies == 0) else 0,  # NullipariousAdult
        1 if age < 20 else 0,                   # TeenageYears
        1 if age > 40 else 0,                   # Perimenopause
        # Calculate complex scores
        sum([
            1 if current_cycle_length > 35 else 0,
            1 if not ovulation_detected else 0,
            1 if bmi > 30 else 0,
            1 if unusual_bleeding else 0
        ]),  # PCOSRiskScore
        (cycle_variability / 5 + 
         (1 if luteal_phase_length < 10 else 0) +
         (1 if bleeding_intensity > 10 else 0) +
         (1 if bleeding_intensity < 3 else 0))  # HormonalImbalanceScore
    ]])
    
    # Get prediction and probability
    irregularity_probability = model.predict_proba(features)[0, 1]
    is_irregular = model.predict(features)[0]
    
    # Determine risk level
    if irregularity_probability >= 0.7:
        risk_level = 'high'
    elif irregularity_probability >= 0.4:
        risk_level = 'medium'
    else:
        risk_level = 'low'
    
    # Generate recommendations
    recommendations = []
    warnings = []
    
    if current_cycle_length < 21:
        warnings.append("Very short cycles detected")
        recommendations.append("Consider tracking basal body temperature")
    
    if current_cycle_length > 35:
        warnings.append("Long cycles detected")
        recommendations.append("Monitor for PCOS symptoms")
    
    if not ovulation_detected:
        warnings.append("Ovulation not consistently detected")
        recommendations.append("Track cervical mucus changes")
    
    if cycle_variability > 7:
        warnings.append("High cycle variability")
        recommendations.append("Log stress and lifestyle factors")
    
    if unusual_bleeding:
        warnings.append("Unusual bleeding patterns")
        recommendations.append("Discuss with healthcare provider")
    
    if luteal_phase_length < 10:
        warnings.append("Short luteal phase")
        recommendations.append("Consider progesterone testing")
    
    # PCOS risk assessment
    pcos_risk_factors = [
        current_cycle_length > 35,
        not ovulation_detected,
        bmi > 30,
        unusual_bleeding
    ]
    pcos_risk_score = sum(pcos_risk_factors)
    
    return {
        'irregular_probability': round(irregularity_probability, 3),
        'is_irregular': bool(is_irregular),
        'risk_level': risk_level,
        'warnings': warnings,
        'recommendations': recommendations,
        'pcos_risk_score': pcos_risk_score,
        'pcos_risk_level': 'high' if pcos_risk_score >= 3 else 'medium' if pcos_risk_score >= 2 else 'low',
        'cycle_variability': round(cycle_variability, 1),
        'confidence': 'high' if len(recent_cycle_lengths) >= 3 else 'medium' if len(recent_cycle_lengths) >= 2 else 'low',
        'explanation': f"Based on {len(recent_cycle_lengths)} cycle(s) of data"
    }

# ===================================
# TEST THE PRODUCTION FUNCTION
# ===================================

print("\n🧪 Testing irregularity assessment function...")

# Test case 1: Regular cycle
regular_test = assess_cycle_irregularity(
    recent_cycle_lengths=[28, 29, 27, 28],
    mean_cycle_length=28,
    ovulation_detected=True,
    luteal_phase_length=14,
    menses_length=5,
    unusual_bleeding=False,
    bleeding_intensity=5,
    age=25,
    bmi=22,
    number_pregnancies=0
)

print(f"Regular cycle test: {regular_test}")

# Test case 2: Irregular cycle (potential PCOS)
irregular_test = assess_cycle_irregularity(
    recent_cycle_lengths=[45, 38, 52, 41],
    mean_cycle_length=44,
    ovulation_detected=False,
    luteal_phase_length=8,
    menses_length=3,
    unusual_bleeding=True,
    bleeding_intensity=2,
    age=27,
    bmi=32,
    number_pregnancies=0
)

print(f"Irregular cycle test: {irregular_test}")

print("\n🚀 Irregular Cycle Detection Model is ready for Luna integration!")