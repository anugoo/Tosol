"""
User Dashboard related views and functions
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from backend.settings import sendResponse, disconnectDB, connectDB


def dt_get_user_info(request):
    """Get current user information"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    uid = jsons.get('uid')
    
    if not uid:
        return JsonResponse(sendResponse(request, 3000, [{"error": "uid шаардлагатай"}], action))
    
    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        query = """
            SELECT uid, uname, fname, lname, phone, createddate, lastlogin, userrole
            FROM t_user
            WHERE uid = %s AND isverified = True
        """
        cursor.execute(query, (uid,))
        columns = [col[0] for col in cursor.description]
        result = cursor.fetchone()
        
        if not result:
            resp = sendResponse(request, 1004, [{"error": "Хэрэглэгч олдсонгүй"}], action)
        else:
            user_dict = dict(zip(columns, result))
            # Convert datetime to string if needed
            if user_dict.get('createddate'):
                user_dict['createddate'] = user_dict['createddate'].strftime("%Y-%m-%d %H:%M:%S")
            if user_dict.get('lastlogin'):
                user_dict['lastlogin'] = user_dict['lastlogin'].strftime("%Y-%m-%d %H:%M:%S")
            resp = sendResponse(request, 1008, [user_dict], action)
        
    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 5001, respdata, action)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)
    
    return JsonResponse(resp)


def dt_update_user_profile(request):
    """Update user profile information"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    uid = jsons.get('uid')
    
    if not uid:
        return JsonResponse(sendResponse(request, 3000, [{"error": "uid шаардлагатай"}], action))
    
    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        # Verify user exists
        cursor.execute("SELECT COUNT(*) FROM t_user WHERE uid = %s AND isverified = True", (uid,))
        if cursor.fetchone()[0] == 0:
            return JsonResponse(sendResponse(request, 1004, [{"error": "Хэрэглэгч олдсонгүй"}], action))
        
        # Build update query
        updates = []
        values = []
        
        if 'fname' in jsons:
            updates.append("fname = %s")
            values.append(jsons['fname'].capitalize())
        if 'lname' in jsons:
            updates.append("lname = %s")
            values.append(jsons['lname'].capitalize())
        if 'phone' in jsons:
            updates.append("phone = %s")
            values.append(jsons['phone'])
        
        if not updates:
            return JsonResponse(sendResponse(request, 3000, [{"error": "Шинэчлэх мэдээлэл оруулаагүй"}], action))
        
        values.append(uid)
        query = f"UPDATE t_user SET {', '.join(updates)} WHERE uid = %s RETURNING uid, uname, fname, lname, phone"
        cursor.execute(query, tuple(values))
        result = cursor.fetchone()
        myConn.commit()
        
        if result:
            user_dict = {
                'uid': result[0],
                'uname': result[1],
                'fname': result[2],
                'lname': result[3],
                'phone': result[4] if len(result) > 4 else ''
            }
            resp = sendResponse(request, 1009, [user_dict], action)
        else:
            resp = sendResponse(request, 5007, [{"error": "Шинэчлэхэд алдаа гарлаа"}], action)
        
    except Exception as e:
        if 'myConn' in locals():
            myConn.rollback()
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 5007, respdata, action)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)
    
    return JsonResponse(resp)

