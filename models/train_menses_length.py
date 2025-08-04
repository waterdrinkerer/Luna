import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Load the cleaned dataset
df = pd.read_csv("models/data/cleaned_menses_length_data2.csv")

# Define features and target
features = [
    'Age',
    'BMI',
    'LengthofCycle',
    'MeanBleedingIntensity',
    'EstimatedDayofOvulation'
]
target = 'LengthofMenses'

# ✅ Clean up blank strings and missing values
df[features + [target]] = df[features + [target]].replace(r'^\s*$', pd.NA, regex=True)
df = df.dropna(subset=features + [target])

# Prepare data
X = df[features]
y = df[target]

# Split into train and test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestRegressor(random_state=42)
model.fit(X_train, y_train)

# Make predictions and evaluate
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print(f"🩸 Mean Absolute Error: {mae:.2f} days")
print(f"📈 R² Score: {r2:.2f}")

# Save model
joblib.dump(model, "menses_length_model.pkl")
print("✅ Model saved as menses_length_model.pkl")
