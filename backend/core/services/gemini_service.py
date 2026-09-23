import os
import json
import logging
import warnings
from django.conf import settings
from PIL import Image

warnings.filterwarnings('ignore', category=FutureWarning)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Groq client (primary AI -- generous free tier)
# ---------------------------------------------------------------------------
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# Verified working models on this Groq account
GROQ_MODELS = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
]


def get_groq_client():
    api_key = getattr(settings, 'GROQ_API_KEY', '') or os.getenv('GROQ_API_KEY', '')
    if not api_key or not GROQ_AVAILABLE:
        return None
    try:
        return Groq(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        return None


def groq_generate(client, system_prompt, user_prompt):
    """Try each Groq model in order; return text or None."""
    last_err = None
    for model_name in GROQ_MODELS:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=600,
            )
            text = response.choices[0].message.content
            if text:
                return text.strip()
        except Exception as e:
            last_err = e
            logger.warning(f"Groq model {model_name} failed: {e}")
    if last_err:
        logger.error(f"All Groq models failed. Last error: {last_err}")
    return None


# ---------------------------------------------------------------------------
# Gemini client (optional fallback)
# ---------------------------------------------------------------------------
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

GEMINI_MODELS = [
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.5-flash',
]


def get_gemini_client():
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    if not api_key or not GENAI_AVAILABLE:
        return None
    try:
        genai.configure(api_key=api_key)
        return genai
    except Exception as e:
        logger.error(f"Failed to configure Gemini: {e}")
        return None


def gemini_generate(client, prompt):
    for model_name in GEMINI_MODELS:
        try:
            model = client.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini model {model_name} failed: {e}")
    return None


# ---------------------------------------------------------------------------
# Unified AI call -- Groq first, Gemini as fallback
# ---------------------------------------------------------------------------
def ai_generate(system_prompt, user_prompt):
    """Tries Groq first, then Gemini. Returns None if both unavailable."""
    groq_client = get_groq_client()
    if groq_client:
        result = groq_generate(groq_client, system_prompt, user_prompt)
        if result:
            return result

    gemini_client = get_gemini_client()
    if gemini_client:
        result = gemini_generate(gemini_client, f"{system_prompt}\n\n{user_prompt}")
        if result:
            return result

    return None


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def chat_with_gemini(conversation_history: list, current_message: str, vehicle_info: str = "") -> str:
    """
    Short, direct mechanic chat responses.
    Identifies the issue and gives rough cost -- no long paragraphs.
    """
    system_prompt = (
        "You are Mac, a senior car mechanic. Be SHORT and DIRECT -- max 3-4 lines per reply. "
        "When a customer reports an issue: identify the likely fault in 1 sentence, "
        "ask at most ONE clarifying question if needed, and give the rough repair cost in INR (Rs.). "
        "Diagnose ONLY the exact part they mentioned: "
        "headlights = headlight fault only, smoke = engine only, AC = AC only. "
        "No bullet points. No long explanations. Just: what is wrong and rough cost."
    )

    user_prompt = ""
    if vehicle_info:
        user_prompt += f"Vehicle: {vehicle_info}\n\n"

    if conversation_history:
        user_prompt += "Chat so far:\n"
        for msg in conversation_history[-6:]:
            role = "Mechanic" if msg.get('sender') == 'mechanic' else "Customer"
            user_prompt += f"{role}: {msg.get('message', '')}\n"
        user_prompt += "\n"

    user_prompt += f"Customer: {current_message}\nMechanic (short, direct reply):"

    result = ai_generate(system_prompt, user_prompt)
    if result:
        return result

    return (
        f"Got your message about your {vehicle_info or 'vehicle'}. "
        "AI is temporarily busy -- please try again in a moment."
    )


def analyze_multimodal_media(file_path: str, file_type: str, user_prompt: str = "", vehicle_info: str = "") -> str:
    """
    Inspects image/audio/video files for mechanical faults.
    Images use Gemini multimodal; Groq handles text fallback.
    """
    if not os.path.exists(file_path):
        return (
            f"Got your {file_type}. Tell me exactly where on the vehicle this is from "
            "and I will give you a diagnosis."
        )

    if file_type == 'image':
        gemini_client = get_gemini_client()
        if gemini_client:
            try:
                vehicle_context = f"Vehicle: {vehicle_info}\n" if vehicle_info else ""
                technician_prompt = (
                    "You are Mac, a senior car mechanic inspecting a photo. "
                    f"{vehicle_context}"
                    "Identify the component, describe any damage or fault you see, "
                    "and give a brief 2-3 sentence diagnosis with cost in INR (Rs.)."
                )
                img = Image.open(file_path)
                for model_name in GEMINI_MODELS:
                    try:
                        model = gemini_client.GenerativeModel(model_name)
                        response = model.generate_content(
                            [technician_prompt, img,
                             user_prompt or "Inspect this vehicle photo and diagnose the issue briefly."]
                        )
                        if response and response.text:
                            return response.text.strip()
                    except Exception as e:
                        logger.warning(f"Gemini multimodal {model_name} failed: {e}")
            except Exception as e:
                logger.error(f"Image analysis error: {e}", exc_info=True)

        # Groq text fallback
        result = ai_generate(
            "You are a car mechanic. The customer uploaded a photo. Ask them to describe what they see so you can help.",
            user_prompt or "Customer uploaded a vehicle photo."
        )
        if result:
            return result

    elif file_type in ['audio', 'video']:
        gemini_client = get_gemini_client()
        if gemini_client:
            try:
                vehicle_context = f"Vehicle: {vehicle_info}\n" if vehicle_info else ""
                technician_prompt = (
                    f"You are Mac, a senior car mechanic analyzing a {file_type}. "
                    f"{vehicle_context}Diagnose the issue briefly. Use INR (Rs.) for costs."
                )
                uploaded_file = gemini_client.upload_file(path=file_path)
                for model_name in GEMINI_MODELS:
                    try:
                        model = gemini_client.GenerativeModel(model_name)
                        response = model.generate_content(
                            [technician_prompt, uploaded_file,
                             user_prompt or f"Analyze this {file_type} and diagnose the issue."]
                        )
                        if response and response.text:
                            return response.text.strip()
                    except Exception as e:
                        logger.warning(f"Gemini {file_type} {model_name} failed: {e}")
            except Exception as e:
                logger.error(f"Audio/video analysis error: {e}", exc_info=True)

    return (
        f"Got your {file_type}. Describe what you see or hear and I will diagnose it."
    )


def synthesize_diagnosis(vehicle_info: str, symptoms: list, messages: list) -> dict:
    """
    Generates a structured repair cost report via AI.
    Only uses what the customer actually said -- no hardcoded keyword logic.
    Raises RuntimeError if AI is unavailable.
    """
    # Only use USER messages -- exclude mechanic replies to avoid contamination
    user_messages = [m.get('message', '') for m in messages if m.get('sender') == 'user']
    if symptoms:
        user_messages.extend(symptoms)
    user_context = "\n".join(f"- {m}" for m in user_messages if m.strip())

    system_prompt = (
        "You are a senior car mechanic generating a repair cost report. "
        "Diagnose ONLY what the customer reported. "
        "Headlight issue = headlight report only. Engine smoke = engine report only. "
        "Use realistic Indian market repair rates. Write costs as Rs.X,XXX - Rs.Y,YYY. "
        "Reply with ONLY a JSON object. No markdown. No extra text before or after the JSON."
    )

    user_prompt = (
        f"Vehicle: {vehicle_info or 'Unknown Vehicle'}\n"
        f"Customer complaint:\n{user_context}\n\n"
        "Return ONLY valid JSON (no markdown, no extra text):\n"
        '{"issue_title": "Short name of the exact issue",'
        ' "summary": "1-2 sentences about the fault.",'
        ' "severity": "LOW or MEDIUM or HIGH or CRITICAL",'
        ' "probable_causes": ["cause 1", "cause 2"],'
        ' "recommended_services": [{"name": "service name", "estimated_cost": "Rs.X,XXX - Rs.Y,YYY", "urgency": "Immediate or Soon or Routine"}],'
        ' "safety_warning": "Brief safety note.",'
        ' "estimated_cost_range": "Rs.X,XXX - Rs.Y,YYY"}'
    )

    text = ai_generate(system_prompt, user_prompt)

    if text:
        try:
            clean = text.strip()
            # Strip markdown fences if model added them
            if clean.startswith('```json'):
                clean = clean[7:]
            if clean.startswith('```'):
                clean = clean[3:]
            if clean.endswith('```'):
                clean = clean[:-3]
            # Extract JSON object even if model added surrounding text
            start = clean.find('{')
            end = clean.rfind('}') + 1
            if start != -1 and end > start:
                clean = clean[start:end]
            data = json.loads(clean.strip())
            return data
        except json.JSONDecodeError as e:
            logger.warning(f"AI returned invalid JSON: {e}. Raw: {text[:400]}")

    raise RuntimeError(
        "AI diagnostic engine is temporarily unavailable. Please try again in a moment."
    )
