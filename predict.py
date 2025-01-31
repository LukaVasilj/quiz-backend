import pickle
import pandas as pd
import sys
import json
import xgboost as xgb

try:
    # Učitajte model
    with open('./models/group_classification_model_best.pkl', 'rb') as f:
        model = pickle.load(f)
    # print('Model loaded successfully')  # Ukloniti

    # Učitajte podatke iz argumenta
    data = json.loads(sys.argv[1])
    # print('Data received for prediction:', data)  # Ukloniti
    df = pd.DataFrame([data])

    # Pretvorite stupce u odgovarajuće tipove
    df['category'] = df['category'].astype('category')
    df['average_time'] = df['average_time'].astype(float)
    # print('DataFrame after type conversion:', df)  # Ukloniti

    # Predikcija
    prediction = model.predict(df)[0] + 1  # Adjusting group to original range (1-5)
    # print('Prediction result:', prediction)  # Ukloniti

    # Vratite rezultat
    print(json.dumps({"prediction": int(prediction)}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)