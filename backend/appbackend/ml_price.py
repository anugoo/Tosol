"""
Machine Learning price estimation
"""
import json
import pickle
import os
from django.http import JsonResponse
from backend.settings import sendResponse, disconnectDB, connectDB

# Simple linear regression model for price estimation
# In production, you would load a trained model
def estimate_price_simple(rooms, m2, district_id, type_id, status_id):
    """
    Simple price estimation based on property features
    This is a placeholder - replace with actual ML model
    """
    # Base price per square meter (in Mongolian Tugrik)
    base_price_per_m2 = 2000000  # 2M MNT per m²
    
    # Adjustments
    room_multiplier = 1 + (rooms * 0.1)  # Each room adds 10%
    type_multiplier = {
        1: 1.0,   # Apartment
        2: 1.2,   # House
        3: 0.8,   # Land
    }.get(type_id, 1.0)
    
    status_multiplier = {
        1: 1.0,   # Sale
        2: 0.3,   # Rent (monthly)
        3: 0.5,   # Preorder
    }.get(status_id, 1.0)
    
    # District multiplier (simplified - in production use actual data)
    district_multiplier = 1.0
    if district_id:
        # Premium districts get higher multiplier
        premium_districts = [1, 2, 3]  # Example district IDs
        if district_id in premium_districts:
            district_multiplier = 1.3
    
    estimated_price = base_price_per_m2 * m2 * room_multiplier * type_multiplier * status_multiplier * district_multiplier
    
    return int(estimated_price)


def dt_estimate_price(request):
    """Estimate property price using ML"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    
    try:
        # Get property features
        rooms = int(jsons.get('rooms', 0))
        m2 = float(jsons.get('m2', 0))
        district_id = int(jsons.get('district_id', 0))
        type_id = int(jsons.get('type_id', 1))
        status_id = int(jsons.get('status_id', 1))
        
        if m2 <= 0:
            return JsonResponse(sendResponse(request, 9001, [{"error": "Талбай (m²) 0-ээс их байх ёстой"}], action))
        
        # Estimate price
        estimated_price = estimate_price_simple(rooms, m2, district_id, type_id, status_id)
        
        # Get price range (±20%)
        min_price = int(estimated_price * 0.8)
        max_price = int(estimated_price * 1.2)
        
        respdata = [{
            "estimated_price": estimated_price,
            "min_price": min_price,
            "max_price": max_price,
            "rooms": rooms,
            "m2": m2,
            "district_id": district_id,
            "type_id": type_id,
            "status_id": status_id
        }]
        
        resp = sendResponse(request, 9002, respdata, action)
        
    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 9003, respdata, action)
    finally:
        if 'myConn' in locals():
            disconnectDB(myConn)
    
    return JsonResponse(resp)


def train_model_from_data():
    """
    Train ML model from historical data
    This would be called separately to train/retrain the model
    """
    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        # Get historical property data
        query = """
            SELECT z_rooms, z_m2, z_duureg, z_type, z_status, z_price
            FROM t_zar
            WHERE z_isactive = TRUE AND z_price > 0
            LIMIT 1000;
        """
        
        cursor.execute(query)
        data = cursor.fetchall()
        
        if len(data) < 10:
            return {"error": "Not enough data to train model"}
        
        # Simple linear regression training
        # In production, use scikit-learn or similar
        X = []
        y = []
        
        for row in data:
            rooms, m2, district, ptype, status, price = row
            if m2 and price:
                X.append([rooms or 0, float(m2), district or 0, ptype or 1, status or 1])
                y.append(float(price))
        
        # Simple average-based model
        # In production, use proper ML library
        avg_price_per_m2 = sum(y) / sum([x[1] for x in X])
        
        model_data = {
            "avg_price_per_m2": avg_price_per_m2,
            "sample_size": len(data)
        }
        
        # Save model (in production, use proper model serialization)
        model_path = os.path.join(os.path.dirname(__file__), 'price_model.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        return {"success": True, "model_trained": True, "sample_size": len(data)}
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)

