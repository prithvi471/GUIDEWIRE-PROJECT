import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import pickle
import os

# Generate logical dataset
def generate_data(num_samples=5000):
    np.random.seed(42)
    
    # 0=Clear, 1=Clouds, 2=Rain, 3=Snow, 4=Extreme
    weather = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=[0.4, 0.3, 0.2, 0.08, 0.02])
    temperature = np.random.uniform(-10, 45, size=num_samples)
    disruption = np.random.choice([0, 1], size=num_samples, p=[0.9, 0.1])
    loan = np.random.choice([0, 1], size=num_samples, p=[0.6, 0.4])
    claims = np.random.poisson(1.5, size=num_samples) # Average 1.5 claims
    location_risk = np.random.choice([1, 2, 3], size=num_samples, p=[0.5, 0.3, 0.2])
    
    # Compute base risk probabilty (0 to 1) based on rules:
    # - weather >= 2 (Rain, Snow, Extreme) increases risk
    # - disruption == 1 increases risk heavily
    # - more claims -> higher risk
    # - location_risk -> higher risk
    # - loan == 1 -> slight increase
    
    risk = (
        (np.where(weather >= 2, weather, 0) * 0.05) + 
        (disruption * 0.35) + 
        (claims * 0.08) + 
        (location_risk * 0.05) + 
        (loan * 0.05)
    )
    
    # Add some noise
    risk += np.random.normal(0, 0.02, size=num_samples)
    
    # Clamp between 0.01 and 0.99
    risk = np.clip(risk, 0.01, 0.99)
    
    df = pd.DataFrame({
        'weather': weather,
        'temperature': temperature,
        'disruption': disruption,
        'loan': loan,
        'claims': claims,
        'location_risk': location_risk,
        'risk_probability': risk
    })
    return df

if __name__ == "__main__":
    print("Generating logical dataset...")
    df = generate_data(10000)
    
    X = df[['weather', 'temperature', 'disruption', 'loan', 'claims', 'location_risk']]
    y = df['risk_probability']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training profit-aware AI Model (RandomForestRegressor)...")
    model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42)
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    print(f"Model MSE: {mse:.4f}")
    
    # Save the model
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Model saved to {model_path}")
