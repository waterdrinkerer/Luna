import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Load the cleaned minimal dataset
df = pd.read_csv("data/improved_cycle_length_model_data.csv")
# Define features and target
features = ['LengthofMenses', 'Age', 'BMI','EstimatedDayofOvulation','LengthofLutealPhase','TotalDaysofFertility']
target = 'LengthofCycle'

X = df[features]
y = df[target]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model = RandomForestRegressor(random_state=42)
model.fit(X_train, y_train)

# Predict and evaluate
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print(f"Mean Absolute Error: {mae:.2f} days")
print(f"R² Score: {r2:.2f}")

# Save the model for future use
joblib.dump(model, "cycle_length_model_minimal.pkl")
print("✅ Model saved as cycle_length_model_minimal.pkl")
