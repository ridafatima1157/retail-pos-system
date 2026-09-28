from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app import models

from app.routers.auth import router as auth_router
from app.routers.items import router as items_router
from app.routers.categories import router as categories_router
from app.routers.inventory import router as inventory_router
from app.routers.sales import router as sales_router
from app.routers.audit_logs import router as audit_logs_router

from app.routers import users

from app.routers import sales
# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="RetailPOS API",
    description="Backend API for RetailPOS",
    version="1.0.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Routers
app.include_router(auth_router)
app.include_router(items_router)
app.include_router(categories_router)
app.include_router(inventory_router)
app.include_router(sales_router)
app.include_router(
    sales.router,
    prefix="/api",
)
app.include_router(
    users.router,
    prefix="/api",
)
app.include_router(
    audit_logs_router,
    prefix="/api"
)

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "RetailPOS API is running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy"
    }