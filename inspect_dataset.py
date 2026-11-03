
import pandas as pd
import json

files = [
    "air_quality_historical.csv",
    "city_info.csv",
    "data_dictionary.csv"
]

for file in files:
    print("\n" + "=" * 60)
    print("FILE:", file)
    print("=" * 60)

    df = pd.read_csv(file)

    print("Shape (rows, columns):", df.shape)
    print("\nColumn names:")
    print(df.columns.tolist())

    print("\nFirst 5 rows:")
    print(df.head().to_string())

    print("\nMissing values in important columns:")
    print(df.isnull().sum().to_string())

print("\n" + "=" * 60)
print("DATASET METADATA")
print("=" * 60)

with open("dataset-metadata.json", "r", encoding="utf-8") as f:
    metadata = json.load(f)

print(json.dumps(metadata, indent=2))
