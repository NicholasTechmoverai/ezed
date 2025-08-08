from tortoise import Tortoise
import os
WEB_SERVER = 'https://e-zed.netlify.app'
BASE_SERVER = 'https://teacher-tomatoes-travelers-you.trycloudflare.com'
# BASE_SERVER = 'http://localhost:8000'

db_url = "mysql://root:75223031@localhost/the_food_lovers"



async def init_db(app):
    await Tortoise.init(
        db_url=db_url,
        modules={"models": ["models"]},  
    )
    await Tortoise.generate_schemas()


TORTOISE_ORM = {
    "connections": {"default": db_url},
    "apps": {
        "models": {
            "models": ["models", 
                        # "models.admin_user",
                       "aerich.models"],
            "default_connection": "default",
        }
    },
#aerich init -t config.TORTOISE_ORM  -> to initiliaze aerich
#aerich init-db
#aerich migrate -> to create migration files
#aerich upgrade -> to apply the migration files
#aerich downgrade -> to revert the migration files

}

class Config:
    SECRET_KEY = "75223031"  # 🔐 Use a strong random string in production
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 60 minutes
    
    
    SITE_NAME = 'The Food Lovers'
    # SITE_LOGO = f"{BASE_SERVER}/uploads/logo.ico"
    SITE_LOGO = "https://the-food-lovers.netlify.app/assets/logo-DuL6grKj.ico"
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    CHEF_PATH = os.path.join('uploads', 'chefs')
    USER_PATH = os.path.join('uploads', 'users')

    
