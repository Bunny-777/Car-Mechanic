import re

AUTOMOTIVE_KEYWORDS = {
    # Core systems
    'car', 'vehicle', 'truck', 'auto', 'automobile', 'suv', 'sedan', 'van', 'motor',
    'engine', 'transmission', 'gearbox', 'brakes', 'brake', 'pad', 'pads', 'rotor', 'rotors',
    'caliper', 'drum', 'battery', 'alternator', 'starter', 'solenoid', 'radiator', 'coolant',
    'antifreeze', 'thermostat', 'water pump', 'oil', 'filter', 'dipstick', 'exhaust', 'muffler',
    'catalytic converter', 'manifold', 'oxygen sensor', 'o2 sensor', 'suspension', 'strut',
    'shock', 'spring', 'sway bar', 'control arm', 'ball joint', 'tie rod', 'steering',
    'power steering', 'rack and pinion', 'clutch', 'flywheel', 'driveshaft', 'differential',
    'axle', 'cv joint', 'boot', 'wheel', 'tire', 'tyre', 'tires', 'rim', 'tread',
    'spark plug', 'ignition coil', 'distributor', 'fuel pump', 'fuel injector', 'fuel tank',
    'turbo', 'turbocharger', 'supercharger', 'intercooler', 'timing belt', 'timing chain',
    'serpentine belt', 'fan belt', 'pulley', 'tensioner', 'air conditioner', 'ac', 'compressor',
    'condenser', 'evaporator', 'blower motor', 'heater core', 'fuse', 'fuse box', 'wiring',
    'obd', 'obd2', 'dtc', 'check engine', 'cel', 'abs', 'traction control', 'tpms', 'airbag',
    'headlight', 'taillight', 'indicator', 'wiper', 'windshield', 'gasket', 'head gasket',
    'valve cover', 'piston', 'cylinder', 'camshaft', 'crankshaft',

    # Symptoms & mechanical sensations
    'squeal', 'squealing', 'squeak', 'squeaking', 'grind', 'grinding', 'knock', 'knocking',
    'rattle', 'rattling', 'clunk', 'clunking', 'click', 'clicking', 'hiss', 'hissing',
    'hum', 'humming', 'whine', 'whining', 'vibration', 'shaking', 'shudder', 'wobble',
    'pulling', 'smoke', 'smoking', 'overheating', 'overheat', 'stall', 'stalling', 'hesitation',
    'sluggish', 'misfire', 'misfiring', 'backfire', 'leak', 'leaking', 'puddle', 'fluid',
    'no crank', 'cranking', 'dead battery', 'jump start', 'limp mode', 'rough idle', 'idling',
    'spongy', 'soft pedal', 'hard pedal', 'burning smell', 'sweet smell', 'gas smell', 'odour',
    'mileage', 'mpg', 'service', 'maintenance', 'tune up', 'inspection', 'diagnostic'
}

CAR_MAKES = {
    'toyota', 'honda', 'ford', 'chevrolet', 'chevy', 'nissan', 'hyundai', 'kia',
    'volkswagen', 'vw', 'subaru', 'mazda', 'bmw', 'mercedes', 'mercedes-benz',
    'audi', 'lexus', 'jeep', 'dodge', 'ram', 'chrysler', 'volvo', 'porsche',
    'mitsubishi', 'land rover', 'range rover', 'jaguar', 'infiniti', 'acura',
    'cadillac', 'buick', 'gmc', 'lincoln', 'tesla', 'mini', 'fiat', 'genesis',
    'skoda', 'renault', 'peugeot', 'suzuki', 'tata', 'mahindra'
}

NON_CAR_TOPICS = [
    r'\b(recipe|cook|bake|ingredient|food|dinner|lunch|pasta|pizza|cake)\b',
    r'\b(python|javascript|react|html|css|sql|coding|programming|algorithm|git)\b',
    r'\b(crypto|bitcoin|ethereum|stock market|forex|investing)\b',
    r'\b(president|election|minister|politics|government|senate)\b',
    r'\b(homework|essay|poem|song|story|lyrics)\b',
    r'\b(doctor|medicine|illness|symptom of flu|fever|cough|headache)\b',
    r'\b(weather today|forecast|rain tomorrow)\b',
]

GREETING_PATTERNS = [
    r'^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening)|sup)\b'
]


def is_greeting(text: str) -> bool:
    cleaned = text.strip().lower()
    if len(cleaned.split()) <= 4:
        for pattern in GREETING_PATTERNS:
            if re.search(pattern, cleaned):
                return True
    return False


def is_clearly_irrelevant(text: str) -> bool:
    cleaned = text.lower()
    for pattern in NON_CAR_TOPICS:
        if re.search(pattern, cleaned):
            # Check if there is an explicit car context overriding it
            words = set(re.findall(r'[a-z0-9]+', cleaned))
            if not (words & AUTOMOTIVE_KEYWORDS or words & CAR_MAKES):
                return True
    return False


def is_automotive(text: str) -> bool:
    cleaned = text.lower()
    tokens = set(re.findall(r'[a-z0-9]+', cleaned))
    
    # Check direct match with car makes or auto keywords
    if tokens & AUTOMOTIVE_KEYWORDS:
        return True
    if tokens & CAR_MAKES:
        return True
    
    # Check for OBD-II fault code format (e.g. P0300, P0171, B1234, C0040, U0100)
    if re.search(r'\b[pbcu][0-3][0-9]{3}\b', cleaned):
        return True
        
    # Check for common vehicle phrase structures (e.g., "my 2015 car", "engine light")
    if re.search(r'\b(19\d\d|20\d\d)\b', cleaned) and any(w in cleaned for w in ['miles', 'km', 'wheel', 'door', 'hood', 'trunk']):
        return True

    return False


def extract_vehicle_details(text: str) -> dict:
    details = {}
    cleaned = text.lower()

    # Extract 4-digit year between 1970 and 2027
    year_match = re.search(r'\b(19[7-9]\d|20[0-2]\d)\b', cleaned)
    if year_match:
        details['year'] = year_match.group(1)

    # Extract make
    for make in CAR_MAKES:
        if re.search(rf'\b{re.escape(make)}\b', cleaned):
            details['make'] = make.capitalize()
            break

    # Extract mileage (e.g., 75000 miles, 120k km, 90,000 mi)
    mileage_match = re.search(r'(\d+[\d,]*\s*(?:k|thousand)?\s*(?:miles|mile|mi|km|kms))\b', cleaned)
    if mileage_match:
        details['mileage'] = mileage_match.group(1).strip()

    return details


def get_polite_rejection() -> str:
    return (
        "I'm an automotive technician, so I stick strictly to what I know best—diagnosing car issues, "
        "mechanical faults, warning lights, and vehicle maintenance. If you've got a problem with your vehicle "
        "(strange noises, fluid leaks, performance drops, or check engine codes), let me know what car you're "
        "driving and what symptoms you're seeing!"
    )


def get_mechanic_greeting() -> str:
    return (
        "G'day! I'm your virtual senior mechanic. I'm here to help you troubleshoot and diagnose any car trouble "
        "you're dealing with.\n\n"
        "To get started, tell me:\n"
        "1. What is the Year, Make, and Model of your car?\n"
        "2. What issue or unusual symptom (noise, vibration, leak, dashboard light) are you experiencing?\n\n"
        "You can also upload photos of parts/dashboard, engine sound recordings, or videos anytime."
    )


def generate_rule_based_followup(text: str, session_context: dict) -> str:
    """
    Generate targeted diagnostic follow-up questions using expert automotive decision trees.
    Saves AI tokens while delivering authentic mechanic investigation!
    """
    cleaned = text.lower()

    # Brake related
    if any(k in cleaned for k in ['brake', 'pad', 'rotor', 'caliper', 'stopping']):
        if 'squeal' in cleaned or 'squeak' in cleaned:
            return (
                "High-pitched brake squealing often points to worn brake pad wear indicators or glazed rotors.\n\n"
                "A couple of quick diagnostic questions:\n"
                "• Does the squeal happen only under light pedal pressure or even when braking firmly?\n"
                "• Does it squeak in reverse or first thing in the morning when moisture is on the rotors?\n\n"
                "If you can snap a photo through your wheel spokes showing the brake pad thickness or rotor surface, upload it and I'll inspect the wear."
            )
        if 'grind' in cleaned or 'scrape' in cleaned:
            return (
                "⚠️ Metal-on-metal grinding when braking is critical. This usually means the friction material is completely worn down to the metal backing plate against the rotor.\n\n"
                "• Do you feel a pulsation through the brake pedal or vibration in the steering wheel?\n"
                "• Is the vehicle pulling to one side when you brake?\n\n"
                "I strongly advise not driving at highway speeds until inspected. You can click 'Generate Diagnosis' to see estimated repair costs or schedule a shop inspection."
            )

    # Battery / Starter / No-start
    if any(k in cleaned for k in ['start', 'crank', 'battery', 'alternator', 'turn over']):
        if 'click' in cleaned or 'rapid click' in cleaned:
            return (
                "Rapid clicking when turning the key or pushing start is a classic symptom of low battery voltage or corroded battery terminals.\n\n"
                "Let's narrow it down:\n"
                "• Are your dashboard lights or headlights dim or flickering when you try to crank?\n"
                "• How old is your current 12V battery (typically batteries last 3-5 years)?\n"
                "• Have you checked for white or bluish crusty corrosion around the battery terminals?"
            )
        if 'crank' in cleaned and ('no start' in cleaned or 'won\'t start' in cleaned):
            return (
                "If the engine cranks strongly but refuses to catch fire, the starter and battery are likely okay, but we're missing one of the essentials: Fuel, Spark, or Air.\n\n"
                "• Do you hear the fuel pump hum for 2 seconds from the rear when you first turn the ignition to 'ON'?\n"
                "• Is the security/theft light flashing on the dash?\n"
                "• When was the last time the fuel filter or spark plugs were replaced?"
            )

    # Overheating / Coolant
    if any(k in cleaned for k in ['overheat', 'overheating', 'coolant', 'temperature', 'steam', 'hot']):
        return (
            "🚨 Engine overheating needs immediate attention to prevent a blown head gasket or cracked cylinder head.\n\n"
            "Key diagnostic questions:\n"
            "• Is there visible white sweet-smelling steam from under the hood or a puddle of green/pink/orange coolant underneath?\n"
            "• Does the temperature rise while idling in traffic, or does it spike when driving at speed on the open road?\n"
            "• Is the radiator cooling fan turning on when the engine gets warm?"
        )

    # Check Engine Light / Misfire
    if any(k in cleaned for k in ['check engine', 'cel', 'misfire', 'rough idle', 'shaking']):
        return (
            "A check engine light combined with a rough idle typically indicates an engine misfire (often bad spark plugs, faulty ignition coils, or vacuum leaks).\n\n"
            "• Is the check engine light staying solid, or is it FLASHING? (If it's flashing, stop driving—raw fuel can destroy the catalytic converter).\n"
            "• Do you have an OBD-II scanner reading or a code (like P0300, P0301, P0171)?\n"
            "• Does the shaking smooth out when you give it a little throttle?"
        )

    # Transmission / Shifting
    if any(k in cleaned for k in ['transmission', 'gear', 'shift', 'slipping', 'clutch']):
        return (
            "Transmission slippage or harsh engagement should be addressed before internal clutch packs wear further.\n\n"
            "• Does the engine RPM shoot up without the car accelerating proportionally (slipping)?\n"
            "• Have you checked the transmission fluid level and color on the dipstick (should be bright/translucent pinkish-red, not dark brown or burnt smelling)?\n"
            "• Does the issue happen between specific gears (e.g. 1st to 2nd) or when putting it into Reverse?"
        )

    return ""
