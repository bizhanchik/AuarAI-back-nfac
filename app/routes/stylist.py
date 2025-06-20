from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai
import os
import json

from ..database import get_db
from ..auth import get_current_user
from ..models import User, ClothingItem
from ..schemas import ClothingItem as ClothingItemSchema

router = APIRouter(prefix="/stylist", tags=["stylist"])

# Updated Pydantic models for structured outfit output with full item objects
class OutfitSuggestion(BaseModel):
    hat: Optional[ClothingItemSchema] = Field(description="Hat or headwear item object with image, if available")
    top: Optional[ClothingItemSchema] = Field(description="Top/shirt/blouse item object with image")
    bottom: Optional[ClothingItemSchema] = Field(description="Bottom/pants/skirt item object with image")
    shoes: Optional[ClothingItemSchema] = Field(description="Footwear item object with image")
    accessories: List[ClothingItemSchema] = Field(description="List of accessory item objects with images", default=[])
    styling_tips: str = Field(description="Additional styling advice for this outfit")

class OutfitResponse(BaseModel):
    outfit: OutfitSuggestion
    available_items: List[str]
    message: str

# Configure Gemini AI
def get_gemini_model():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="Google API key not configured"
        )
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.0-flash')

def get_user_clothing_items_for_prompt(user_id: int, db: Session) -> str:
    """Get user's clothing items formatted for AI prompt"""
    items = db.query(ClothingItem).filter(ClothingItem.owner_id == user_id).all()
    
    if not items:
        return "No clothing items found for this user."
    
    formatted_items = []
    for item in items:
        item_info = f"- {item.name}"
        if item.brand:
            item_info += f" by {item.brand}"
        if item.color:
            item_info += f" (Color: {item.color})"
        if item.category:
            item_info += f" [Category: {item.category}]"
        if item.material:
            item_info += f" [Material: {item.material}]"
        if item.description:
            item_info += f" - {item.description}"
        
        formatted_items.append(item_info)
    
    return "\n".join(formatted_items)

def find_clothing_item_by_name(name: str, items: List[ClothingItem]) -> Optional[ClothingItem]:
    """Find a clothing item by name (case-insensitive, partial match)"""
    if not name:
        return None
    
    name_lower = name.lower()
    
    # First try exact match
    for item in items:
        if item.name.lower() == name_lower:
            return item
    
    # Then try partial match
    for item in items:
        if name_lower in item.name.lower() or item.name.lower() in name_lower:
            return item
    
    return None

def get_items_by_category(items: List[ClothingItem], categories: List[str]) -> List[ClothingItem]:
    """Get items that match any of the given categories"""
    return [item for item in items if item.category and item.category.lower() in [cat.lower() for cat in categories]]

def convert_orm_to_schema(item: ClothingItem) -> ClothingItemSchema:
    """Convert SQLAlchemy ORM object to Pydantic schema"""
    return ClothingItemSchema(
        id=item.id,
        owner_id=item.owner_id,
        name=item.name,
        brand=item.brand,
        category=item.category,
        gender=item.gender,
        color=item.color,
        size=item.size,
        material=item.material,
        description=item.description,
        image_url=item.image_url,
        store_name=item.store_name,
        store_url=item.store_url,
        product_url=item.product_url,
        price=item.price,
        tags=item.tags or [],
        occasions=item.occasions or [],
        weather_suitability=item.weather_suitability or [],
        ai_generated_embedding=item.ai_generated_embedding or [],
        available=item.available,
        updated_at=item.updated_at
    )

@router.post("/suggest-outfit", response_model=OutfitResponse)
async def suggest_outfit(
    occasion: Optional[str] = "casual", 
    weather: Optional[str] = "mild",
    style_preference: Optional[str] = "casual",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate outfit suggestions based on user's clothing items
    """
    try:
        # Get user's clothing items
        user_items = get_user_clothing_items_for_prompt(current_user.id, db)
        
        if "No clothing items found" in user_items:
            raise HTTPException(
                status_code=404,
                detail="No clothing items found. Please add some clothes to your wardrobe first."
            )
        
        # Get actual clothing items for lookup
        all_items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
        
        # Get Gemini model
        model = get_gemini_model()
        
        # Create prompt for outfit suggestion
        prompt = f"""
        You are a professional fashion stylist. Based on the following clothing items available in this person's wardrobe, suggest a complete outfit.

        Available clothing items:
        {user_items}

        Requirements:
        - Occasion: {occasion}
        - Weather: {weather}
        - Style preference: {style_preference}

        Please create a stylish and practical outfit suggestion. Choose items that work well together in terms of color, style, and appropriateness for the occasion and weather.

        Return your response in the following JSON format:
        {{
            "hat": "specific hat item name if available, or null",
            "top": "specific top item name (required)",
            "bottom": "specific bottom item name (required)", 
            "shoes": "specific shoes item name (required)",
            "accessories": ["list of specific accessory item names"],
            "styling_tips": "specific styling advice for this outfit combination"
        }}

        Important: Only use items that are actually available in the wardrobe list above. Be specific with item names and match them exactly.
        """
        
        # Generate response
        response = model.generate_content(prompt)
        
        # Extract JSON from response
        response_text = response.text.strip()
        
        # Try to find JSON in the response
        try:
            # Look for JSON content between ```json and ``` or just find the JSON object
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            elif "{" in response_text:
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                json_text = response_text[json_start:json_end]
            else:
                raise ValueError("No JSON found in response")
            
            ai_outfit_data = json.loads(json_text)
            
            # Convert AI suggestions to actual ClothingItem objects
            hat_item = None
            if ai_outfit_data.get("hat"):
                hat_item = find_clothing_item_by_name(ai_outfit_data["hat"], all_items)
            
            top_item = find_clothing_item_by_name(ai_outfit_data.get("top", ""), all_items)
            bottom_item = find_clothing_item_by_name(ai_outfit_data.get("bottom", ""), all_items)
            shoes_item = find_clothing_item_by_name(ai_outfit_data.get("shoes", ""), all_items)
            
            # Find accessories
            accessory_items = []
            for acc_name in ai_outfit_data.get("accessories", []):
                acc_item = find_clothing_item_by_name(acc_name, all_items)
                if acc_item:
                    accessory_items.append(acc_item)
            
            # Fallback: if AI couldn't find suitable items, use category-based selection
            if not top_item:
                tops = get_items_by_category(all_items, ['top', 'shirt', 'blouse', 't-shirt', 'sweater', 'hoodie'])
                top_item = tops[0] if tops else None
            
            if not bottom_item:
                bottoms = get_items_by_category(all_items, ['bottom', 'pants', 'jeans', 'skirt', 'shorts'])
                bottom_item = bottoms[0] if bottoms else None
            
            if not shoes_item:
                shoes = get_items_by_category(all_items, ['shoes', 'footwear', 'sneakers', 'boots', 'sandals', 'heels'])
                shoes_item = shoes[0] if shoes else None
            
            if not hat_item and ai_outfit_data.get("hat"):
                hats = get_items_by_category(all_items, ['hat', 'cap'])
                hat_item = hats[0] if hats else None
            
            if not accessory_items and ai_outfit_data.get("accessories"):
                accessories = get_items_by_category(all_items, ['accessories', 'accessory'])
                accessory_items = accessories[:2]  # Take up to 2 accessories
            
            outfit = OutfitSuggestion(
                hat=convert_orm_to_schema(hat_item) if hat_item else None,
                top=convert_orm_to_schema(top_item) if top_item else None,
                bottom=convert_orm_to_schema(bottom_item) if bottom_item else None,
                shoes=convert_orm_to_schema(shoes_item) if shoes_item else None,
                accessories=[convert_orm_to_schema(item) for item in accessory_items],
                styling_tips=ai_outfit_data.get("styling_tips", f"Here's a great {style_preference} outfit for {occasion}!")
            )
            
        except (json.JSONDecodeError, ValueError, Exception) as e:
            # Fallback: create a simple outfit suggestion using category-based selection
            tops = get_items_by_category(all_items, ['top', 'shirt', 'blouse', 't-shirt', 'sweater', 'hoodie'])
            bottoms = get_items_by_category(all_items, ['bottom', 'pants', 'jeans', 'skirt', 'shorts'])
            shoes = get_items_by_category(all_items, ['shoes', 'footwear', 'sneakers', 'boots', 'sandals', 'heels'])
            hats = get_items_by_category(all_items, ['hat', 'cap'])
            accessories = get_items_by_category(all_items, ['accessories', 'accessory'])
            
            outfit = OutfitSuggestion(
                hat=convert_orm_to_schema(hats[0]) if hats else None,
                top=convert_orm_to_schema(tops[0]) if tops else None,
                bottom=convert_orm_to_schema(bottoms[0]) if bottoms else None,
                shoes=convert_orm_to_schema(shoes[0]) if shoes else None,
                accessories=[convert_orm_to_schema(item) for item in accessories[:2]],
                styling_tips=f"Here's a great {style_preference} outfit for {occasion}! " + response_text[:200] if response_text else f"Perfect for {occasion}!"
            )
        
        # Get list of available items for reference
        available_items = [item.name for item in all_items]
        
        return OutfitResponse(
            outfit=outfit,
            available_items=available_items,
            message=f"Here's your {style_preference} outfit suggestion for {occasion}!"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating outfit suggestion: {str(e)}"
        )

@router.get("/my-wardrobe")
async def get_my_wardrobe(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's clothing items organized by category"""
    items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
    
    if not items:
        raise HTTPException(
            status_code=404,
            detail="No clothing items found. Please add some clothes to your wardrobe first."
        )
    
    # Organize by category
    wardrobe = {}
    for item in items:
        category = item.category or "Other"
        if category not in wardrobe:
            wardrobe[category] = []
        
        wardrobe[category].append({
            "id": item.id,
            "name": item.name,
            "brand": item.brand,
            "color": item.color,
            "size": item.size,
            "material": item.material,
            "description": item.description
        })
    
    return {
        "wardrobe": wardrobe,
        "total_items": len(items),
        "categories": list(wardrobe.keys())
    } 