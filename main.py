from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from datetime import datetime
import os
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="Gin Taxi")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db():
    return psycopg2.connect(DATABASE_URL)

def init_database():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            fullname TEXT,
            phone TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP
        )
    ''')
    conn.commit()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            driver_id INTEGER,
            guest_name TEXT,
            guest_phone TEXT,
            guest_email TEXT,
            pickup_address TEXT,
            dropoff_address TEXT,
            tariff TEXT,
            price REAL,
            status TEXT DEFAULT 'Новый',
            created_at TIMESTAMP
        )
    ''')
    conn.commit()
    
    try:
        cursor.execute('ALTER TABLE orders ADD COLUMN driver_id INTEGER')
        conn.commit()
        print("Колонка driver_id добавлена")
    except Exception as e:
        conn.rollback()
        print(f"Колонка driver_id уже существует или ошибка: {e}")
    
    try:
        cursor.execute('ALTER TABLE orders ADD COLUMN status TEXT DEFAULT \'Новый\'')
        conn.commit()
        print("Колонка status добавлена")
    except Exception as e:
        conn.rollback()
        print(f"Колонка status уже существует или ошибка: {e}")
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS applications (
            id SERIAL PRIMARY KEY,
            fullname TEXT,
            phone TEXT,
            email TEXT,
            role TEXT,
            created_at TIMESTAMP
        )
    ''')
    conn.commit()
    
    cursor.execute('SELECT * FROM users WHERE email = %s', ('user@gin.ru',))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO users (fullname, phone, email, password, role, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', ('Тестовый Пользователь', '+79991234567', 'user@gin.ru', '123456', 'user', datetime.now()))
        conn.commit()
    
    cursor.execute('SELECT * FROM users WHERE email = %s', ('driver@gin.ru',))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO users (fullname, phone, email, password, role, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', ('Тестовый Водитель', '+79998887766', 'driver@gin.ru', '12345', 'driver', datetime.now()))
        conn.commit()
    
    cursor.close()
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
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO users (fullname, phone, email, password, role, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (fullname, phone, email, password, 'user', datetime.now()))
        conn.commit()
        return {"success": True}
    except Exception:
        return {"success": False, "error": "Email уже существует"}
    finally:
        cursor.close()
        conn.close()

@app.get("/login-user", response_class=HTMLResponse)
async def login_user_page(request: Request):
    return templates.TemplateResponse("login_user.html", {"request": request})

@app.post("/login-user")
async def login_user(email: str = Form(...), password: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT id, fullname, phone, email, role FROM users WHERE email = %s AND password = %s', (email, password))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if user:
        return {"success": True, "user_id": user['id'], "fullname": user['fullname'], "phone": user['phone'], "email": user['email'], "role": user['role']}
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
    conn = get_db()
    cursor = conn.cursor()
    
    if user_id:
        cursor.execute('''
            INSERT INTO orders (user_id, pickup_address, dropoff_address, tariff, price, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (user_id, pickup, dropoff, tariff, price, 'Новый', datetime.now()))
    else:
        cursor.execute('''
            INSERT INTO orders (guest_name, guest_phone, guest_email, pickup_address, dropoff_address, tariff, price, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (guest_name, guest_phone, guest_email, pickup, dropoff, tariff, price, 'Новый', datetime.now()))
    
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True}

@app.get("/user-orders/{user_id}")
async def get_user_orders(user_id: int):
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('''
        SELECT id, pickup_address, dropoff_address, tariff, price, status, created_at
        FROM orders WHERE user_id = %s ORDER BY created_at DESC
    ''', (user_id,))
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"id": o['id'], "pickup": o['pickup_address'], "dropoff": o['dropoff_address'], "tariff": o['tariff'], "price": o['price'], "status": o['status'], "date": o['created_at']} for o in orders]

@app.get("/user-orders/all")  # <-- ИСПРАВЛЕНО! БЕЗ параметра
async def get_all_orders():
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('''
        SELECT id, pickup_address, dropoff_address, tariff, price, status
        FROM orders ORDER BY created_at DESC
    ''')
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"id": o['id'], "pickup": o['pickup_address'], "dropoff": o['dropoff_address'], "tariff": o['tariff'], "price": o['price'], "status": o['status']} for o in orders]

@app.get("/driver-orders/{driver_id}")
async def get_driver_orders(driver_id: int):
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('''
        SELECT id, pickup_address, dropoff_address, tariff, price, status, created_at
        FROM orders WHERE driver_id = %s ORDER BY created_at DESC
    ''', (driver_id,))
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return orders

@app.post("/assign-order/{order_id}")
async def assign_order(order_id: int, driver_id: int = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE orders SET driver_id = %s, status = 'В пути' WHERE id = %s
    ''', (driver_id, order_id))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True}

@app.post("/update-order-status/{order_id}")
async def update_order_status(order_id: int, status: str = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE orders SET status = %s WHERE id = %s', (status, order_id))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True}

@app.get("/login", response_class=HTMLResponse)
async def login_driver_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/driver-dashboard", response_class=HTMLResponse)
async def driver_dashboard(request: Request):
    return templates.TemplateResponse("driver_dashboard.html", {"request": request})

@app.get("/order/{order_id}", response_class=HTMLResponse)
async def order_detail(request: Request, order_id: int):
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT id, pickup_address, dropoff_address, tariff, price, status FROM orders WHERE id = %s', (order_id,))
    order = cursor.fetchone()
    cursor.close()
    conn.close()
    return templates.TemplateResponse("order_detail.html", {"request": request, "order": order})

@app.get("/admin", response_class=HTMLResponse)
async def admin_panel(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})

@app.get("/api/all-orders")
async def api_all_orders():
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT * FROM orders ORDER BY id DESC')
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return orders

@app.get("/api/all-drivers")
async def api_all_drivers():
    conn = get_db()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute('SELECT id, fullname, phone, email FROM users WHERE role = %s', ('driver',))
    drivers = cursor.fetchall()
    cursor.close()
    conn.close()
    return drivers

@app.post("/api/assign-order")
async def admin_assign_order(order_id: int = Form(...), driver_id: int = Form(...)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE orders SET driver_id = %s, status = %s WHERE id = %s', (driver_id, 'Назначен', order_id))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True}

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
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO applications (fullname, phone, email, role, created_at)
        VALUES (%s, %s, %s, %s, %s)
    ''', (fullname, phone, email, role, datetime.now()))
    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)