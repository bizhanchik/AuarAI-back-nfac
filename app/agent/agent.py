#1. basic agent 
from google.adk.agents import Agent, LlmAgent
from google.adk.tools.tool_context import ToolContext
from pydantic import BaseModel, Field
from typing import List, Optional
import jwt
from sqlalchemy.orm import Session
import sys
import os

# Add the parent directory to the path to import from the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.database import SessionLocal
    from app.models import User, ClothingItem
    from app.auth import SECRET_KEY, ALGORITHM
except ImportError:
    # Fallback for different path structures
    import sys
    import os
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
    from app.database import SessionLocal
    from app.models import User, ClothingItem
    from app.auth import SECRET_KEY, ALGORITHM

# Pydantic model for structured outfit output
class OutfitSuggestion(BaseModel):
    hat: Optional[str] = Field(description="Hat or headwear item name, if available")
    top: str = Field(description="Top/shirt/blouse item name")
    bottom: str = Field(description="Bottom/pants/skirt item name")
    shoes: str = Field(description="Footwear item name")
    accessories: List[str] = Field(description="List of accessory item names")
    styling_tips: str = Field(description="Additional styling advice for this outfit")

# Function to get user's clothing items (not a tool, just a regular function)
def get_user_clothing_for_prompt(bearer_token: str):
    """
    Get user's clothing items from database using bearer token authentication.
    This function is used to prepare data for the agent's prompt.
    
    Args:
        bearer_token: JWT bearer token for user authentication
        
    Returns:
        list: User's clothing items or empty list if error
    """
    try:
        # Remove 'Bearer ' prefix if present
        if bearer_token.startswith('Bearer '):
            bearer_token = bearer_token[7:]
        
        # Decode JWT token
        payload = jwt.decode(bearer_token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        
        if not username:
            return []
        
        # Get database session
        db = SessionLocal()
        try:
            # Find user by username
            user = db.query(User).filter(User.username == username).first()
            if not user:
                return []
            
            # Get user's clothing items
            clothing_items = db.query(ClothingItem).filter(ClothingItem.owner_id == user.id).all()
            
            # Format items for the AI
            items_list = []
            for item in clothing_items:
                items_list.append({
                    "name": item.name,
                    "category": item.category,
                    "color": item.color,
                    "brand": item.brand,
                    "size": item.size,
                    "gender": item.gender
                })
            
            return items_list
            
        finally:
            db.close()
            
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
        return []

# Agent with tool that can fetch clothing items and suggest outfits
def get_user_clothing_items(bearer_token: str, tool_context: ToolContext) -> dict:
    """
    Tool to get user's clothing items and suggest an outfit.
    
    Args:
        bearer_token: JWT bearer token for user authentication
        tool_context: Automatically provided by ADK
        
    Returns:
        dict: Status and user's clothing items
    """
    clothing_items = get_user_clothing_for_prompt(bearer_token)
    
    if not clothing_items:
        return {
            "status": "error",
            "error_message": "Could not retrieve clothing items. Please check your authentication token."
        }
    
    # Store items in context state for the agent to use
    tool_context.state["user_clothing_items"] = clothing_items
    
    # Format clothing items by category for better organization
    categories = {}
    for item in clothing_items:
        category = item["category"].lower()
        if category not in categories:
            categories[category] = []
        categories[category].append(f"{item['name']} ({item['color']}, {item['brand']})")
    
    return {
        "status": "success",
        "items_count": len(clothing_items),
        "items_by_category": categories,
        "message": f"Found {len(clothing_items)} clothing items. Ready to create an outfit!"
    }

# Stylist Agent with tool capability
stylist_agent_with_tool = Agent(
    name="stylist_agent_with_tool",
    model="gemini-2.0-flash",
    description="An AI stylist that fetches user's clothing and creates outfit suggestions",
    instruction="""
    You are an expert AI stylist with excellent fashion sense and knowledge of current trends.
    
    When a user requests an outfit suggestion:
    1. First, use the get_user_clothing_items tool with their bearer token to retrieve their clothing collection
    2. Analyze their available items by category (hats, tops, bottoms, shoes, accessories)
    3. Create a cohesive, stylish outfit by selecting one item from each relevant category
    4. Ensure color coordination and style compatibility
    5. Provide styling tips to complete the look
    
    Guidelines for outfit creation:
    - Choose items that complement each other in color, style, and occasion
    - Consider seasonal appropriateness
    - Hat is optional - only include if user has hats and it fits the style
    - Include 1-3 accessories if available
    - Provide practical styling advice
    
    Always be encouraging and explain why your choices work well together.
    If the user doesn't have enough items in certain categories, suggest what types of items would complete their wardrobe.
    
    Present your outfit suggestion in a clear, organized format with explanations.
    """,
    tools=[get_user_clothing_items]
)

# Structured Output Stylist Agent (for when clothing data is already available)
structured_stylist_agent = LlmAgent(
    name="structured_stylist_agent",
    model="gemini-2.0-flash",
    description="An AI stylist that creates structured outfit suggestions from provided clothing data",
    instruction="""
    You are an expert AI stylist. Based on the user's clothing collection provided in the prompt, 
    create a stylish outfit suggestion.
    
    Analyze the available items and create a cohesive, stylish outfit by selecting one item from each category.
    Consider color coordination, style compatibility, and seasonal appropriateness.
    
    Return your response in the exact JSON format specified by the schema.
    """,
    output_schema=OutfitSuggestion,
    output_key="outfit_recommendation"
)

# Basic agent (keeping the original)
basic_agent = Agent(
    name="basic_agent",
    model="gemini-2.0-flash",
    description="A basic agent that can answer questions and help with tasks",
    instruction="""
    You are a helpful assistant that can answer questions and help with tasks.
    """,
)

# Set stylist agent as the root agent (using the tool version)
root_agent = stylist_agent_with_tool