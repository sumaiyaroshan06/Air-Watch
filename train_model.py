
import pandas as pd
import joblib
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# Load the cleaned dataset
df = pd.read_csv("air_quality_cleaned.csv")
df["date"] = pd.to_datetime(df["date"])

# Use only pollutant measurements as input features.
# Do NOT include us_aqi because it was used to create the target.
features = [
    "pm10",
    "pm2_5",
    "carbon_monoxide",
    "nitrogen_dioxide",
    "sulphur_dioxide",
    "ozone",
    "aerosol_optical_depth",
    "dust",
    "uv_index"
]

X = df[features]
y = df["aqi_category"]

# Keep earlier dates for training and later dates for testing
split_index = int(len(df) * 0.8)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]
y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]

models = {
    "Decision Tree": DecisionTreeClassifier(
        max_depth=8, random_state=42
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        random_state=42,
        class_weight="balanced"
    ),
    "Logistic Regression": make_pipeline(
        StandardScaler(),
        LogisticRegression(max_iter=2000, class_weight="balanced")
    )
}

results = {}

print("Training records:", len(X_train))
print("Testing records:", len(X_test))

for name, model in models.items():
    print("\n" + "=" * 55)
    print(name)
    print("=" * 55)

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    results[name] = accuracy

    print(f"Accuracy: {accuracy:.2%}")
    print("\nClassification report:")
    print(classification_report(
        y_test,
        predictions,
        labels=[
            "Good",
            "Moderate",
            "Unhealthy for Sensitive Groups",
            "Unhealthy"
        ],
        zero_division=0
    ))

    print("Confusion matrix:")
    #plt.plot()
    plt.plot(confusion_matrix(
        y_test,
        predictions,
        labels=[
            "Good",
            "Moderate",
            "Unhealthy for Sensitive Groups",
            "Unhealthy"
        ]
    ))

# Select the model with the highest test accuracy
best_name = max(results, key=results.get)
best_model = models[best_name]

joblib.dump(
    {"model": best_model, "features": features},
    "air_quality_model.pkl"
)

print("\n" + "=" * 55)
print("MODEL COMPARISON")
print("=" * 55)

for name, accuracy in results.items():
    print(f"{name}: {accuracy:.2%}")

print("\nBest model by test accuracy:", best_name)
print("Saved as air_quality_model.pkl")
