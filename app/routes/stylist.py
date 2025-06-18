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

router = APIRouter(prefix="/stylist", tags=["stylist"])

# Pydantic model for structured outfit output
class OutfitSuggestion(BaseModel):
    hat: Optional[str] = Field(description="Hat or headwear item name, if available")
    top: str = Field(description="Top/shirt/blouse item name")
    bottom: str = Field(description="Bottom/pants/skirt item name")
    shoes: str = Field(description="Footwear item name")
    accessories: List[str] = Field(description="List of accessory item names", default=[])
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

        Important: Only use items that are actually available in the wardrobe list above. Be specific with item names.
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
            
            outfit_data = json.loads(json_text)
            outfit = OutfitSuggestion(**outfit_data)
            
        except (json.JSONDecodeError, ValueError, Exception) as e:
            # Fallback: create a simple outfit suggestion
            items = db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()
            
            tops = [item for item in items if item.category.lower() in ['top', 'shirt', 'blouse', 't-shirt']]
            bottoms = [item for item in items if item.category.lower() in ['bottom', 'pants', 'jeans', 'skirt']]
            shoes = [item for item in items if item.category.lower() in ['shoes', 'footwear']]
            hats = [item for item in items if item.category.lower() in ['hat', 'cap']]
            accessories = [item for item in items if item.category.lower() in ['accessories', 'accessory']]
            
            outfit = OutfitSuggestion(
                hat=hats[0].name if hats else None,
                top=tops[0].name if tops else "No suitable top found",
                bottom=bottoms[0].name if bottoms else "No suitable bottom found", 
                shoes=shoes[0].name if shoes else "No suitable shoes found",
                accessories=[acc.name for acc in accessories[:2]],
                styling_tips=f"Here's a great {style_preference} outfit for {occasion}! " + response_text[:200]
            )
        
        # Get list of available items for reference
        available_items = [item.name for item in db.query(ClothingItem).filter(ClothingItem.owner_id == current_user.id).all()]
        
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