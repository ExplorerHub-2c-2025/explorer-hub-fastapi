"""
Script para reasignar IDs únicos a todas las respuestas (replies)
Esto soluciona el problema de IDs duplicados entre respuestas y reseñas
"""
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "explorer_hub")


def fix_reply_ids():
    """Reasigna IDs únicos a todas las respuestas"""
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🔧 Iniciando corrección de IDs de respuestas...")
    
    # Obtener el siguiente ID disponible para respuestas
    counter = db.counters.find_one({"_id": "replies"})
    next_id = counter["seq"] if counter else 1
    
    print(f"📊 Contador actual de respuestas: {next_id}")
    
    # Función recursiva para reasignar IDs
    def reassign_reply_ids(replies_list, current_id):
        """Reasigna IDs recursivamente a las respuestas"""
        for reply in replies_list:
            old_id = reply.get("id")
            reply["id"] = current_id
            print(f"  ✅ Respuesta: ID {old_id} → {current_id}")
            current_id += 1
            
            # Procesar respuestas anidadas
            if "replies" in reply and reply["replies"]:
                current_id = reassign_reply_ids(reply["replies"], current_id)
        
        return current_id
    
    # Obtener todas las reseñas
    reviews = list(db.reviews.find({}))
    print(f"\n📚 Encontradas {len(reviews)} reseñas")
    
    total_replies = 0
    
    # Procesar cada reseña
    for review in reviews:
        if "replies" in review and review["replies"]:
            print(f"\n🔍 Procesando reseña ID {review['id']}:")
            print(f"   Título: {review.get('title', 'Sin título')}")
            
            # Reasignar IDs
            next_id = reassign_reply_ids(review["replies"], next_id)
            
            # Actualizar la reseña en la base de datos
            db.reviews.update_one(
                {"_id": review["_id"]},
                {"$set": {"replies": review["replies"]}}
            )
            
            total_replies += count_replies(review["replies"])
    
    # Actualizar el contador
    db.counters.update_one(
        {"_id": "replies"},
        {"$set": {"seq": next_id}},
        upsert=True
    )
    
    print(f"\n✅ ¡Corrección completada!")
    print(f"   Total de respuestas procesadas: {total_replies}")
    print(f"   Próximo ID disponible: {next_id}")
    
    client.close()


def count_replies(replies_list):
    """Cuenta el número total de respuestas recursivamente"""
    count = len(replies_list)
    for reply in replies_list:
        if "replies" in reply and reply["replies"]:
            count += count_replies(reply["replies"])
    return count


if __name__ == "__main__":
    fix_reply_ids()
