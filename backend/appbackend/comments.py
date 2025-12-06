"""
Comments related views and functions
"""
import json
from django.http import JsonResponse
from backend.settings import sendResponse, disconnectDB, connectDB


def dt_add_comment(request):
    """Add a comment to a property"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    
    try:
        zar_id = jsons.get('zar_id')
        uid = jsons.get('uid')
        comment_text = jsons.get('comment_text', '').strip()
        
        if not zar_id or not uid or not comment_text:
            return JsonResponse(sendResponse(request, 3000, [{"error": "zar_id, uid, comment_text шаардлагатай"}], action))
        
        myConn = connectDB()
        cursor = myConn.cursor()
        
        # Insert comment
        query = """
            INSERT INTO t_zar_comment (zarid, uid, comment_text, createddate)
            VALUES (%s, %s, %s, NOW())
            RETURNING comment_id, createddate;
        """
        cursor.execute(query, (zar_id, uid, comment_text))
        result = cursor.fetchone()
        myConn.commit()
        
        comment_id = result[0]
        createddate = result[1]
        
        # Get user info
        cursor.execute("SELECT uname, fname, lname FROM t_user WHERE uid = %s", (uid,))
        user_row = cursor.fetchone()
        user_info = {
            "uname": user_row[0] if user_row else "",
            "fname": user_row[1] if user_row else "",
            "lname": user_row[2] if user_row else ""
        }
        
        respdata = [{
            "comment_id": comment_id,
            "zar_id": zar_id,
            "uid": uid,
            "comment_text": comment_text,
            "createddate": createddate.strftime("%Y-%m-%d %H:%M:%S") if createddate else "",
            **user_info
        }]
        resp = sendResponse(request, 8001, respdata, action)
        
    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 8002, respdata, action)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)
    
    return JsonResponse(resp)


def dt_get_comments(request):
    """Get all comments for a property"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    zar_id = jsons.get('zar_id')
    
    if not zar_id:
        return JsonResponse(sendResponse(request, 3000, [{"error": "zar_id шаардлагатай"}], action))
    
    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        query = """
            SELECT 
                c.comment_id,
                c.zarid,
                c.uid,
                c.comment_text,
                c.createddate,
                u.uname,
                u.fname,
                u.lname
            FROM t_zar_comment c
            INNER JOIN t_user u ON c.uid = u.uid
            WHERE c.zarid = %s
            ORDER BY c.createddate DESC;
        """

        try:
            cursor.execute(query, (zar_id,))
            columns = [col[0] for col in cursor.description]
            comments = []
            for row in cursor.fetchall():
                comment_dict = dict(zip(columns, row))
                if comment_dict.get('createddate'):
                    comment_dict['createddate'] = comment_dict['createddate'].strftime("%Y-%m-%d %H:%M:%S")
                comments.append(comment_dict)
            resp = sendResponse(request, 8003, comments, action)
        except Exception as e:
            # Specific: table does not exist
            if 't_zar_comment' in str(e):
                resp = sendResponse(request, 8004, [{"error": "Table t_zar_comment does not exist. Please run create_missing_tables.sql."}], action)
            else:
                resp = sendResponse(request, 8004, [{"error": str(e)}], action)
        
    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 8004, respdata, action)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)
    
    return JsonResponse(resp)


def dt_delete_comment(request):
    """Delete a comment - only owner can delete"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    comment_id = jsons.get('comment_id')
    uid = jsons.get('uid')  # Current user ID
    
    if not comment_id or not uid:
        return JsonResponse(sendResponse(request, 3000, [{"error": "comment_id, uid шаардлагатай"}], action))
    
    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        # Verify ownership
        cursor.execute("SELECT uid FROM t_zar_comment WHERE comment_id = %s", (comment_id,))
        result = cursor.fetchone()
        if not result:
            return JsonResponse(sendResponse(request, 8005, [{"error": "Сэтгэгдэл олдсонгүй"}], action))
        
        if result[0] != uid:
            return JsonResponse(sendResponse(request, 8006, [{"error": "Та энэ сэтгэгдлийг устгах эрхгүй"}], action))
        
        cursor.execute("DELETE FROM t_zar_comment WHERE comment_id = %s RETURNING comment_id;", (comment_id,))
        deleted = cursor.fetchone()
        myConn.commit()
        
        if deleted:
            resp = sendResponse(request, 8007, [{"comment_id": deleted[0]}], action)
        else:
            resp = sendResponse(request, 8005, [{"error": "Сэтгэгдэл олдсонгүй"}], action)
        
    except Exception as e:
        if 'myConn' in locals():
            myConn.rollback()
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 8008, respdata, action)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)
    
    return JsonResponse(resp)

