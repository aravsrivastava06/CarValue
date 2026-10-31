
import pandas as pd
import numpy as np
import joblib

from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# Project paths
BASE_DIR = Path(__file__).resolve().parents[1]

DATA_PATH = BASE_DIR / "data" / "cars_prepared.csv"
MODEL_DIR = BASE_DIR / "models"
REPORT_DIR = BASE_DIR / "reports"

MODEL_DIR.mkdir(exist_ok=True)
REPORT_DIR.mkdir(exist_ok=True)


# Load prepared dataset
df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)


# Separate features and target
X = df.drop(columns=["selling_price"])
y = df["selling_price"]


# Identify feature types
categorical_features = [
    "brand",
    "fuel",
    "seller_type",
    "transmission",
    "owner"
]

numerical_features = [
    "car_age",
    "km_driven",
    "engine",
    "max_power",
    "seats"
]


# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("Training rows:", len(X_train))
print("Testing rows:", len(X_test))


# Create preprocessing function
def create_preprocessor():

    numerical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore"))
    ])

    return ColumnTransformer([
        ("numerical", numerical_pipeline, numerical_features),
        ("categorical", categorical_pipeline, categorical_features)
    ])


# Define models
models = {
    "Linear Regression": LinearRegression(),

    "Decision Tree Regression": DecisionTreeRegressor(
        max_depth=12,
        min_samples_split=5,
        random_state=42
    )
}


# Train and evaluate models
results = []
trained_models = {}

for name, model in models.items():

    print(f"\nTraining {name}...")

    pipeline = Pipeline([
        ("preprocessor", create_preprocessor()),
        ("regressor", model)
    ])

    # Transform target to reduce skewness
    final_model = TransformedTargetRegressor(
        regressor=pipeline,
        func=np.log1p,
        inverse_func=np.expm1
    )

    final_model.fit(X_train, y_train)

    predictions = final_model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, predictions)

    results.append({
        "Model": name,
        "MAE": mae,
        "MSE": mse,
        "RMSE": rmse,
        "R2 Score": r2
    })

    trained_models[name] = final_model

    print("MAE:", round(mae, 2))
    print("RMSE:", round(rmse, 2))
    print("R2 Score:", round(r2, 4))


# Compare model performance
results_df = pd.DataFrame(results)
results_df = results_df.sort_values(by="R2 Score", ascending=False)

print("\n========== MODEL COMPARISON ==========")
print(results_df.to_string(index=False))


# Select best model based on R2 score
best_model_name = results_df.iloc[0]["Model"]
best_model = trained_models[best_model_name]

# Save best model
joblib.dump(
    best_model,
    MODEL_DIR / "best_car_price_model.joblib"
)

# Save comparison report
results_df.to_csv(
    REPORT_DIR / "model_comparison.csv",
    index=False
)

print("\nBest Model:", best_model_name)
print("Model saved successfully!")
print("Comparison report saved successfully!")
