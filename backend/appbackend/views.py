"""
Main views router - routes requests to appropriate modules
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from backend.settings import sendResponse

# Import modules
from . import auth, properties, comments, ml_price, edituser, user_dashboard, likes


@csrf_exempt
def checkService(request):
    """Main service router"""
    if request.method == "POST":
        try:
            jsons = json.loads(request.body)
        except:
            action = "no action"
            respdata = []
            resp = sendResponse(request, 3003, respdata)
            return JsonResponse(resp)
            
        try: 
            action = jsons["action"]
        except:
            action = "no action"
            respdata = []
            resp = sendResponse(request, 3005, respdata, action)
            return JsonResponse(resp)
        
        # Authentication actions
        if action == "login":
            return auth.dt_login(request)
        elif action == "register":
            return auth.dt_register(request)
        elif action == "forgot":
            return auth.dt_forgot(request)
        elif action == "resetpassword":
            return auth.dt_resetpassword(request)
        elif action == "changepassword":
            return auth.dt_changepassword(request)
        
        # Property actions
        elif action == "getturul":
            return properties.dt_getturul(request)
        elif action == "getzar":
            return properties.dt_getzar(request)
        elif action == "getzarbyid":
            return properties.dt_getzarbyid(request)
        elif action == "get_my_ads":
            return properties.dt_get_my_ads(request)
        elif action == "add_zar":
            return properties.dt_addzar(request)
        elif action == "update_zar":
            return properties.dt_update_zar(request)
        elif action == "delete_zar":
            return properties.dt_delete_zar(request)
        elif action == "search_zar":
            return properties.dt_search_zar(request)
        
        # Comments actions
        elif action == "add_comment":
            return comments.dt_add_comment(request)
        elif action == "get_comments":
            return comments.dt_get_comments(request)
        elif action == "delete_comment":
            return comments.dt_delete_comment(request)
        elif action == "update_comment":
            return comments.dt_update_comment(request)
        
        # ML Price estimation
        elif action == "estimate_price":
            return ml_price.dt_estimate_price(request)
        
        # User Dashboard actions
        elif action == "get_user_info":
            return user_dashboard.dt_get_user_info(request)
        elif action == "update_user_profile":
            return user_dashboard.dt_update_user_profile(request)

        # Likes actions
        elif action == "toggle_like":
            return likes.dt_toggle_like(request)
        elif action == "get_likes_count":
            return likes.dt_get_likes_count(request)
        elif action == "get_user_likes":
            return likes.dt_get_user_likes(request)
        elif action == "get_most_liked":
            return likes.dt_get_most_liked(request)

        else:
            action = "no action"
            respdata = []
            resp = sendResponse(request, 3001, respdata, action)
            return JsonResponse(resp)
    
    elif request.method == "GET":
        # Token verification for email links
        token = request.GET.get('token')
        
        if token is None:
            action = "no action" 
            respdata = []
            resp = sendResponse(request, 3015, respdata, action)
            return JsonResponse(resp)
            
        try: 
            from backend.settings import connectDB, disconnectDB, generateStr, sendResponse
            conn = connectDB()
            cursor = conn.cursor()
            
            query = f"""
                    SELECT COUNT(*) AS tokencount
                        , MIN(tokenid) AS tokenid
                        , MAX(uid) AS uid
                        , MIN(token) token
                        , MAX(tokentype) tokentype
                    FROM t_token 
                    WHERE token = '{token}' 
                            AND tokenenddate > NOW()"""
            cursor.execute(query)
            columns = cursor.description
            respRow = [{columns[index][0]: column for index, 
                column in enumerate(value)} for value in cursor.fetchall()]
            
            if len(respRow) > 0 and respRow[0]["tokencount"] == 1:
                uid = respRow[0]["uid"]
                tokentype = respRow[0]["tokentype"]
                tokenid = respRow[0]["tokenid"]
                
                if tokentype == "register":
                    query = f"""SELECT uname, lname, fname, createddate 
                            FROM t_user
                            WHERE uid = {uid}"""
                    cursor.execute(query)
                    columns = cursor.description
                    respRow = [{columns[index][0]: column for index, 
                        column in enumerate(value)} for value in cursor.fetchall()]
                    uname = respRow[0]['uname']
                    lname = respRow[0]['lname']
                    fname = respRow[0]['fname']
                    createddate = respRow[0]['createddate']
                    
                    query = f"""SELECT COUNT(*) AS verifiedusercount 
                                , MIN(uname) AS uname
                            FROM t_user 
                            WHERE uname = '{uname}' AND isverified = True"""
                    cursor.execute(query)
                    columns = cursor.description
                    respRow = [{columns[index][0]: column for index, 
                        column in enumerate(value)} for value in cursor.fetchall()]
                    
                    if respRow[0]['verifiedusercount'] == 0:
                        query = f"UPDATE t_user SET isverified = true WHERE uid = {uid}"
                        cursor.execute(query)
                        conn.commit()
                        
                        token = generateStr(30)
                        query = f"""UPDATE t_token SET token = '{token}', 
                                    tokenenddate = '1970-01-01' WHERE tokenid = {tokenid}"""
                        cursor.execute(query)
                        conn.commit()
                        
                        action = "userverified"
                        respdata = [{"uid": uid, "uname": uname, "lname": lname,
                                    "fname": fname, "tokentype": tokentype,
                                    "createddate": createddate}]
                        resp = sendResponse(request, 3010, respdata, action)
                    else:
                        action = "user verified already"
                        respdata = [{"uname": uname, "tokentype": tokentype}]
                        resp = sendResponse(request, 3014, respdata, action)
                elif tokentype == "forgot":
                    query = f"""SELECT uname, lname, fname, createddate FROM t_user
                            WHERE uid = {uid} AND isverified = True"""
                    cursor.execute(query)
                    columns = cursor.description
                    respRow = [{columns[index][0]: column for index, 
                        column in enumerate(value)} for value in cursor.fetchall()]
                    
                    uname = respRow[0]['uname']
                    lname = respRow[0]['lname']
                    fname = respRow[0]['fname']
                    createddate = respRow[0]['createddate']
                    
                    action = "forgot user verify"
                    respdata = [{"uid": uid, "uname": uname, "tokentype": tokentype,
                                "createddate": createddate}]
                    resp = sendResponse(request, 3011, respdata, action)
                else:
                    action = "no action"
                    respdata = []
                    resp = sendResponse(request, 3017, respdata, action)
            else:
                action = "notoken" 
                respdata = []
                resp = sendResponse(request, 3009, respdata, action)
                
        except Exception as e:
            action = "no action" 
            respdata = [{"error": str(e)}]
            resp = sendResponse(request, 5004, respdata, action)
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                disconnectDB(conn)
            return JsonResponse(resp)
    
    else:
        action = "no action"
        respdata = []
        resp = sendResponse(request, 3002, respdata, action)
        return JsonResponse(resp)
