import joblib
import numpy as np

# Load the trained model and scaler
model = joblib.load("car_price_model.pkl")
scaler = joblib.load("scaler.pkl")

# Example: Predict price for a new car
sample_data = np.array([[50000, 1, 3.5, 1, 0, 1]])  
sample_data_scaled = scaler.transform(sample_data)

predicted_price = model.predict(sample_data_scaled)
print("Predicted Price: $", round(predicted_price[0], 2))
