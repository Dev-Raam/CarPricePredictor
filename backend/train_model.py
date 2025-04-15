import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LinearRegression
import joblib
import re  

# Load the dataset
df = pd.read_csv("data/used_cars.csv")

# Clean the data
# Remove "mi." and commas from milage, then convert to float
df["milage"] = df["milage"].str.replace(" mi.", "").str.replace(",", "").astype(float)

# Remove "$" and commas from price, then convert to float
df["price"] = df["price"].str.replace("$", "").str.replace(",", "").astype(float)

# Convert "Yes" -> 1 and "No" -> 0 for clean_title
df["clean_title"] = df["clean_title"].map({"Yes": 1, "No": 0})

# Convert accident column: if it contains "None reported" -> 0, otherwise 1
df["accident"] = df["accident"].apply(lambda x: 0 if "None reported" in str(x) else 1)

# Extract numeric engine size (e.g., "260.0HP 4.0L V6 Cylinder Engine Gasoline Fuel" → 4.0)
df["engine"] = df["engine"].apply(lambda x: float(re.search(r"(\d+(\.\d+)?)L", str(x)).group(1)) if re.search(r"(\d+(\.\d+)?)L", str(x)) else np.nan)

# Select relevant features & target variable
features = ["milage", "fuel_type", "engine", "transmission", "accident", "clean_title"]
target = "price"

# Drop rows with missing values
df = df.dropna(subset=features + [target])

# Convert categorical data (fuel_type, transmission) to numbers
label_encoders = {}
for col in ["fuel_type", "transmission"]:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])  # Convert categories to numbers
    label_encoders[col] = le  # Save encoders for future use

# Prepare training data
X = df[features]
y = df[target]

# Split data into training & testing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Standardize numerical features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Train the model
model = LinearRegression()
model.fit(X_train, y_train)

# Save the trained model, scaler & encoders
joblib.dump(model, "car_price_model.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(label_encoders, "label_encoders.pkl")

print("✅ Model trained and saved successfully!")
