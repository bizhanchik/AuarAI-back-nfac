import os
import io
import json
import re
import requests
from typing import Dict, List, Optional
from dotenv import load_dotenv
from PIL import Image
import google.generativeai as genai
from .image_compression import ImageCompressionService

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def ai_classify_clothing(image_bytes: bytes) -> Dict:
    try:
        print(f"🔍 Starting AI classification with image size: {len(image_bytes)} bytes")
        
        # Compress image for AI processing to reduce costs
        compressed_bytes = ImageCompressionService.compress_for_ai_processing(image_bytes)
        print(f"📦 Compressed image size: {len(compressed_bytes)} bytes")
        
        image = Image.open(io.BytesIO(compressed_bytes))
        print(f"🖼️ Image opened successfully: {image.size}, mode: {image.mode}")

        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = (
            "You are a professional fashion stylist. Classify this clothing item and return JSON in this EXACT format only:\n"
            "{\n"
            "  \"name\": \"specific item name (e.g., 'Blue Denim Jacket', 'Black Cotton T-Shirt')\",\n"
            "  \"brand\": \"brand name or null if not visible\",\n"
            "  \"category\": \"clothing category (e.g., 'T-shirt', 'Jeans', 'Dress', 'Jacket', 'Sneakers')\",\n"
            "  \"gender\": \"male/female/unisex\",\n"
            "  \"color\": \"primary color\",\n"
            "  \"size\": \"size if visible or null\",\n"
            "  \"material\": \"fabric/material type if identifiable\",\n"
            "  \"description\": \"detailed description including style, fit, and notable features\",\n"
            "  \"tags\": [\"style tags like casual, formal, vintage, trendy, etc.\"],\n"
            "  \"occasions\": [\"suitable occasions like work, party, casual, gym, date, etc.\"],\n"
            "  \"weather_suitability\": [\"appropriate weather like summer, winter, spring, fall, rain, cold, warm, etc.\"]\n"
            "}\n\n"
            "Important: Always provide meaningful values for tags, occasions, and weather_suitability arrays - never leave them empty!"
        )

        print("🤖 Sending request to Gemini AI...")
        response = model.generate_content([prompt, image], generation_config={"temperature": 0.4})
        print(f"✅ Received AI response: {response.text[:200]}...")  # First 200 chars

        # Попробуем извлечь JSON
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            json_text = match.group()
            print(f"📝 Extracted JSON: {json_text[:200]}...")
            
            result = json.loads(json_text)
            print("✅ Successfully parsed AI response:", result)
            
            # Ensure we have the required arrays
            if 'tags' not in result:
                result['tags'] = []
            if 'occasions' not in result:
                result['occasions'] = []
            if 'weather_suitability' not in result:
                result['weather_suitability'] = []
                
            return result
        else:
            print("❌ No JSON object found in AI response")
            print(f"Full response: {response.text}")
            return {"error": "No JSON object found in AI response"}

    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        return {"error": f"JSON parsing error: {str(e)}"}
    except Exception as e:
        print(f"❌ Error in AI classification: {e}")
        return {"error": f"AI classification error: {str(e)}"}

async def classify_clothing_image(image_url: str, additional_context: Optional[str] = None) -> Dict:
    """
    Classify clothing from an image URL.
    Downloads the image and uses the AI classification function.
    """
    try:
        # Download the image from URL
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Get image bytes
        image_bytes = response.content
        
        # Use existing classification function
        result = ai_classify_clothing(image_bytes)
        
        print("🔍 Raw AI classification result:", result)
        
        # Map the result to match the expected schema
        mapped_result = {
            "clothing_type": result.get("category", "Unknown"),
            "color": result.get("color", "Unknown"),
            "material": result.get("material"),
            "pattern": None,
            "brand": result.get("brand"),
            "confidence_score": 0.8,  # Default confidence
            "description": result.get("description"),
            "predicted_tags": result.get("tags", []),
            "occasions": result.get("occasions", []),
            "weather_suitability": result.get("weather_suitability", []),
            "predicted_name": result.get("name"),
            "predicted_category": result.get("category"),
            "predicted_color": result.get("color"),
            "predicted_brand": result.get("brand"),
            "predicted_material": result.get("material"),
            "additional_details": {
                "gender": result.get("gender"),
                "size": result.get("size")
            }
        }
        
        print("📦 Final mapped result:", mapped_result)
        
        return mapped_result
        
    except requests.RequestException as e:
        print(f"❌ Error downloading image from {image_url}: {e}")
        raise Exception(f"Failed to download image: {str(e)}")
    except Exception as e:
        print(f"❌ Error classifying image: {e}")
        raise Exception(f"Classification failed: {str(e)}")

def ai_generate_daily_outfits(forecast_data: Dict, user_items: List[Dict] = None, occasion: str = "casual") -> Dict:
    """Generate outfit recommendations for each day based on weather forecast"""
    
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    # Prepare weather context
    city = forecast_data.get("city", "your location")
    daily_forecasts = forecast_data.get("daily_forecasts", [])
    
    # Prepare user items context if available
    items_context = ""
    if user_items:
        items_summary = []
        for item in user_items[:10]:  # Limit to prevent token overflow
            item_desc = f"{item.get('name', 'item')} ({item.get('category', 'clothing')}, {item.get('color', 'unknown color')})"
            items_summary.append(item_desc)
        items_context = f"\n\nUser's available items: {', '.join(items_summary)}"
    
    # Create forecast summary
    forecast_summary = []
    for day in daily_forecasts:
        forecast_summary.append(
            f"{day['date_formatted']}: {day['temperature_min']}-{day['temperature_max']}°C, {day['condition']}, {day['description']}"
        )
    
    prompt = f"""
You are a professional fashion stylist. Create outfit recommendations for the next {len(daily_forecasts)} days in {city}.

Weather forecast:
{chr(10).join(forecast_summary)}

Occasion: {occasion}
{items_context}

Return ONLY a JSON object in this exact format:
{{
    "city": "{city}",
    "total_days": {len(daily_forecasts)},
    "daily_outfits": [
        {{
            "date": "YYYY-MM-DD",
            "date_formatted": "Day, Month DD",
            "weather_summary": "Temperature range and condition",
            "outfit_theme": "Brief theme description",
            "recommendations": {{
                "top": {{
                    "item": "Recommended top",
                    "color": "Recommended color",
                    "reason": "Why this works for the weather"
                }},
                "bottom": {{
                    "item": "Recommended bottom",
                    "color": "Recommended color", 
                    "reason": "Why this works for the weather"
                }},
                "footwear": {{
                    "item": "Recommended shoes",
                    "color": "Recommended color",
                    "reason": "Why this works for the weather"
                }},
                "outerwear": {{
                    "item": "Recommended jacket/coat or null if not needed",
                    "color": "Recommended color or null",
                    "reason": "Why this is needed or null"
                }},
                "accessories": [
                    {{
                        "item": "Accessory name",
                        "reason": "Why it's recommended"
                    }}
                ]
            }},
            "styling_tips": "2-3 practical styling tips for the day",
            "color_palette": ["color1", "color2", "color3"]
        }}
    ],
    "general_tips": "Overall styling advice for the forecast period"
}}

Consider weather conditions, temperature ranges, and practicality. Focus on real, wearable combinations.
"""

    try:
        response = model.generate_content(prompt, generation_config={"temperature": 0.6})
        
        print("AI forecast outfit response:", response.text[:500])  # Debug output
        
        # Extract JSON from response
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            outfit_data = json.loads(match.group())
            return outfit_data
        else:
            raise ValueError("No JSON object found in AI outfit response.")
            
    except Exception as e:
        print("❌ Error generating outfit recommendations:", e)
        
        # Fallback with simple recommendations
        fallback_outfits = []
        for day in daily_forecasts:
            temp_avg = (day['temperature_min'] + day['temperature_max']) / 2
            
            # Simple weather-based recommendations
            if temp_avg < 0:
                outfit = {
                    "date": day["date"],
                    "date_formatted": day["date_formatted"],
                    "weather_summary": f"{day['temperature_min']}-{day['temperature_max']}°C, {day['condition']}",
                    "outfit_theme": "Warm winter layers",
                    "recommendations": {
                        "top": {"item": "Warm sweater", "color": "Dark colors", "reason": "Retains heat in cold weather"},
                        "bottom": {"item": "Winter pants", "color": "Dark blue or black", "reason": "Warm and practical"},
                        "footwear": {"item": "Winter boots", "color": "Black or brown", "reason": "Waterproof and warm"},
                        "outerwear": {"item": "Heavy coat", "color": "Dark colors", "reason": "Essential for freezing temperatures"},
                        "accessories": [{"item": "Scarf", "reason": "Neck protection"}, {"item": "Gloves", "reason": "Hand warmth"}]
                    },
                    "styling_tips": "Layer clothing for warmth. Choose waterproof materials.",
                    "color_palette": ["Black", "Navy", "Gray"]
                }
            elif temp_avg < 15:
                outfit = {
                    "date": day["date"],
                    "date_formatted": day["date_formatted"],
                    "weather_summary": f"{day['temperature_min']}-{day['temperature_max']}°C, {day['condition']}",
                    "outfit_theme": "Comfortable layers",
                    "recommendations": {
                        "top": {"item": "Light sweater", "color": "Neutral tones", "reason": "Perfect for mild weather"},
                        "bottom": {"item": "Jeans or trousers", "color": "Blue or khaki", "reason": "Versatile and comfortable"},
                        "footwear": {"item": "Sneakers", "color": "White or neutral", "reason": "Comfortable for walking"},
                        "outerwear": {"item": "Light jacket", "color": "Neutral", "reason": "Extra warmth if needed"},
                        "accessories": [{"item": "Light scarf", "reason": "Style and mild warmth"}]
                    },
                    "styling_tips": "Layer with removable pieces. Choose breathable fabrics.",
                    "color_palette": ["Beige", "Navy", "White"]
                }
            else:
                outfit = {
                    "date": day["date"],
                    "date_formatted": day["date_formatted"],
                    "weather_summary": f"{day['temperature_min']}-{day['temperature_max']}°C, {day['condition']}",
                    "outfit_theme": "Light and comfortable",
                    "recommendations": {
                        "top": {"item": "T-shirt or blouse", "color": "Light colors", "reason": "Breathable in warm weather"},
                        "bottom": {"item": "Light pants or shorts", "color": "Light blue or beige", "reason": "Cool and comfortable"},
                        "footwear": {"item": "Light sneakers", "color": "White or light colors", "reason": "Breathable and comfortable"},
                        "outerwear": {"item": None, "color": None, "reason": None},
                        "accessories": [{"item": "Sunglasses", "reason": "Sun protection"}]
                    },
                    "styling_tips": "Choose breathable fabrics. Light colors reflect heat.",
                    "color_palette": ["White", "Light Blue", "Beige"]
                }
            
            fallback_outfits.append(outfit)
        
        return {
            "city": city,
            "total_days": len(daily_forecasts),
            "daily_outfits": fallback_outfits,
            "general_tips": "Dress appropriately for the weather and stay comfortable throughout the day."
        }

def ai_analyze_body_photo(image_bytes: bytes) -> Dict:
    """Analyze a full-body photo to provide personalized style recommendations"""
    try:
        print(f"🔍 Starting body photo analysis with image size: {len(image_bytes)} bytes")
        
        # Compress image for AI processing to reduce costs
        compressed_bytes = ImageCompressionService.compress_for_ai_processing(image_bytes)
        print(f"📦 Compressed image size: {len(compressed_bytes)} bytes")
        
        image = Image.open(io.BytesIO(compressed_bytes))
        print(f"🖼️ Image opened successfully: {image.size}, mode: {image.mode}")

        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = (
            "You are a professional fashion stylist and body type analyst. Analyze this full-body photo and provide personalized style recommendations.\n\n"
            "Analyze the following aspects:\n"
            "1. Body type/shape (apple, pear, hourglass, rectangle, inverted triangle, etc.)\n"
            "2. Body proportions (leg-to-body ratio, shoulder-to-hip ratio, etc.)\n"
            "3. Best colors for this person's skin tone and overall appearance\n"
            "4. Style recommendations that would flatter this body type\n"
            "5. Fashion tips specific to their proportions\n\n"
            "Return ONLY a JSON object in this exact format:\n"
            "{\n"
            "  \"bodyType\": \"specific body type classification\",\n"
            "  \"recommendedColors\": [\"list of 5-8 colors that would look best\"],\n"
            "  \"styleRecommendations\": [\"list of 4-6 specific style recommendations\"],\n"
            "  \"proportions\": {\n"
            "    \"legToBodyRatio\": 0.0,\n"
            "    \"shoulderToHipRatio\": 0.0,\n"
            "    \"waistToHipRatio\": 0.0\n"
            "  },\n"
            "  \"confidence\": 0.0,\n"
            "  \"fashionTips\": [\"specific tips for this body type\"],\n"
            "  \"bestSilhouettes\": [\"clothing silhouettes that work best\"],\n"
            "  \"avoidPatterns\": [\"patterns or styles to avoid\"],\n"
            "  \"accessoryTips\": [\"accessory recommendations\"]\n"
            "}\n\n"
            "Be specific and practical in your recommendations. Focus on actionable advice."
        )

        response = model.generate_content([prompt, image], generation_config={"temperature": 0.3})
        
        print("AI body analysis response:", response.text[:500])  # Debug output
        
        # Extract JSON from response
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            try:
                result = json.loads(match.group())
                print("✅ Successfully parsed body analysis JSON")
                
                # Validate required fields and provide defaults
                if not result.get("bodyType"):
                    result["bodyType"] = "Rectangle"
                
                if not result.get("recommendedColors"):
                    result["recommendedColors"] = ["Navy", "White", "Black", "Gray", "Burgundy"]
                
                if not result.get("styleRecommendations"):
                    result["styleRecommendations"] = [
                        "Wear well-fitted clothing",
                        "Choose quality fabrics",
                        "Focus on classic silhouettes",
                        "Add accessories for personality"
                    ]
                
                if not result.get("proportions"):
                    result["proportions"] = {
                        "legToBodyRatio": 0.5,
                        "shoulderToHipRatio": 1.0,
                        "waistToHipRatio": 0.8
                    }
                
                if not result.get("confidence"):
                    result["confidence"] = 0.7
                
                return result
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing error: {e}")
                raise ValueError(f"Invalid JSON in AI response: {e}")
        else:
            print("❌ No JSON object found in AI response")
            raise ValueError("No JSON object found in AI body analysis response")
            
    except Exception as e:
        print(f"❌ Error in body photo analysis: {e}")
        
        # Return fallback analysis
        return {
            "bodyType": "Rectangle",
            "recommendedColors": [
                "Navy Blue", "White", "Black", "Gray", "Burgundy", 
                "Forest Green", "Cream", "Camel"
            ],
            "styleRecommendations": [
                "Wear well-fitted clothing that follows your body's natural lines",
                "Choose quality fabrics over trendy pieces",
                "Focus on classic silhouettes that never go out of style",
                "Add personality with accessories and colors",
                "Invest in good undergarments for better fit",
                "Choose clothes that make you feel confident"
            ],
            "proportions": {
                "legToBodyRatio": 0.5,
                "shoulderToHipRatio": 1.0,
                "waistToHipRatio": 0.8
            },
            "confidence": 0.5,
            "fashionTips": [
                "Focus on fit over trends",
                "Build a capsule wardrobe with versatile pieces",
                "Choose colors that complement your skin tone"
            ],
            "bestSilhouettes": [
                "A-line dresses",
                "Straight-leg pants",
                "Tailored blazers"
            ],
            "avoidPatterns": [
                "Overly busy prints",
                "Horizontal stripes in unflattering areas"
            ],
            "accessoryTips": [
                "Use belts to define your waist",
                "Choose accessories that complement your outfit",
                "Don't over-accessorize"
            ],
            "error": f"Analysis failed: {str(e)}"
        }

def ai_analyze_wardrobe_compatibility(body_analysis: Dict, wardrobe_items: List[Dict]) -> Dict:
    """Analyze how well wardrobe items match the body analysis recommendations"""
    try:
        print(f"🔍 Starting wardrobe compatibility analysis with {len(wardrobe_items)} items")
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Prepare data for AI analysis
        body_info = {
            "bodyType": body_analysis.get("bodyType", "Unknown"),
            "recommendedColors": body_analysis.get("recommendedColors", []),
            "styleRecommendations": body_analysis.get("styleRecommendations", [])
        }
        
        prompt = (
            f"You are a professional fashion stylist. Analyze how well this wardrobe matches the body analysis recommendations.\n\n"
            f"Body Analysis Results:\n"
            f"- Body Type: {body_info['bodyType']}\n"
            f"- Recommended Colors: {', '.join(body_info['recommendedColors'])}\n"
            f"- Style Recommendations: {', '.join(body_info['styleRecommendations'])}\n\n"
            f"Wardrobe Items ({len(wardrobe_items)} total):\n"
        )
        
        for i, item in enumerate(wardrobe_items[:20]):  # Limit to first 20 items to avoid token limits
            prompt += f"- {item.get('name', 'Unknown')}: {item.get('category', 'Unknown')} in {item.get('color', 'Unknown')} color\n"
        
        if len(wardrobe_items) > 20:
            prompt += f"... and {len(wardrobe_items) - 20} more items\n"
        
        prompt += (
            "\nAnalyze the compatibility and return ONLY a JSON object in this exact format:\n"
            "{\n"
            "  \"compatibility_percentage\": 0.0,\n"
            "  \"matching_items\": 0,\n"
            "  \"recommendations\": [\"list of 3-5 specific recommendations\"],\n"
            "  \"color_matches\": [\"colors from wardrobe that match recommendations\"],\n"
            "  \"style_matches\": [\"wardrobe items that match style recommendations\"],\n"
            "  \"missing_essentials\": [\"essential items missing from wardrobe\"]\n"
            "}\n\n"
            "Be specific and practical. Focus on actionable advice for improving wardrobe compatibility."
        )
        
        response = model.generate_content(prompt, generation_config={"temperature": 0.3})
        
        print("AI wardrobe compatibility response:", response.text[:500])  # Debug output
        
        # Extract JSON from response
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            try:
                result = json.loads(match.group())
                print("✅ Successfully parsed wardrobe compatibility JSON")
                
                # Validate and provide defaults
                if not isinstance(result.get("compatibility_percentage"), (int, float)):
                    result["compatibility_percentage"] = 75.0
                
                if not isinstance(result.get("matching_items"), int):
                    result["matching_items"] = len(wardrobe_items) // 2
                
                if not result.get("recommendations"):
                    result["recommendations"] = [
                        "Consider adding more versatile pieces",
                        "Focus on recommended colors for your body type",
                        "Invest in quality basics"
                    ]
                
                if not result.get("color_matches"):
                    result["color_matches"] = []
                
                if not result.get("style_matches"):
                    result["style_matches"] = []
                
                if not result.get("missing_essentials"):
                    result["missing_essentials"] = ["White button-down shirt", "Dark jeans", "Blazer"]
                
                return result
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing error: {e}")
                raise ValueError(f"Invalid JSON in AI response: {e}")
        else:
            print("❌ No JSON object found in AI response")
            raise ValueError("No JSON object found in AI wardrobe compatibility response")
            
    except Exception as e:
        print(f"❌ Error in wardrobe compatibility analysis: {e}")
        
        # Return fallback analysis
        matching_items = 0
        color_matches = []
        
        # Simple color matching logic
        recommended_colors = body_analysis.get("recommendedColors", [])
        for item in wardrobe_items:
            item_color = item.get("color", "").lower()
            for rec_color in recommended_colors:
                if rec_color.lower() in item_color or item_color in rec_color.lower():
                    matching_items += 1
                    if rec_color not in color_matches:
                        color_matches.append(rec_color)
                    break
        
        compatibility_percentage = min(90.0, (matching_items / len(wardrobe_items)) * 100) if wardrobe_items else 0.0
        
        return {
            "compatibility_percentage": compatibility_percentage,
            "matching_items": matching_items,
            "recommendations": [
                "Add more items in your recommended colors",
                "Focus on versatile pieces that can be mixed and matched",
                "Consider your body type when shopping for new items"
            ],
            "color_matches": color_matches,
            "style_matches": ["Classic pieces", "Well-fitted items"],
            "missing_essentials": ["White button-down shirt", "Dark jeans", "Blazer"],
            "error": f"Analysis failed, using fallback: {str(e)}"
        }
