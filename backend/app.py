from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)  

# Load the trained model and scaler
model = joblib.load("car_price_model.pkl")
scaler = joblib.load("scaler.pkl")

@app.route("/")
def home():
    return "Car Price Predictor API is running!"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        features = np.array([data["features"]])  # Convert input to numpy array

        # Scale the input features
        features_scaled = scaler.transform(features)

        # Predict price
        predicted_price = model.predict(features_scaled)

        return jsonify({"predicted_price": round(predicted_price[0], 2)})
    
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
