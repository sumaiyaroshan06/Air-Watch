
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import math

app = Flask(__name__)
CORS(app)

# Load the trained Random Forest model
saved_data = joblib.load("air_quality_model.pkl")
model = saved_data["model"]
features = saved_data["features"]


# Home API
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "AirWatch Air Quality Prediction API is running!"
    })


# ML prediction API
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Send a valid JSON object."
        }), 400

    missing = [
        feature for feature in features
        if feature not in data
    ]

    if missing:
        return jsonify({
            "error": "Missing required pollutant measurements.",
            "missing_fields": missing
        }), 400

    try:
        values = {}

        for feature in features:
            value = float(data[feature])

            if not math.isfinite(value) or value < 0:
                raise ValueError()

            values[feature] = value

        input_data = pd.DataFrame(
            [values],
            columns=features
        )

        prediction = model.predict(input_data)[0]

        return jsonify({
            "predicted_category": str(prediction),
            "model": "Random Forest",
            "note": (
                "Prediction from supplied pollutant measurements; "
                "not a live sensor reading."
            )
        })

    except (ValueError, TypeError, OverflowError):
        return jsonify({
            "error": (
                "All measurements must be finite, "
                "non-negative numbers."
            )
        }), 400


# Historical air-quality data API
@app.route("/historical", methods=["GET"])
def historical():
    try:
        df = pd.read_csv("air_quality_historical.csv")

        columns = [
            "date",
            "pm2_5",
            "pm10",
            "us_aqi",
            "european_aqi"
        ]

        missing_columns = [
            col for col in columns
            if col not in df.columns
        ]

        if missing_columns:
            return jsonify({
                "error": "Required columns are missing.",
                "missing_columns": missing_columns
            }), 500

        df = df[columns].copy()
        df = df.dropna(subset=["date"])

        numeric_columns = [
            "pm2_5",
            "pm10",
            "us_aqi",
            "european_aqi"
        ]

        for col in numeric_columns:
            df[col] = pd.to_numeric(
                df[col], errors="coerce"
            )

        df = df.astype(object).where(
            pd.notna(df), None
        )

        return jsonify({
            "city": "Hyderabad",
            "total_records": len(df),
            "records": df.to_dict(orient="records")
        })

    except FileNotFoundError:
        return jsonify({
            "error": (
                "air_quality_historical.csv was not found. "
                "Place it in the project root folder."
            )
        }), 500

    except (KeyError, pd.errors.ParserError) as e:
        return jsonify({
            "error": "Could not read historical data.",
            "details": str(e)
        }), 500


# Historical high-pollution analysis API
@app.route("/hotspots", methods=["GET"])
def hotspots():
    try:
        df = pd.read_csv("air_quality_historical.csv")

        required = [
            "date",
            "us_aqi",
            "pm2_5",
            "pm10"
        ]

        missing = [
            col for col in required
            if col not in df.columns
        ]

        if missing:
            return jsonify({
                "error": "Required columns are missing.",
                "missing_columns": missing
            }), 500

        df = df[required].copy()

        for col in ["us_aqi", "pm2_5", "pm10"]:
            df[col] = pd.to_numeric(
                df[col], errors="coerce"
            )

        valid_aqi = df["us_aqi"].dropna()

        if valid_aqi.empty:
            return jsonify({
                "error": "No valid US AQI records are available."
            }), 404

        # Find the 90th-percentile AQI threshold
        threshold = float(valid_aqi.quantile(0.90))

        # Select dates at or above this threshold
        flagged = df[
            df["us_aqi"] >= threshold
        ].copy()

        flagged = flagged.sort_values(
            "us_aqi",
            ascending=False
        )

        # Make missing values safe for JSON
        flagged = flagged.astype(object).where(
            pd.notna(flagged), None
        )

        city_df = pd.read_csv("city_info.csv")

        if city_df.empty:
            return jsonify({
                "error": "No city information is available."
            }), 500

        city = city_df.iloc[0]

        # Use the actual city-name column if present
        city_name = (
            str(city["city_name"])
            if "city_name" in city_df.columns
            else "Hyderabad"
        )

        return jsonify({
            "city": city_name,
            "latitude": float(city["latitude"]),
            "longitude": float(city["longitude"]),
            "analysis_type": "Historical high-AQI dates",
            "threshold_method": (
                "90th percentile of valid US AQI records"
            ),
            "aqi_threshold": round(threshold, 2),
            "records_analyzed": int(len(valid_aqi)),
            "high_pollution_days": flagged.to_dict(
                orient="records"
            ),
            "limitation": (
                "This identifies high-pollution dates for "
                "city-level data, not separate neighborhood "
                "hotspots."
            )
        })

    except FileNotFoundError as e:
        return jsonify({
            "error": "A required dataset file could not be found.",
            "details": str(e)
        }), 500

    except (
        KeyError,
        IndexError,
        ValueError,
        TypeError,
        OverflowError,
        pd.errors.ParserError
    ) as e:
        return jsonify({
            "error": "Could not analyze the historical dataset.",
            "details": str(e)
        }), 500


# Start Flask AFTER all routes have been defined
if __name__ == "__main__":
    app.run(debug=True, port=5000)
