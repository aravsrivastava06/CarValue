
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
from pathlib import Path
import math

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# PROJECT PATHS AND MODEL
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "best_car_price_model.joblib"
DATA_PATH = BASE_DIR / "data" / "cars_numeric.csv"

model = joblib.load(MODEL_PATH)

REFERENCE_YEAR = 2020

# --------------------------------------------------
# LOAD VEHICLE DATASET
# --------------------------------------------------

if not DATA_PATH.exists():
    raise FileNotFoundError(
        f"Vehicle dataset not found: {DATA_PATH}"
    )

cars_df = pd.read_csv(DATA_PATH)

# Standardise vehicle names and create brand column.
cars_df["name"] = cars_df["name"].fillna("").astype(str).str.strip()

cars_df["brand"] = (
    cars_df["name"]
    .str.split()
    .str[0]
    .str.title()
)

# Convert relevant columns to numeric values.
numeric_columns = [
    "year",
    "selling_price",
    "km_driven",
    "engine",
    "max_power",
    "seats",
    "mileage"
]

for column in numeric_columns:
    if column in cars_df.columns:
        cars_df[column] = pd.to_numeric(
            cars_df[column],
            errors="coerce"
        )

# Remove records without essential catalogue information.
cars_df = cars_df.dropna(
    subset=["name", "year", "selling_price"]
).copy()

cars_df = cars_df[
    (cars_df["selling_price"] > 0) &
    (cars_df["year"] >= 1980) &
    (cars_df["year"] <= REFERENCE_YEAR)
].copy()

cars_df.reset_index(drop=True, inplace=True)

print(f"Vehicle catalogue loaded: {len(cars_df)} records")


# --------------------------------------------------
# HELPER: CONVERT DATAFRAME RECORDS TO JSON-SAFE DATA
# --------------------------------------------------

def clean_records(dataframe):
    records = dataframe.astype(object).where(
        pd.notna(dataframe), None
    ).to_dict(orient="records")

    cleaned = []

    for record in records:
        clean_record = {}

        for key, value in record.items():
            if hasattr(value, "item"):
                value = value.item()

            if isinstance(value, float) and not math.isfinite(value):
                value = None

            clean_record[key] = value

        cleaned.append(clean_record)

    return cleaned


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "CarValue vehicle valuation API is running!"
    })


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model": "Decision Tree Regression",
        "catalogue_records": len(cars_df)
    })


# --------------------------------------------------
# GET CATALOGUE FILTER OPTIONS
# --------------------------------------------------

@app.route("/api/cars/filters", methods=["GET"])
def car_filters():
    brands = sorted(
        cars_df["brand"].dropna().unique().tolist()
    )

    fuels = sorted(
        cars_df["fuel"].dropna().unique().tolist()
    )

    transmissions = sorted(
        cars_df["transmission"].dropna().unique().tolist()
    )

    seller_types = sorted(
        cars_df["seller_type"].dropna().unique().tolist()
    )

    return jsonify({
        "brands": brands,
        "fuel_types": fuels,
        "transmissions": transmissions,
        "seller_types": seller_types,
        "total_vehicles": len(cars_df)
    })


# --------------------------------------------------
# GET VEHICLES WITH SEARCH, FILTERS AND PAGINATION
# --------------------------------------------------

@app.route("/api/cars", methods=["GET"])
def get_cars():

    try:
        filtered = cars_df.copy()

        # Search by vehicle name or brand.
        search = request.args.get("search", "").strip()

        if search:
            search_mask = (
                filtered["name"].str.contains(
                    search, case=False, na=False
                ) |
                filtered["brand"].str.contains(
                    search, case=False, na=False
                )
            )

            filtered = filtered[search_mask]

        # Brand filter.
        brand = request.args.get("brand")

        if brand and brand.lower() != "all":
            filtered = filtered[
                filtered["brand"].str.lower() == brand.lower()
            ]

        # Fuel filter.
        fuel = request.args.get("fuel")

        if fuel and fuel.lower() != "all":
            filtered = filtered[
                filtered["fuel"].str.lower() == fuel.lower()
            ]

        # Transmission filter.
        transmission = request.args.get("transmission")

        if transmission and transmission.lower() != "all":
            filtered = filtered[
                filtered["transmission"].str.lower()
                == transmission.lower()
            ]

        # Minimum and maximum price.
        min_price = request.args.get("min_price")
        max_price = request.args.get("max_price")

        if min_price:
            filtered = filtered[
                filtered["selling_price"] >= float(min_price)
            ]

        if max_price:
            filtered = filtered[
                filtered["selling_price"] <= float(max_price)
            ]

        # Manufacturing year filters.
        min_year = request.args.get("min_year")
        max_year = request.args.get("max_year")

        if min_year:
            filtered = filtered[
                filtered["year"] >= int(min_year)
            ]

        if max_year:
            filtered = filtered[
                filtered["year"] <= int(max_year)
            ]

        # Sorting.
        sort = request.args.get("sort", "newest")

        sort_options = {
            "price_low": ("selling_price", True),
            "price_high": ("selling_price", False),
            "newest": ("year", False),
            "oldest": ("year", True)
        }

        sort_column, ascending = sort_options.get(
            sort, ("year", False)
        )

        filtered = filtered.sort_values(
            by=sort_column,
            ascending=ascending
        )

        # Pagination.
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(
            100,
            max(1, int(request.args.get("per_page", 12)))
        )

        total = len(filtered)
        total_pages = math.ceil(total / per_page)

        start = (page - 1) * per_page
        end = start + per_page

        page_data = filtered.iloc[start:end]

        return jsonify({
            "vehicles": clean_records(page_data),
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_vehicles": total,
                "total_pages": total_pages
            }
        })

    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid filter or pagination value."
        }), 400

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# PRICE PREDICTION
# --------------------------------------------------

@app.route("/api/predict", methods=["POST"])
def predict():

    try:
        data = request.get_json()

        if not isinstance(data, dict):
            return jsonify({
                "error": "Please provide valid JSON vehicle details."
            }), 400

        required_fields = [
            "brand",
            "year",
            "km_driven",
            "fuel",
            "seller_type",
            "transmission",
            "owner",
            "engine",
            "max_power",
            "seats"
        ]

        missing_fields = [
            field for field in required_fields
            if field not in data or data[field] in (None, "")
        ]

        if missing_fields:
            return jsonify({
                "error": "Missing required fields",
                "fields": missing_fields
            }), 400

        car_age = REFERENCE_YEAR - int(data["year"])

        if car_age < 0 or car_age > 40:
            return jsonify({
                "error": "Please enter a valid manufacturing year."
            }), 400

        input_data = pd.DataFrame([{
            "brand": str(data["brand"]).strip().title(),
            "car_age": car_age,
            "km_driven": float(data["km_driven"]),
            "fuel": str(data["fuel"]),
            "seller_type": str(data["seller_type"]),
            "transmission": str(data["transmission"]),
            "owner": str(data["owner"]),
            "engine": float(data["engine"]),
            "max_power": float(data["max_power"]),
            "seats": float(data["seats"])
        }])

        predicted_price = model.predict(input_data)[0]

        return jsonify({
            "predicted_price": round(float(predicted_price), 2),
            "currency": "INR"
        })

    except (ValueError, TypeError):
        return jsonify({
            "error": "Invalid input. Please check the values entered."
        }), 400

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# START FLASK SERVER
# --------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
