# CarValue — Used Car Price Prediction & Vehicle Discovery

<p align="center">
  **Find your next car. Understand its value.**
</p>

<p align="center">
  <a href="https://carvalue-one.vercel.app/">Live Demo</a> •
  <a href="https://github.com/aravsrivastava06/CarValue">GitHub Repository</a>
</p>

---

## About the Project

CarValue is a machine learning-powered used car price prediction and vehicle discovery platform. It combines predictive analytics with an interactive web application to help users explore used cars, compare vehicle specifications, and estimate their resale value.

The project covers the complete machine learning workflow, from dataset preprocessing and exploratory data analysis to model training, backend API development, frontend integration, and cloud deployment.

**Live Website:** https://carvalue-one.vercel.app/

## Key Features

### Vehicle Discovery
- Browse a catalogue of used vehicles.
- Search cars by name.
- Filter by brand, fuel type, transmission, and price.
- Sort and navigate through vehicle listings.

### Price Prediction
- Estimate the selling price of a used car using a trained regression model.
- Enter vehicle specifications to generate predictions.
- View the estimated price through an interactive interface.

### Vehicle Comparison
- Select vehicles for side-by-side comparison.
- Compare important specifications.
- Make more informed vehicle decisions.

### Additional Features
- Responsive user interface.
- Dark and light themes.
- Favourite vehicles.
- Prediction activity and history.
- Interactive charts and project information.

## Machine Learning

### Dataset

The project uses the **CarDekho Used Car Details Dataset**, sourced from Kaggle.

| Dataset information | Value |
|---|---:|
| Original records | 8,128 |
| Duplicate records removed | 1,202 |
| Final records | 6,926 |
| Original features | 13 |

The dataset contains vehicle attributes such as car name, manufacturing year, selling price, kilometres driven, fuel type, seller type, transmission, ownership, mileage, engine capacity, maximum power, and seating capacity.

### Data Preprocessing

The data preparation workflow includes:

- Dataset inspection and understanding.
- Duplicate identification and removal.
- Missing-value handling.
- Extraction of numerical values from vehicle specifications.
- Feature preparation for regression modelling.

### Exploratory Data Analysis

Exploratory Data Analysis was performed to understand the relationships between vehicle characteristics and selling prices.

Some observations from the dataset:

- Newer vehicles generally have higher selling prices.
- Kilometres driven have a negative relationship with selling price.
- Engine capacity and maximum power show positive relationships with selling price.
- Maximum power has a particularly strong positive correlation with selling price.

### Model Used

**Decision Tree Regression**

The model uses the following input features:

- Brand
- Car age
- Kilometres driven
- Fuel type
- Seller type
- Transmission
- Ownership
- Engine capacity
- Maximum power
- Number of seats

The trained model is saved using Joblib and loaded by the Flask backend for generating predictions.

### Model Performance

Reported held-out test-set metrics:

| Metric | Result |
|---|---:|
| R² Score | 0.8917 |
| Mean Absolute Error | Approximately ₹83,858 |

These results represent performance on the evaluation dataset. Individual predictions may differ from actual resale prices.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling | CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Backend | Python, Flask |
| API | Flask-CORS |
| Machine Learning | Scikit-learn |
| Data Processing | Pandas, NumPy |
| Model Persistence | Joblib |
| Production Server | Gunicorn |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git, GitHub |

## Project Structure

```text
CarValue/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── requirements-render.txt
│   ├── data/
│   ├── models/
│   ├── reports/
│   └── src/
│       ├── eda.py
│       ├── inspect_data.py
│       ├── prepare_data.py
│       ├── preprocessing.py
│       └── train_models.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── assets/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Running the Project Locally

### Prerequisites

- Python 3
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/aravsrivastava06/CarValue.git
cd CarValue
```

### 2. Start the backend

Create and activate a Python virtual environment:

```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
```

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Run Flask:

```bash
python backend/app.py
```

Backend address:

`http://127.0.0.1:5000`

### 3. Start the frontend

Open a separate terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the frontend directory:

```env
VITE_API_URL=http://127.0.0.1:5000
```

Start the development server:

```bash
npm run dev
```

Frontend address:

`http://localhost:5173`

## Deployment Architecture

```text
                 USER
                   |
                   v
          React + Vite Frontend
                 Vercel
                   |
                   | API Requests
                   v
              Flask Backend
                 Render
                   |
             +-----+-----+
             |           |
             v           v
         ML Model    Vehicle Dataset
         (Joblib)        (CSV)
```

### Deployment Links

| Component | Platform | Link |
|---|---|---|
| Live Website | Vercel | https://carvalue-one.vercel.app/ |
| Backend API | Render | https://carvalue-api-axso.onrender.com |
| Source Code | GitHub | https://github.com/aravsrivastava06/CarValue |

## Limitations

- The vehicle catalogue is based on a historical dataset and does not represent live dealership inventory.
- Predicted prices are estimates and may differ from actual market prices.
- Vehicle condition, location, market demand, and other factors may affect resale value.
- Some user specific features are stored locally in the browser rather than in a central database.
- The free Render instance may experience cold starts after periods of inactivity.

## Future Scope

- Integration of live used car listings from authorized data sources.
- Experimentation with additional regression algorithms.
- Further model optimization and hyperparameter tuning.
- Prediction explainability and feature importance.
- User authentication and cloud-based data persistence.
- Location aware vehicle price analysis.
- Additional analytics and visualization features.

## Acknowledgements

- Kaggle — CarDekho Used Car Details Dataset.
- Scikit-learn — Machine learning framework.
- React and Vite — Frontend development.
- Flask — Backend API development.
- Vercel and Render — Application deployment.

---

<p align="center">
  **CarValue — Smarter Used-Car Decisions Through Data and Machine Learning.**
</p>
