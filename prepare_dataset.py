
import pandas as pd

df = pd.read_csv("air_quality_historical.csv")

# Convert date into a proper date format
df["date"] = pd.to_datetime(df["date"], errors="coerce")

# Features used to estimate air quality
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

# Keep rows with a known US AQI target
df = df.dropna(subset=["us_aqi"]).copy()

# Fill missing feature values with each column's median
for column in features:
    df[column] = df[column].fillna(df[column].median())

# Remove rows if a feature has no usable values at all
df = df.dropna(subset=features)

# Assign AQI categories
def classify_aqi(aqi):
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"

df["aqi_category"] = df["us_aqi"].apply(classify_aqi)

# Save the cleaned data
df.to_csv("air_quality_cleaned.csv", index=False)

print("Dataset cleaned successfully!")
print("Rows and columns:", df.shape)
print("\nMissing values:")
print(df[features + ["us_aqi", "aqi_category"]].isnull().sum())

print("\nAQI category distribution:")
print(df["aqi_category"].value_counts())

print("\nFirst five cleaned records:")
print(df[["date", "pm2_5", "pm10", "us_aqi",
          "aqi_category"]].head().to_string(index=False))
