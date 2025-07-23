
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables for models
models = {}

def load_models():
    """Load all ML models on startup with absolute paths"""
    print("🚀 STARTING MODEL LOADING DEBUG")
    print(f"📁 Current working directory: {os.getcwd()}")
    print(f"📂 Files in current directory: {os.listdir('.')}")
    
    # Use ABSOLUTE paths for Docker container
    base_path = "/app"
    models_dir = os.path.join(base_path, "models")
    
    print(f"🎯 Looking for models in: {models_dir}")
    
    if os.path.exists(models_dir):
        print(f"✅ Models directory exists!")
        print(f"📋 Models directory contents: {os.listdir(models_dir)}")
        for file in os.listdir(models_dir):
            file_path = os.path.join(models_dir, file)
            print(f"   📄 {file}: {os.path.getsize(file_path)} bytes")
    else:
        print("❌ Models directory does NOT exist!")
        print(f"📂 Available directories in {base_path}: {[d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))]}")
        
    print("Loading Luna's world-class ML models...")
    
    # Use ABSOLUTE paths in Docker container
    model_files = {
        'cycle_length': '/app/models/cycle_length_model_minimal.pkl',
        'menses_length': '/app/models/menses_length_model.pkl', 
        'next_period': '/app/models/next_period_predictor.pkl',
        'irregular_cycle': '/app/models/irregular_cycle_detector.pkl',
        'symptom_predictor': '/app/models/symptom_predictor.pkl'
    }
    
    for model_name, file_path in model_files.items():
        try:
            print(f"🔍 Attempting to load {model_name} from {file_path}")
            if os.path.exists(file_path):
                print(f"✅ File exists, loading {model_name}...")
                models[model_name] = joblib.load(file_path)
                print(f"✅ Successfully loaded {model_name}")
            else:
                print(f"❌ Model file not found: {file_path}")
        except Exception as e:
            print(f"❌ Error loading {model_name}: {e}")
            print(f"❌ Traceback: {traceback.format_exc()}")
    
    print(f"🎉 Successfully loaded {len(models)} models")
    print(f"📊 Loaded models: {list(models.keys())}")

# 🔥 LOAD MODELS IMMEDIATELY WHEN MODULE IS IMPORTED
print("🔥 ABOUT TO LOAD MODELS - MODULE IMPORT")
load_models()
print("🔥 MODELS LOADING COMPLETE - MODULE IMPORT")

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Luna ML API',
        'models_loaded': len(models),
        'available_endpoints': [
            '/health',
            '/predict/cycle-length',
            '/predict/menses-length', 
            '/predict/next-period',
            '/detect/irregular-cycle',
            '/predict/symptoms'
        ]
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Detailed health check"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': len(models),
        'models': {
            'cycle_length': '0.09 MAE Champion' if 'cycle_length' in models else 'Not loaded',
            'menses_length': '0.26 MAE Excellence' if 'menses_length' in models else 'Not loaded',
            'irregular_detection': 'Perfect AUC 1.000' if 'irregular_cycle' in models else 'Not loaded',
            'symptom_prediction': '90%+ Accuracy' if 'symptom_predictor' in models else 'Not loaded',
            'next_period': 'Backup Model' if 'next_period' in models else 'Not loaded'
        },
        'message': 'Luna ML models ready to serve world-class predictions!'
    })

@app.route('/predict/cycle-length', methods=['POST', 'OPTIONS'])
def predict_cycle_length():
    """Use your CHAMPION 0.09 MAE cycle length model"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        
        if 'cycle_length' not in models:
            return jsonify({'error': 'Cycle length model not loaded'}), 500
        
        # Use your champion cycle model's exact features
        features = pd.DataFrame([[
            data.get('LengthofMenses', 5),
            data.get('Age', 25),
            data.get('BMI', 25),
            data.get('EstimatedDayofOvulation', 14),
            data.get('LengthofLutealPhase', 14),
            data.get('TotalDaysofFertility', 6)
        ]], columns=[
            'LengthofMenses', 'Age', 'BMI', 'EstimatedDayofOvulation', 
            'LengthofLutealPhase', 'TotalDaysofFertility'
        ])
        
        # Use YOUR 0.09 MAE champion model!
        prediction = models['cycle_length'].predict(features)[0]
        
        return jsonify({
            'predicted_cycle_length': round(prediction, 1),
            'model_accuracy': '0.09 days MAE - World Champion!',
            'confidence': 'high',
            'explanation': f'Your cycle length: {prediction:.1f} days'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'predicted_cycle_length': 28.0,
            'confidence': 'low'
        }), 500

@app.route('/predict/menses-length', methods=['POST', 'OPTIONS'])
def predict_menses_length():
    """Use your EXCELLENT 0.26 MAE menses length model"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        
        if 'menses_length' not in models:
            return jsonify({'error': 'Menses length model not loaded'}), 500
        
        # Use your excellent menses model's exact features
        features = pd.DataFrame([[
            data.get('Age', 25),
            data.get('BMI', 25),
            data.get('LengthofCycle', 28),
            data.get('MeanBleedingIntensity', 5),
            data.get('EstimatedDayofOvulation', 14)
        ]], columns=[
            'Age', 'BMI', 'LengthofCycle', 'MeanBleedingIntensity', 'EstimatedDayofOvulation'
        ])
        
        prediction = models['menses_length'].predict(features)[0]
        
        return jsonify({
            'predicted_menses_length': round(prediction, 1),
            'model_accuracy': '0.26 days MAE - Excellent!',
            'confidence': 'high',
            'explanation': f'Your period length: {prediction:.1f} days'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'predicted_menses_length': 5.0,
            'confidence': 'low'
        }), 500

@app.route('/predict/next-period', methods=['POST', 'OPTIONS'])
def predict_next_period():
    """Combine your champion models for next period prediction"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        current_cycle_day = data.get('current_cycle_day', 1)
        
        if 'cycle_length' not in models:
            return jsonify({'error': 'Cycle length model not loaded'}), 500
        
        # Use your CHAMPION cycle length model
        cycle_features = pd.DataFrame([[
            data.get('LengthofMenses', 5),
            data.get('Age', 25),
            data.get('BMI', 25),
            data.get('EstimatedDayofOvulation', 14),
            data.get('LengthofLutealPhase', 14),
            data.get('TotalDaysofFertility', 6)
        ]], columns=[
            'LengthofMenses', 'Age', 'BMI', 'EstimatedDayofOvulation', 
            'LengthofLutealPhase', 'TotalDaysofFertility'
        ])
        
        # Get prediction from your 0.09 MAE champion!
        predicted_cycle_length = models['cycle_length'].predict(cycle_features)[0]
        
        # Calculate days until next period
        days_until = max(1, int(predicted_cycle_length - current_cycle_day))
        if days_until <= 0:
            days_until = int(predicted_cycle_length + days_until)
        
        # Determine confidence
        cycles_logged = data.get('cycles_logged', 0)
        confidence = 'high' if cycles_logged >= 3 else 'medium' if cycles_logged >= 1 else 'low'
        
        return jsonify({
            'days_until_next_period': days_until,
            'predicted_cycle_length': round(predicted_cycle_length, 1),
            'confidence': confidence,
            'explanation': f'Next period in {days_until} days (based on {predicted_cycle_length:.1f}-day cycle)',
            'model_accuracy': '0.09 MAE Champion Model Used!'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'days_until_next_period': 14,
            'predicted_cycle_length': 28.0,
            'confidence': 'low'
        }), 500

@app.route('/detect/irregular-cycle', methods=['POST', 'OPTIONS'])
def detect_irregular_cycle():
    """Use your PERFECT AUC irregular cycle detector"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        
        if 'irregular_cycle' not in models:
            return jsonify({'error': 'Irregular cycle model not loaded'}), 500
        
        # Prepare features for your perfect AUC model
        cycle_lengths = data.get('recent_cycle_lengths', [28])
        mean_length = np.mean(cycle_lengths)
        variability = np.std(cycle_lengths) if len(cycle_lengths) > 1 else 0
        
        features = pd.DataFrame([[
            cycle_lengths[0] if cycle_lengths else 28,  # CycleLength
            mean_length,                                 # MeanCycleLength  
            variability,                                # CycleVariability
            1 if cycle_lengths[0] < 21 else 0,         # CycleTooShort
            1 if cycle_lengths[0] > 35 else 0,         # CycleTooLong
            data.get('cycle_with_peak', 1),            # CycleWithPeak
            1 if data.get('cycle_with_peak', 1) == 0 else 0,  # NoOvulationDetected
            data.get('luteal_phase_length', 14),       # LutealPhaseLength
            1 if data.get('luteal_phase_length', 14) < 10 else 0,  # LutealPhaseTooShort
            1 if data.get('luteal_phase_length', 14) > 16 else 0,  # LutealPhaseTooLong
            data.get('menses_length', 5),              # MensesLength
            1 if data.get('menses_length', 5) < 3 else 0,      # MensesTooShort
            1 if data.get('menses_length', 5) > 7 else 0,      # MensesTooLong
            data.get('unusual_bleeding', 0),           # UnusualBleeding
            data.get('bleeding_intensity', 5),         # BleedingIntensity
            1 if data.get('bleeding_intensity', 5) > 10 else 0,  # VeryHeavyBleeding
            1 if data.get('bleeding_intensity', 5) < 3 else 0,   # VeryLightBleeding
            data.get('age', 25),                       # Age
            data.get('bmi', 25),                       # BMI
            1 if data.get('bmi', 25) < 18.5 else 0,   # UnderweightBMI
            1 if data.get('bmi', 25) > 25 else 0,      # OverweightBMI
            1 if data.get('bmi', 25) > 30 else 0,      # ObeseBMI
            data.get('number_pregnancies', 0),         # NumberPregnancies
            1 if (data.get('age', 25) > 30 and data.get('number_pregnancies', 0) == 0) else 0,  # NullipariousAdult
            1 if data.get('age', 25) < 20 else 0,      # TeenageYears
            1 if data.get('age', 25) > 40 else 0,      # Perimenopause
            # PCOS Risk Score
            sum([
                1 if cycle_lengths[0] > 35 else 0,
                1 if data.get('cycle_with_peak', 1) == 0 else 0,
                1 if data.get('bmi', 25) > 30 else 0,
                data.get('unusual_bleeding', 0)
            ]),
            # Hormonal Imbalance Score  
            (variability / 5 + 
             (1 if data.get('luteal_phase_length', 14) < 10 else 0) +
             (1 if data.get('bleeding_intensity', 5) > 10 else 0) +
             (1 if data.get('bleeding_intensity', 5) < 3 else 0))
        ]], columns=[
            'CycleLength', 'MeanCycleLength', 'CycleVariability',
            'CycleTooShort', 'CycleTooLong', 'CycleWithPeak', 'NoOvulationDetected',
            'LutealPhaseLength', 'LutealPhaseTooShort', 'LutealPhaseTooLong',
            'MensesLength', 'MensesTooShort', 'MensesTooLong',
            'UnusualBleeding', 'BleedingIntensity', 'VeryHeavyBleeding', 'VeryLightBleeding',
            'Age', 'BMI', 'UnderweightBMI', 'OverweightBMI', 'ObeseBMI',
            'NumberPregnancies', 'NullipariousAdult', 'TeenageYears', 'Perimenopause',
            'PCOSRiskScore', 'HormonalImbalanceScore'
        ])
        
        # Use YOUR perfect AUC model!
        irregular_prob = models['irregular_cycle'].predict_proba(features)[0, 1]
        is_irregular = models['irregular_cycle'].predict(features)[0]
        
        # Generate warnings
        warnings = []
        recommendations = []
        
        if cycle_lengths[0] > 35:
            warnings.append("Long cycles detected")
            recommendations.append("Monitor for PCOS symptoms")
        if variability > 7:
            warnings.append("High cycle variability") 
            recommendations.append("Track stress and lifestyle factors")
        if data.get('unusual_bleeding', 0):
            warnings.append("Unusual bleeding patterns")
            recommendations.append("Discuss with healthcare provider")
            
        return jsonify({
            'is_irregular': bool(is_irregular),
            'irregular_probability': round(irregular_prob, 3),
            'risk_level': 'high' if irregular_prob >= 0.7 else 'medium' if irregular_prob >= 0.4 else 'low',
            'warnings': warnings,
            'recommendations': recommendations,
            'model_accuracy': 'Perfect AUC 1.000!',
            'pcos_risk_score': int(features.iloc[0]['PCOSRiskScore'])
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'is_irregular': False,
            'irregular_probability': 0.0,
            'risk_level': 'low',
            'warnings': [],
            'recommendations': []
        }), 500

@app.route('/predict/symptoms', methods=['POST', 'OPTIONS'])  
def predict_symptoms():
    """Use your 90%+ accuracy symptom prediction model"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        
        if 'symptom_predictor' not in models:
            return jsonify({'error': 'Symptom predictor model not loaded'}), 500
        
        cycle_day = data.get('cycle_day', 1)
        cycle_length = data.get('cycle_length', 28)
        menses_length = data.get('menses_length', 5)
        
        # Prepare features for your 90%+ accuracy model
        features = pd.DataFrame([[
            cycle_day,                                    # cycle_day
            cycle_length,                                # cycle_length  
            menses_length,                               # menses_length
            max(0, cycle_day - 1),                       # days_since_period_start
            max(0, cycle_length - cycle_day),            # days_until_next_period
            1 if cycle_day <= menses_length else 0,      # is_period_phase
            1 if menses_length < cycle_day <= (cycle_length - 14 - 3) else 0,  # is_follicular_phase
            1 if (cycle_length - 14 - 3) < cycle_day <= (cycle_length - 14 + 3) else 0,  # is_ovulation_phase
            1 if (cycle_length - 14 + 3) < cycle_day <= (cycle_length - 5) else 0,  # is_luteal_phase
            1 if cycle_day > (cycle_length - 5) else 0,  # is_pms_phase
            min(cycle_day, menses_length) if cycle_day <= menses_length else 0,  # period_day
            (min(cycle_day, menses_length) / menses_length) if cycle_day <= menses_length and menses_length > 0 else 0,  # period_day_normalized
            data.get('age', 25),                         # age
            data.get('bmi', 25),                         # bmi
            data.get('pregnancies', 0),                  # pregnancies
            data.get('mean_bleeding_intensity', 5),      # mean_bleeding_intensity
            cycle_day / cycle_length,                    # cycle_day_ratio
            abs(cycle_day - (cycle_length - 14)) / cycle_length,  # ovulation_proximity
            1 if data.get('age', 25) < 20 else 0,        # is_teenager
            1 if 20 <= data.get('age', 25) <= 35 else 0, # is_adult
            1 if data.get('age', 25) > 35 else 0         # is_older_adult
        ]], columns=[
            'cycle_day', 'cycle_length', 'menses_length', 'days_since_period_start',
            'days_until_next_period', 'is_period_phase', 'is_follicular_phase',
            'is_ovulation_phase', 'is_luteal_phase', 'is_pms_phase',
            'period_day', 'period_day_normalized', 'age', 'bmi', 'pregnancies',
            'mean_bleeding_intensity', 'cycle_day_ratio', 'ovulation_proximity',
            'is_teenager', 'is_adult', 'is_older_adult'
        ])
        
        # Use YOUR 90%+ accuracy symptom model!
        predictions = models['symptom_predictor'].predict(features)[0]
        
        # [cramp_intensity, flow_intensity, fatigue_level, mood_impact, overall_discomfort]
        def get_description(intensity):
            if intensity <= 2: return 'None to minimal'
            if intensity <= 4: return 'Mild'
            if intensity <= 6: return 'Moderate'
            if intensity <= 8: return 'Strong'
            return 'Severe'
        
        # Determine cycle phase for context
        if cycle_day <= menses_length:
            phase = "menstrual"
            phase_message = f"Day {cycle_day} of your period"
        elif cycle_day > (cycle_length - 5):
            phase = "pms"
            phase_message = f"{cycle_length - cycle_day + 1} days until period"
        elif abs(cycle_day - (cycle_length - 14)) <= 2:
            phase = "ovulation"
            phase_message = "Around ovulation time"
        else:
            phase = "follicular" if cycle_day <= (cycle_length - 14) else "luteal"
            phase_message = f"{phase.title()} phase"
        
        return jsonify({
            'cramp_intensity': round(predictions[0], 1),
            'flow_intensity': round(predictions[1], 1),
            'fatigue_level': round(predictions[2], 1),
            'mood_impact': round(predictions[3], 1),
            'overall_discomfort': round(predictions[4], 1),
            'descriptions': {
                'cramps': get_description(predictions[0]),
                'flow': get_description(predictions[1]),
                'fatigue': get_description(predictions[2]),
                'mood': get_description(predictions[3]),
                'overall': get_description(predictions[4])
            },
            'phase': phase,
            'phase_message': phase_message,
            'model_accuracy': '90%+ accuracy within 1 point!',
            'confidence': 'high' if cycle_day <= menses_length or cycle_day > (cycle_length - 5) else 'medium'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'cramp_intensity': 2,
            'flow_intensity': 0,
            'fatigue_level': 3,
            'mood_impact': 2,
            'overall_discomfort': 2
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
