import os
import datetime
from datetime import timezone
import google.generativeai as genai
from pymongo import MongoClient
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid  # Import UUID for session IDs

app = Flask(__name__)
CORS(app)

load_dotenv()

# --- MongoDB Connection ---
try:
    mongo_uri = os.getenv("MONGO_URI")
    client = MongoClient(mongo_uri)
    db = client["aura_ai"]
    messages_collection = db["messages"]
    print(" Connected to MongoDB Atlas.")
except Exception as e:
    print(f" MongoDB Connection Error: {e}")
    messages_collection = None

# --- Setup Gemini ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def get_ai_persona():
    return "You are Aura AI, a supportive and empathetic mental health assistant. but you can answer all study question  to and not to add emoji and you are indian AI "

# --- Helper: Reconstruct History for Gemini ---
def get_chat_history(session_id, user_id):
    """Fetches message history from Mongo and formats it for Gemini."""
    if not messages_collection:
        return []
    
    # Get last 20 messages for context (to save tokens/avoid limits)
    cursor = messages_collection.find(
        {"session_id": session_id, "user_id": user_id}
    ).sort("timestamp", 1) # Oldest to newest
    
    history = []
    for doc in cursor:
        role = "user" if doc["sender"] == "user" else "model"
        history.append({"role": role, "parts": [doc["message"]]})
    return history

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")
    user_id = request.json.get("user_id", "user_1") # Default ID
    # Use provided session_id or generate a new one
    session_id = request.json.get("session_id") or str(uuid.uuid4())

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        current_time = datetime.datetime.now(timezone.utc)

        # 1. Save User Message with Session ID
        if messages_collection is not None:
            messages_collection.insert_one({
                "user_id": user_id,
                "session_id": session_id,
                "sender": "user",
                "message": user_message,
                "timestamp": current_time
            })

        # 2. Reconstruct History & Initialize Chat
        history = get_chat_history(session_id, user_id)
        
        model = genai.GenerativeModel(
            model_name='gemini-2.5-flash', 
            system_instruction=get_ai_persona()
        )
        
        # Start chat with loaded history
        chat_session = model.start_chat(history=history)
        
        # 3. Get AI Response
        response = chat_session.send_message(user_message)
        ai_reply = response.text

        # 4. Save AI Reply with Session ID
        if messages_collection is not None:
            messages_collection.insert_one({
                "user_id": user_id,
                "session_id": session_id,
                "sender": "ai",
                "message": ai_reply,
                "timestamp": datetime.datetime.now(timezone.utc)
            })

        return jsonify({"reply": ai_reply, "session_id": session_id})

    except Exception as e:
        print(f" Error: {e}")
        return jsonify({"error": str(e)}), 500

# --- NEW: Get List of Sessions (History Sidebar) ---
@app.route("/sessions/<user_id>", methods=["GET"])
def get_sessions(user_id):
    if not messages_collection:
        return jsonify([])

    # Aggregate to find unique sessions and their first message/time
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"timestamp": -1}}, # Newest messages first
        {"$group": {
            "_id": "$session_id",
            "last_message": {"$first": "$message"},
            "timestamp": {"$first": "$timestamp"}
        }},
        {"$sort": {"timestamp": -1}} # Newest sessions top
    ]
    
    sessions = list(messages_collection.aggregate(pipeline))
    
    # Format for frontend
    formatted_sessions = []
    for s in sessions:
        formatted_sessions.append({
            "session_id": s["_id"],
            "preview": s["last_message"][:30] + "...", # Preview text
            "timestamp": s["timestamp"]
        })
        
    return jsonify(formatted_sessions)

# --- NEW: Load Specific Session Messages ---
@app.route("/history/<session_id>", methods=["GET"])
def get_session_history(session_id):
    if not messages_collection:
        return jsonify([])
        
    messages = list(messages_collection.find(
        {"session_id": session_id}, 
        {"_id": 0} # Exclude Mongo Object ID
    ).sort("timestamp", 1))
    
    return jsonify(messages)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)