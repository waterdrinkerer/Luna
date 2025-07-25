# Run this to get detailed model performance insights
import pandas as pd
import joblib
import numpy as np
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import matplotlib.pyplot as plt

def evaluate_model_performance(model_path, test_data_path, features, target):
    """
    Comprehensive model evaluation for period tracking ML models
    """
    
    # Load model and test data
    model = joblib.load(model_path)
    df = pd.read_csv(test_data_path)
    
    # Prepare test data
    X_test = df[features]
    y_test = df[target]
    
    # Make predictions
    predictions = model.predict(X_test)
    
    # Calculate metrics
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    
    # Calculate prediction ranges
    error_distribution = np.abs(predictions - y_test)
    within_1_day = np.sum(error_distribution <= 1) / len(error_distribution) * 100
    within_2_days = np.sum(error_distribution <= 2) / len(error_distribution) * 100
    
    print(f"📊 Model Performance for {target}:")
    print(f"   MAE: {mae:.2f} days")
    print(f"   R²: {r2:.3f}")
    print(f"   RMSE: {rmse:.2f} days")
    print(f"   Within 1 day: {within_1_day:.1f}%")
    print(f"   Within 2 days: {within_2_days:.1f}%")
    
    # Feature importance
    if hasattr(model, 'feature_importances_'):
        feature_importance = pd.DataFrame({
            'feature': features,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\n🔍 Feature Importance:")
        for _, row in feature_importance.iterrows():
            print(f"   {row['feature']}: {row['importance']:.3f}")
    
    return {
        'mae': mae,
        'r2': r2,
        'rmse': rmse,
        'within_1_day': within_1_day,
        'within_2_days': within_2_days,
        'predictions': predictions,
        'actual': y_test
    }

# Evaluate Cycle Length Model
cycle_features = ['LengthofMenses', 'Age', 'BMI','EstimatedDayofOvulation','LengthofLutealPhase','TotalDaysofFertility']
cycle_results = evaluate_model_performance(
    "cycle_length_model_minimal.pkl",
    "data/improved_cycle_length_model_data.csv",
    cycle_features,
    'LengthofCycle'
)

print("\n" + "="*50)

# Evaluate Menses Length Model  
menses_features = ['Age', 'BMI', 'LengthofCycle', 'MeanBleedingIntensity', 'EstimatedDayofOvulation']
menses_results = evaluate_model_performance(
    "menses_length_model.pkl", 
    "data/cleaned_menses_length_data2.csv",
    menses_features,
    'LengthofMenses'
)

# Production Readiness Assessment
print("\n" + "="*50)
print("🚀 PRODUCTION READINESS ASSESSMENT:")

def assess_production_readiness(results, model_name):
    mae = results['mae']
    r2 = results['r2']
    within_2_days = results['within_2_days']
    
    print(f"\n{model_name}:")
    
    # MAE Assessment
    if mae <= 1.5:
        print(f"   ✅ Excellent MAE ({mae:.2f} days)")
    elif mae <= 3.0:
        print(f"   ⚠️  Acceptable MAE ({mae:.2f} days)")
    else:
        print(f"   ❌ Poor MAE ({mae:.2f} days) - needs improvement")
    
    # R² Assessment
    if r2 >= 0.7:
        print(f"   ✅ Strong R² ({r2:.3f})")
    elif r2 >= 0.5:
        print(f"   ⚠️  Moderate R² ({r2:.3f})")
    else:
        print(f"   ❌ Weak R² ({r2:.3f}) - needs improvement")
    
    # Practical accuracy
    if within_2_days >= 80:
        print(f"   ✅ High accuracy ({within_2_days:.1f}% within 2 days)")
    elif within_2_days >= 60:
        print(f"   ⚠️  Moderate accuracy ({within_2_days:.1f}% within 2 days)")
    else:
        print(f"   ❌ Low accuracy ({within_2_days:.1f}% within 2 days)")

assess_production_readiness(cycle_results, "Cycle Length Model")
assess_production_readiness(menses_results, "Menses Length Model")