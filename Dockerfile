# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG VITE_API_URL
ARG VITE_DIRECTUS_URL=/__directus
ARG VITE_DIRECTUS_PUBLIC_URL
ARG VITE_DIRECTUS_STATIC_TOKEN

ENV VITE_API_URL=$VITE_API_URL \
    VITE_DIRECTUS_URL=$VITE_DIRECTUS_URL \
    VITE_DIRECTUS_PUBLIC_URL=$VITE_DIRECTUS_PUBLIC_URL \
    VITE_DIRECTUS_STATIC_TOKEN=$VITE_DIRECTUS_STATIC_TOKEN

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
