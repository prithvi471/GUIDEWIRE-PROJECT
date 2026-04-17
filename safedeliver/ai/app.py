from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app)

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model.pkl')

model = None
if os.path.exists(model_path):
    with open(model_path, 'rb') as f:
        model = pickle.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not trained yet. Run train.py first.'}), 500
        
    data = request.json
    try:
        # Extract features from request
        weather = float(data.get('weather', 0))
        temperature = float(data.get('temperature', 20))
        disruption = float(data.get('disruption', 0))
        loan = float(data.get('loan', 0))
        claims = float(data.get('claims', 0))
        location_risk = float(data.get('location_risk', 1))
        
        # Array matching training shape
        features = np.array([[weather, temperature, disruption, loan, claims, location_risk]])
        
        # Predict
        risk_probability = float(model.predict(features)[0])
        risk_probability = max(0.01, min(0.99, risk_probability))
        
        return jsonify({
            'risk_probability': risk_probability
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
