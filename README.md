# AirWatch – AI-Based Air Pollution Monitoring and Hotspot Detection System

## Overview

AirWatch is an AI-powered air quality monitoring and prediction system designed to analyze pollution levels, predict air quality categories, and identify historical pollution hotspots using machine learning.

The system uses pollutant concentrations and environmental parameters to generate air quality predictions and provide insights into historical pollution patterns through an interactive web dashboard.

## Key Features

- **Air Quality Prediction:** Uses a Random Forest classifier to predict air quality categories based on pollutant concentrations.
- **Interactive Dashboard:** Displays air quality statistics, pollutant information, and historical trends.
- **Pollutant Analysis:** Analyzes PM2.5, PM10, CO, NO₂, SO₂, Ozone, and other environmental parameters.
- **Historical Hotspot Detection:** Identifies dates with significantly elevated AQI values using historical pollution records.
- **REST API Integration:** Uses Flask-based REST APIs to connect the machine learning model with the React frontend.
- **Real-Time Predictions:** Accepts pollutant values and returns predicted air quality categories through the application.
- **Data Visualization:** Presents pollution trends and insights through interactive charts.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, HTML, CSS, JavaScript |
| Backend | Python, Flask |
| Machine Learning | Scikit-learn, Random Forest |
| Data Processing | Pandas, NumPy |
| Model Serialization | Joblib |
| API Integration | REST API |

## Machine Learning Approach

AirWatch uses supervised machine learning to classify air quality based on pollutant concentrations and environmental parameters.

**Algorithm:** Random Forest Classifier

**Input Features:**
- PM2.5
- PM10
- Carbon Monoxide (CO)
- Nitrogen Dioxide (NO₂)
- Sulfur Dioxide (SO₂)
- Ozone (O₃)
- Aerosol
- Dust
- UV Index

**Prediction Output:**

The model classifies air quality into the following categories:

- Good
- Moderate
- Unhealthy for Sensitive Groups (USG)
- Unhealthy

## System Architecture

AirWatch follows a frontend-backend architecture consisting of the following components:

1. **Frontend:** React.js provides an interactive dashboard for displaying air quality information and accepting user inputs.
2. **Backend:** Flask handles API requests and processes prediction requests.
3. **Machine Learning Model:** The trained Random Forest model generates air quality predictions.
4. **Dataset:** Historical air quality records are used for model training, analysis, and hotspot identification.
5. **REST APIs:** Enable communication between the frontend and backend for predictions and historical data retrieval.

## Project Structure

```text
air-pollution-monitor/
│
├── app.py
├── prepare_dataset.py
├── train_model.py
│
├── air_quality_cleaned.csv
├── air_quality_historical.csv
├── air_quality_model.pkl
├── city_info.csv
├── data_dictionary.csv
├── dataset-metadata.json
│
├── src/
│   ├── App.js
│   ├── App.css
│   └── inspect_dataset.py
│
└── README.md
```

## Installation and Setup

### Prerequisites

- Python 3.x
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd air-pollution-monitor
```

### 2. Backend Setup

Install the required Python dependencies:

```bash
pip install flask flask-cors pandas numpy scikit-learn joblib
```

Start the Flask backend:

```bash
python app.py
```

The backend will run at:

```text
http://127.0.0.1:5000
```

### 3. Frontend Setup

Open a new terminal and install the dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm start
```

The frontend will be available at:

```text
http://localhost:3000
```

## REST API Endpoints

| Endpoint | HTTP Method | Description |
|---|---|---|
| `/` | GET | Checks backend server status |
| `/predict` | POST | Predicts air quality based on pollutant values |
| `/historical` | GET | Retrieves historical pollution data and hotspot information |

## Historical Hotspot Detection

AirWatch analyzes historical AQI records to identify periods of elevated pollution.

The current implementation identifies high-pollution dates using AQI thresholds rather than geographical sensor locations.

This approach helps analyze historical pollution patterns and recognize periods of increased air pollution.

## Project Objectives

- Develop an AI-based air quality prediction system.
- Analyze pollutant concentrations and their relationship with air quality.
- Identify historical periods of elevated pollution.
- Integrate machine learning models with a full-stack web application.
- Provide an accessible platform for understanding air pollution patterns.

## Future Enhancements

- Integration with live air quality monitoring APIs.
- Geographical pollution mapping and location-based hotspot detection.
- Improved prediction accuracy using advanced machine learning models.
- Automated alerts for elevated pollution levels.
- Integration with IoT-based air quality sensors.

## Disclaimer

AirWatch currently uses historical air quality datasets and user-provided pollutant values for analysis and predictions. It does not directly collect live readings from physical air quality sensors.

---

**AirWatch – Making Air Quality Insights More Accessible Through Artificial Intelligence.**
