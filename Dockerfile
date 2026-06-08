FROM node:20 as build-stage
WORKDIR /frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.12-slim
WORKDIR /backend
COPY --from=build-stage /frontend/dist ./backend/static
RUN pip install -r requirements.txt 
COPY . .
CMD ["python", "main.py"]