from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from datetime import datetime
import sqlite3
import os

app = FastAPI(title="Gin Taxi")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

def init_database():
    conn = sqlite3.connect(os.path.join(BASE_DIR, 'database.db'))
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT,
            phone TEXT,
            email TEXT UNIQUE,
            password TEXT,
            created_at TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            guest_name TEXT,
            guest_phone TEXT,
            guest_email TEXT,
            pickup_address TEXT,
            dropoff_address TEXT,
            tariff TEXT,
            price REAL,
            status TEXT,
            created_at TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT,
            phone TEXT,
            email TEXT,
            role TEXT,
            created_at TIMESTAMP
        )
    ''')
    
    cursor.execute('SELECT * FROM users WHERE email = ?', ('user@gin.ru',))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO users (fullname, phone, email, password, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', ('Тестовый Пользователь', '+79991234567', 'user@gin.ru', '123456', datetime.now()))
    
    conn.commit()
    conn.close()

init_database()

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.post("/register")
async def register(
    fullname: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    password: str = Form(...)
):
    conn = sqlite3.connect(os.path.join(BASE_DIR, 'database.db'))
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO users (fullname, phone, email, password, created_at) VALUES (?, ?, ?, ?, ?)',
                       (fullname, phone, email, password, datetime.now()))
        conn.commit()
        return {"success": True}
    except sqlite3.IntegrityError:
        return {"success": False, "error": "Email уже существует"}
    finally:
        conn.close()

@app.get("/login-user", response_class=HTMLResponse)
async def login_user_page(request: Request):
    return templates.TemplateResponse("login_user.html", {"request": request})

@app.post("/login-user")
async def login_user(email: str = Form(...), password: str = Form(...)):
    conn = sqlite3.connect(os.path.join(BASE_DIR, 'database.db'))
    cursor = conn.cursor()
    cursor.execute('SELECT id, fullname, phone, email FROM users WHERE email = ? AND password = ?', (email, password))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {"success": True, "user_id": user[0], "fullname": user[1], "phone": user[2], "email": user[3]}
    return {"success": False, "error": "Неверный email или пароль"}

@app.get("/user-profile", response_class=HTMLResponse)
async def user_profile(request: Request):
    return templates.TemplateResponse("user_profile.html", {"request": request})

@app.post("/save-order")
async def save_order(
    user_id: int = Form(None),
    guest_name: str = Form(None),
    guest_phone: str = Form(None),
    guest_email: str = Form(None),
    pickup: str = Form(...),
    dropoff: str = Form(...),
    tariff: str = Form(...),
    price: float = Form(...)
):
    conn = sqlite3.connect(os.path.join(BASE_DIR, 'database.db'))
    cursor = conn.cursor()
    
    if user_id:
        cursor.execute('''
            INSERT INTO orders (user_id, pickup_address, dropoff_address, tariff, price, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, pickup, dropoff, tariff, price, 'Новый', datetime.now()))
    else:
        cursor.execute('''
            INSERT INTO orders (guest_name, guest_phone, guest_email, pickup_address, dropoff_address, tariff, price, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (guest_name, guest_phone, guest_email, pickup, dropoff, tariff, price, 'Новый', datetime.now()))
    
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/user-orders/{user_id}")
async def get_user_orders(user_id: int):
    conn = sqlite3.connect(os.path.join(BASE_DIR, 'database.db'))
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, pickup_address, dropoff_address, tariff, price, status, created_at
        FROM orders WHERE user_id = ? ORDER BY created_at DESC
    ''', (user_id,))
    orders = cursor.fetchall()
    conn.close()
    return [{"id": o[0], "pickup": o[1], "dropoff": o[2], "tariff": o[3], "price": o[4], "status": o[5], "date": o[6]} for o in orders]

@app.get("/user-orders/all")
async def get_all_orders():
    conn = sqlite3.connect(os.path.join(BASE_DIR, 'database.db'))
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, pickup_address, dropoff_address, tariff, price, status
        FROM orders WHERE status = 'Новый' ORDER BY created_at DESC
    ''')
    orders = cursor.fetchall()
    conn.close()
    return [{"id": o[0], "pickup": o[1], "dropoff": o[2], "tariff": o[3], "price": o[4], "status": o[5]} for o in orders]

@app.get("/login", response_class=HTMLResponse)
async def login_driver_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/driver-dashboard", response_class=HTMLResponse)
async def driver_dashboard(request: Request):
    return templates.TemplateResponse("driver_dashboard.html", {"request": request})

@app.get("/application", response_class=HTMLResponse)
async def application_page(request: Request):
    return templates.TemplateResponse("application.html", {"request": request})

@app.post("/save-application")
async def save_application(
    fullname: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    role: str = Form(...)
):
    conn = sqlite3.connect(os.path.join(BASE_DIR, 'database.db'))
    cursor = conn.cursor()
    cursor.execute('INSERT INTO applications (fullname, phone, email, role, created_at) VALUES (?, ?, ?, ?, ?)',
                   (fullname, phone, email, role, datetime.now()))
    conn.commit()
    conn.close()
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)