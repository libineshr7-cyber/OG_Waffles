@echo off
title OG Waffles POS Server
echo ==========================================================
echo       OG WAFFLES & FRIED CHICKEN - LOCAL BACKEND SERVER
echo ==========================================================
echo.
echo Starting FastAPI Backend & Static File Server on port 8000...
echo Connecting to MongoDB Atlas Database...
echo.
echo Server URL: http://127.0.0.1:8000
echo.
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
