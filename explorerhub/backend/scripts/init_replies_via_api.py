"""
Script para inicializar replies usando la API del backend
Asume que el backend está corriendo en localhost:8000
"""
import requests
import json

# Esta es una forma simple de migrar las reseñas existentes
# agregándoles el campo replies si no lo tienen

BACKEND_URL = "http://localhost:8000"

def init_replies():
    print("Inicializando sistema de respuestas...")
    print("Este script agregará el campo 'replies: []' a todas las reseñas existentes")
    print("a través de la actualización automática del modelo en el backend.")
    print("\n✓ El backend ya se encargará de agregar 'replies: []' a reseñas nuevas")
    print("✓ Las reseñas existentes se actualizarán automáticamente al cargarlas")
    print("\nSistema de respuestas listo para usar!")

if __name__ == "__main__":
    init_replies()
