# Importing Libraries
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# 1. Load Data
df = pd.read_csv('chat_data.csv')

# Check for missing values and drop them if any
df.dropna(inplace=True)

# 2. Vectorization (Improved)
vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=500)

# 3. Train-Test Split (Removed stratify)
X_train, X_test, y_train, y_test = train_test_split(
    df['message'], df['response'], test_size=0.2, random_state=42
)

# 4. Transform Data
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# 5. Train Model
model = MultinomialNB()
model.fit(X_train_vec, y_train)

# 6. Evaluate Model
y_pred = model.predict(X_test_vec)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy * 100:.2f}%")
print("Classification Report:")
print(classification_report(y_test, y_pred))

# 7. Save Model and Vectorizer
joblib.dump(model, 'chatbot_model.pkl')
joblib.dump(vectorizer, 'vectorizer.pkl')
print("Model and Vectorizer saved!")

# 8. Test Prediction
test_message = "Hello"
test_vector = vectorizer.transform([test_message])
predicted_response = model.predict(test_vector)[0]
print(f"Test Message: {test_message}")
print(f"Predicted Response: {predicted_response}")
