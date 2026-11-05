import httpx
import logging
from typing import Dict, Optional, Tuple, List

logger = logging.getLogger(__name__)

# Known global & Indian airport / railway station / city database
LOCATION_DIRECTORY: Dict[str, Dict] = {
    # Indian Rail & Airport Hubs
    "NJP": {
        "code": "NJP",
        "name": "New Jalpaiguri",
        "city": "Siliguri",
        "state": "West Bengal",
        "country": "India",
        "formatted_query": "New Jalpaiguri, Siliguri, West Bengal, India",
        "lat": 26.6832,
        "lon": 88.3229,
        "airport_code": "IXB",
        "rail_code": "NJP"
    },
    "HWH": {
        "code": "HWH",
        "name": "Howrah Junction",
        "city": "Kolkata",
        "state": "West Bengal",
        "country": "India",
        "formatted_query": "Kolkata, West Bengal, India",
        "lat": 22.5839,
        "lon": 88.3426,
        "airport_code": "CCU",
        "rail_code": "HWH"
    },
    "CCU": {
        "code": "CCU",
        "name": "Netaji Subhash Chandra Bose Airport",
        "city": "Kolkata",
        "state": "West Bengal",
        "country": "India",
        "formatted_query": "Kolkata, West Bengal, India",
        "lat": 22.6547,
        "lon": 88.4467,
        "airport_code": "CCU",
        "rail_code": "HWH"
    },
    "DEL": {
        "code": "DEL",
        "name": "Indira Gandhi International Airport",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "formatted_query": "New Delhi, Delhi, India",
        "lat": 28.5562,
        "lon": 77.1000,
        "airport_code": "DEL",
        "rail_code": "NDLS"
    },
    "BOM": {
        "code": "BOM",
        "name": "Chhatrapati Shivaji Maharaj Airport",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "formatted_query": "Mumbai, Maharashtra, India",
        "lat": 19.0896,
        "lon": 72.8656,
        "airport_code": "BOM",
        "rail_code": "CSMT"
    },
    "BLR": {
        "code": "BLR",
        "name": "Kempegowda International Airport",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "formatted_query": "Bengaluru, Karnataka, India",
        "lat": 13.1986,
        "lon": 77.7066,
        "airport_code": "BLR",
        "rail_code": "SBC"
    },
    "GOI": {
        "code": "GOI",
        "name": "Dabolim Airport",
        "city": "Goa",
        "state": "Goa",
        "country": "India",
        "formatted_query": "Goa, India",
        "lat": 15.3808,
        "lon": 73.8314,
        "airport_code": "GOI",
        "rail_code": "MAO"
    },
    "IXB": {
        "code": "IXB",
        "name": "Bagdogra Airport",
        "city": "Siliguri",
        "state": "West Bengal",
        "country": "India",
        "formatted_query": "Siliguri, West Bengal, India",
        "lat": 26.6812,
        "lon": 88.3286,
        "airport_code": "IXB",
        "rail_code": "NJP"
    },
    "JAI": {
        "code": "JAI",
        "name": "Jaipur International Airport / Railway Station",
        "city": "Jaipur",
        "state": "Rajasthan",
        "country": "India",
        "formatted_query": "Jaipur, Rajasthan, India",
        "lat": 26.8242,
        "lon": 75.8122,
        "airport_code": "JAI",
        "rail_code": "JP"
    },
    "VNS": {
        "code": "VNS",
        "name": "Lal Bahadur Shastri Airport / Varanasi Junction",
        "city": "Varanasi",
        "state": "Uttar Pradesh",
        "country": "India",
        "formatted_query": "Varanasi, Uttar Pradesh, India",
        "lat": 25.4524,
        "lon": 82.8593,
        "airport_code": "VNS",
        "rail_code": "BSB"
    },
    "COK": {
        "code": "COK",
        "name": "Cochin International Airport / Ernakulam Junction",
        "city": "Kochi",
        "state": "Kerala",
        "country": "India",
        "formatted_query": "Kochi, Kerala, India",
        "lat": 10.1518,
        "lon": 76.3930,
        "airport_code": "COK",
        "rail_code": "ERS"
    },
    "HYD": {
        "code": "HYD",
        "name": "Rajiv Gandhi International Airport / Secunderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "formatted_query": "Hyderabad, Telangana, India",
        "lat": 17.2403,
        "lon": 78.4294,
        "airport_code": "HYD",
        "rail_code": "SC"
    },
    "MAA": {
        "code": "MAA",
        "name": "Chennai International Airport / Chennai Central",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "country": "India",
        "formatted_query": "Chennai, Tamil Nadu, India",
        "lat": 12.9941,
        "lon": 80.1709,
        "airport_code": "MAA",
        "rail_code": "MAS"
    },
    "AMD": {
        "code": "AMD",
        "name": "Sardar Vallabhbhai Patel International Airport / Ahmedabad Junction",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "country": "India",
        "formatted_query": "Ahmedabad, Gujarat, India",
        "lat": 23.0772,
        "lon": 72.6347,
        "airport_code": "AMD",
        "rail_code": "ADI"
    },
    "LKO": {
        "code": "LKO",
        "name": "Chaudhary Charan Singh Airport / Lucknow Charbagh",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "country": "India",
        "formatted_query": "Lucknow, Uttar Pradesh, India",
        "lat": 26.7606,
        "lon": 80.8893,
        "airport_code": "LKO",
        "rail_code": "LKO"
    },
    "SXR": {
        "code": "SXR",
        "name": "Sheikh ul-Alam International Airport / Srinagar",
        "city": "Srinagar",
        "state": "Jammu and Kashmir",
        "country": "India",
        "formatted_query": "Srinagar, Jammu and Kashmir, India",
        "lat": 33.9871,
        "lon": 74.7744,
        "airport_code": "SXR",
        "rail_code": "SINA"
    },
    "AGR": {
        "code": "AGR",
        "name": "Agra Airport / Agra Cantt",
        "city": "Agra",
        "state": "Uttar Pradesh",
        "country": "India",
        "formatted_query": "Agra, Uttar Pradesh, India",
        "lat": 27.1558,
        "lon": 77.9609,
        "airport_code": "AGR",
        "rail_code": "AGC"
    },
    "UDR": {
        "code": "UDR",
        "name": "Maharana Pratap Airport / Udaipur City",
        "city": "Udaipur",
        "state": "Rajasthan",
        "country": "India",
        "formatted_query": "Udaipur, Rajasthan, India",
        "lat": 24.6177,
        "lon": 73.8961,
        "airport_code": "UDR",
        "rail_code": "UDZ"
    },
    "PNQ": {
        "code": "PNQ",
        "name": "Pune International Airport / Pune Junction",
        "city": "Pune",
        "state": "Maharashtra",
        "country": "India",
        "formatted_query": "Pune, Maharashtra, India",
        "lat": 18.5822,
        "lon": 73.9197,
        "airport_code": "PNQ",
        "rail_code": "PUNE"
    },
    "ATQ": {
        "code": "ATQ",
        "name": "Sri Guru Ram Dass Jee International Airport / Amritsar Junction",
        "city": "Amritsar",
        "state": "Punjab",
        "country": "India",
        "formatted_query": "Amritsar, Punjab, India",
        "lat": 31.7096,
        "lon": 74.7973,
        "airport_code": "ATQ",
        "rail_code": "ASR"
    },
    "BBI": {
        "code": "BBI",
        "name": "Biju Patnaik Airport / Puri & Bhubaneswar Railway",
        "city": "Puri",
        "state": "Odisha",
        "country": "India",
        "formatted_query": "Puri, Odisha, India",
        "lat": 19.8135,
        "lon": 85.8312,
        "airport_code": "BBI",
        "rail_code": "PURI"
    },
    # Global Hubs
    "HND": {
        "code": "HND",
        "name": "Haneda Airport",
        "city": "Tokyo",
        "state": "Tokyo",
        "country": "Japan",
        "formatted_query": "Tokyo, Japan",
        "lat": 35.5494,
        "lon": 139.7798,
        "airport_code": "HND",
        "rail_code": "TYO"
    },
    "NRT": {
        "code": "NRT",
        "name": "Narita International Airport",
        "city": "Tokyo",
        "state": "Chiba",
        "country": "Japan",
        "formatted_query": "Tokyo, Japan",
        "lat": 35.7720,
        "lon": 140.3929,
        "airport_code": "NRT",
        "rail_code": "TYO"
    },
    "DXB": {
        "code": "DXB",
        "name": "Dubai International Airport",
        "city": "Dubai",
        "state": "Dubai",
        "country": "United Arab Emirates",
        "formatted_query": "Dubai, United Arab Emirates",
        "lat": 25.2532,
        "lon": 55.3657,
        "airport_code": "DXB",
        "rail_code": "DXB"
    },
    "JFK": {
        "code": "JFK",
        "name": "John F. Kennedy International Airport",
        "city": "New York",
        "state": "New York",
        "country": "United States",
        "formatted_query": "New York, USA",
        "lat": 40.6413,
        "lon": -73.7781,
        "airport_code": "JFK",
        "rail_code": "NYP"
    },
    "LHR": {
        "code": "LHR",
        "name": "Heathrow Airport",
        "city": "London",
        "state": "England",
        "country": "United Kingdom",
        "formatted_query": "London, United Kingdom",
        "lat": 51.4700,
        "lon": -0.4543,
        "airport_code": "LHR",
        "rail_code": "KGX"
    },
    "CDG": {
        "code": "CDG",
        "name": "Charles de Gaulle Airport",
        "city": "Paris",
        "state": "Île-de-France",
        "country": "France",
        "formatted_query": "Paris, France",
        "lat": 49.0097,
        "lon": 2.5479,
        "airport_code": "CDG",
        "rail_code": "PAR"
    },
    "SFO": {
        "code": "SFO",
        "name": "San Francisco International Airport",
        "city": "San Francisco",
        "state": "California",
        "country": "United States",
        "formatted_query": "San Francisco, California, USA",
        "lat": 37.6213,
        "lon": -122.3790,
        "airport_code": "SFO",
        "rail_code": "SFC"
    }
}

async def resolve_location(raw_input: str) -> Dict:
    """
    Resolves raw location input (e.g. 'NJP', 'HWH', 'Tokyo, Japan', 'Dubai') into a structured verified destination.
    """
    clean = (raw_input or "").strip()
    if not clean:
        logger.error(
            "Location resolution failed: %s",
            {
                "source": "location_resolver",
                "code": "empty_location",
                "message": "A non-empty location is required.",
            },
        )
        return {}

    upper_code = clean.upper().replace("(", "").replace(")", "")
    
    # 1. Direct match in location directory
    if upper_code in LOCATION_DIRECTORY:
        return LOCATION_DIRECTORY[upper_code]
    
    for key, val in LOCATION_DIRECTORY.items():
        if key.lower() in clean.lower() or val["city"].lower() in clean.lower() or val["name"].lower() in clean.lower():
            return val

    # 2. Dynamic Nominatim Geo-Lookup
    try:
        url = "https://nominatim.openstreetmap.org/search"
        headers = {"User-Agent": "WayfarerAI/1.0 (contact@wayfarerai.com)"}
        params = {"q": clean, "format": "json", "addressdetails": 1, "limit": 1}
        
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    first = data[0]
                    raw_lat = first.get("lat")
                    raw_lon = first.get("lon")
                    if raw_lat is None or raw_lon is None:
                        logger.error(
                            "Location resolution failed: %s",
                            {
                                "source": "location_resolver",
                                "code": "invalid_geocoding_result",
                                "message": f"Nominatim returned no coordinates for '{clean}'.",
                            },
                        )
                        return {}
                    lat = float(raw_lat)
                    lon = float(raw_lon)
                    addr = first.get("address", {})
                    
                    city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or clean
                    state = addr.get("state") or addr.get("region") or ""
                    country = addr.get("country") or ""
                    
                    parts = [p for p in [city, state, country] if p]
                    formatted = ", ".join(parts) if parts else first.get("display_name", clean)
                    
                    return {
                        "name": clean,
                        "city": city,
                        "state": state,
                        "country": country,
                        "formatted_query": formatted,
                        "lat": lat,
                        "lon": lon,
                    }
    except Exception as e:
        logger.error(
            "Location resolution failed: %s",
            {
                "source": "location_resolver",
                "code": "geocoding_error",
                "message": f"Nominatim lookup failed for '{clean}': {e}",
            },
        )

    logger.error(
        "Location resolution failed: %s",
        {
            "source": "location_resolver",
            "code": "location_unresolved",
            "message": f"No verified location was found for '{clean}'.",
        },
    )
    return {}


def suggest_locations(query: str = "", limit: int = 8) -> List[Dict]:
    """Fast in-memory autocomplete for cities, airport codes, and popular hubs."""
    q = query.strip().lower()
    popular_codes = ["DEL", "BOM", "BLR", "GOI", "JAI", "CCU", "HYD", "MAA", "VNS", "COK"]

    if not q:
        result = []
        for code in popular_codes:
            if code in LOCATION_DIRECTORY:
                entry = LOCATION_DIRECTORY[code]
                result.append({
                    "code": entry.get("code") or code,
                    "city": entry.get("city") or entry.get("name"),
                    "name": entry.get("name"),
                    "state": entry.get("state", ""),
                    "country": entry.get("country", ""),
                    "airport_code": entry.get("airport_code", ""),
                    "formatted_query": entry.get("formatted_query", ""),
                })
        return result

    matches = []
    seen = set()
    for code, data in LOCATION_DIRECTORY.items():
        city = (data.get("city") or "").lower()
        name = (data.get("name") or "").lower()
        state = (data.get("state") or "").lower()
        c_code = (data.get("code") or "").lower()
        airport = (data.get("airport_code") or "").lower()
        rail = (data.get("rail_code") or "").lower()
        fmt = (data.get("formatted_query") or "").lower()

        if (
            q in c_code
            or q in airport
            or q in rail
            or q in city
            or q in name
            or q in state
            or q in fmt
        ):
            display_name = data.get("city") or data.get("name")
            if display_name not in seen:
                seen.add(display_name)
                matches.append({
                    "code": data.get("code") or code,
                    "city": display_name,
                    "name": data.get("name"),
                    "state": data.get("state", ""),
                    "country": data.get("country", ""),
                    "airport_code": data.get("airport_code", ""),
                    "formatted_query": data.get("formatted_query", ""),
                })
                if len(matches) >= limit:
                    break
    return matches

