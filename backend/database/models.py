import json
from sqlalchemy import Boolean, Column, Float, Integer, String, Text
from database.db import Base


class Attraction(Base):
    __tablename__ = "attractions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    name_en = Column(String(200))
    description = Column(Text)
    description_en = Column(Text)
    category_level = Column(Integer, nullable=False)  # 1=iconic, 2=ricercato, 3=nascosto
    block_id = Column(Integer)   # geographic cluster id — 4 attractions per block = 1 potential day
    zone = Column(String(50))    # zone label for ordering blocks
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    estimated_visit_time = Column(Integer, default=60)  # minutes
    tags = Column(Text, default="[]")                   # JSON array
    attraction_type = Column(String(100))               # "museo", "chiesa", "parco", ecc.
    ticket_url = Column(String(500))
    city = Column(String(100), default="roma")
    # Food spot fields
    is_food_spot = Column(Boolean, default=False, nullable=False)
    food_type = Column(String(100))   # "ristorante", "trattoria", "street food", "bar", "bistrot"
    meal_type = Column(String(20))    # "lunch", "dinner", "both"
    rating = Column(Float)

    def tags_list(self) -> list:
        if not self.tags:
            return []
        if isinstance(self.tags, list):
            return self.tags
        return json.loads(self.tags)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "name_en": getattr(self, "name_en", None),
            "description": self.description,
            "description_en": getattr(self, "description_en", None),
            "category_level": self.category_level,
            "block_id": self.block_id,
            "zone": self.zone,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "estimated_visit_time": self.estimated_visit_time,
            "tags": self.tags_list(),
            "attraction_type": self.attraction_type,
            "ticket_url": getattr(self, "ticket_url", None),
            "city": self.city,
            "is_food_spot": bool(self.is_food_spot),
            "food_type": self.food_type,
            "meal_type": self.meal_type,
            "rating": self.rating,
        }


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    name_en = Column(String(200))
    name_fr = Column(String(200))
    description = Column(Text)
    description_en = Column(Text)
    description_fr = Column(Text)
    ingredients = Column(Text, default="[]")      # JSON array (IT)
    ingredients_en = Column(Text, default="[]")   # JSON array (EN)
    ingredients_fr = Column(Text, default="[]")   # JSON array (FR)
    city = Column(String(100), default="roma")

    def ingredients_list(self) -> list:
        if not self.ingredients:
            return []
        if isinstance(self.ingredients, list):
            return self.ingredients
        return json.loads(self.ingredients)

    def ingredients_en_list(self) -> list:
        if not self.ingredients_en:
            return []
        if isinstance(self.ingredients_en, list):
            return self.ingredients_en
        return json.loads(self.ingredients_en)

    def ingredients_fr_list(self) -> list:
        if not self.ingredients_fr:
            return []
        if isinstance(self.ingredients_fr, list):
            return self.ingredients_fr
        return json.loads(self.ingredients_fr)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "name_en": getattr(self, "name_en", None),
            "name_fr": getattr(self, "name_fr", None),
            "description": self.description,
            "description_en": getattr(self, "description_en", None),
            "description_fr": getattr(self, "description_fr", None),
            "ingredients": self.ingredients_list(),
            "ingredients_en": self.ingredients_en_list(),
            "ingredients_fr": self.ingredients_fr_list(),
            "city": self.city,
        }
