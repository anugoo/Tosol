"""
Authentication-related views and functions
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.mail import send_mail
from backend.settings import sendResponse, disconnectDB, connectDB, generateStr


def dt_login(request):
    """User login service"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    
    try:
        uname = jsons['uname'].lower()
        upassword = jsons['upassword']
    except:
        action = jsons.get('action', 'login')
        respdata = []
        resp = sendResponse(request, 3006, respdata, action)
        return JsonResponse(resp)
    
    try: 
        myConn = connectDB()
        cursor = myConn.cursor()
        
        query = """SELECT COUNT(*) AS usercount, MIN(fname) AS fname, MAX(lname) AS lname 
                FROM t_user 
                WHERE uname = %s 
                AND isverified = True 
                AND upassword = %s 
                AND isbanned = False"""
        
        cursor.execute(query, (uname, upassword))
        columns = cursor.description
        respRow = [{columns[index][0]: column for index, 
            column in enumerate(value)} for value in cursor.fetchall()]
        cursor.close()

        if respRow and len(respRow) > 0 and respRow[0]['usercount'] == 1:
            cursor1 = myConn.cursor()
            
            # Get logged user information
            query = """SELECT uid, uname, fname, lname, lastlogin, userrole, phone
                    FROM t_user 
                    WHERE uname = %s AND isverified = True AND upassword = %s"""
            
            cursor1.execute(query, (uname, upassword))
            columns = cursor1.description
            respRow = [{columns[index][0]: column for index, 
                column in enumerate(value)} for value in cursor1.fetchall()]
            
            if not respRow or len(respRow) == 0:
                cursor1.close()
                resp = sendResponse(request, 1004, [{"error": "Хэрэглэгчийн мэдээлэл олдсонгүй"}], action)
                if 'myConn' in locals():
                    disconnectDB(myConn)
                return JsonResponse(resp)
            
            uid = respRow[0]['uid']
            uname = respRow[0]['uname']
            fname = respRow[0]['fname']
            lname = respRow[0]['lname']
            lastlogin = respRow[0]['lastlogin']
            userrole = respRow[0]['userrole']
            phone = respRow[0].get('phone') or ''

            # Update last login
            query = """UPDATE t_user 
                    SET lastlogin = NOW()
                    WHERE uname = %s AND isverified = True AND upassword = %s"""
            cursor1.execute(query, (uname, upassword))
            myConn.commit()
            cursor1.close()
            
            respdata = [{
                'uid': uid,
                'uname': uname,
                'fname': fname,
                'lname': lname,
                'lastlogin': lastlogin,
                'userrole': userrole,
                'phone': phone
            }]
            resp = sendResponse(request, 1002, respdata, action)
        else:
            data = [{'uname': uname}]
            resp = sendResponse(request, 1004, data, action)
    except Exception as e:
        action = jsons.get("action", "login")
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 5001, respdata, action)
    finally:
        if 'myConn' in locals():
            disconnectDB(myConn)
        return JsonResponse(resp)


def dt_register(request):
    """User registration service"""
    try:
        jsons = json.loads(request.body)
        action = jsons.get("action", "")
        uname = jsons["uname"].lower()
        lname = jsons["lname"].capitalize()
        fname = jsons["fname"].capitalize()
        upassword = jsons["upassword"]
        phone = jsons.get("phone", "")
        if phone == "":
            phone = None
    except KeyError:
        respdata = []
        return JsonResponse(sendResponse(request, 3007, respdata, jsons.get("action", "")))

    conn = None
    try:
        conn = connectDB()
        cursor = conn.cursor()
        
        # Verify if user already exists
        query = "SELECT COUNT(*) AS usercount FROM t_user WHERE uname = %s AND isverified = True"
        cursor.execute(query, (uname,))
        columns = [col[0] for col in cursor.description]
        respRow = [{columns[i]: v for i, v in enumerate(row)} for row in cursor.fetchall()]
        cursor.close()

        if respRow and len(respRow) > 0 and respRow[0]["usercount"] == 0:
            # Insert new user with phone number, ensuring phone=None translates to NULL in DB
            cursor = conn.cursor()
            query = """INSERT INTO t_user(uname, lname, fname, upassword, phone, isverified, isbanned, createddate, lastlogin, userrole) \
                        VALUES(%s, %s, %s, %s, %s, False, False, NOW(), '1970-01-01', 2) \
                        RETURNING uid"""
            cursor.execute(query, (uname, lname, fname, upassword, phone))
            uid = cursor.fetchone()[0]
            conn.commit()
            cursor.close()

            # Generate token and save
            token = generateStr(20)
            cursor = conn.cursor()
            query = """INSERT INTO t_token(uid, token, tokentype, tokenenddate, createddate) 
                        VALUES(%s, %s, 'register', NOW() + interval '1 day', NOW())"""
            cursor.execute(query, (uid, token))
            conn.commit()
            cursor.close()

            # Send verification email
            send_mail(
                subject="User burtgel batalgaajuulah mail",
                message="Та өөрийн имэйлээ баталгаажуулах холбоос дээр дарна уу.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[uname],
                fail_silently=False,
                html_message=f"""<a target='_blank' href="http://localhost:8080/verified?token={token}">CLICK ME</a>"""
            )

            respdata = [{"uname": uname, "lname": lname, "fname": fname, "uid": uid, "phone": phone}]
            return JsonResponse(sendResponse(request, 200, respdata, action))
        else:
            respdata = [{"uname": uname, "fname": fname}]
            return JsonResponse(sendResponse(request, 3008, respdata, action))

    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        respdata = [{"aldaa": str(e), "detail": error_detail}]
        return JsonResponse(sendResponse(request, 5002, respdata, action))
    finally:
        if conn:
            try:
                disconnectDB(conn)
            except:
                pass


# def dt_forgot(request):
#     """Forgot password service"""
#     jsons = json.loads(request.body)
#     action = jsons.get('action')
    
#     try:
#         uname = jsons['uname'].lower()
#     except:
#         action = jsons.get('action', 'forgot')
#         respdata = []
#         resp = sendResponse(request, 3016, respdata, action)
#         return JsonResponse(resp)
    
#     try: 
#         myConn = connectDB()
#         cursor = myConn.cursor()
        
#         query = """SELECT COUNT(*) AS usercount, MIN(uname) AS uname, MIN(uid) AS uid
#                     FROM t_user
#                     WHERE uname = %s AND isverified = True"""
#         cursor.execute(query, (uname,))
#         columns = cursor.description
#         respRow = [{columns[index][0]: column for index, 
#             column in enumerate(value)} for value in cursor.fetchall()]
        
#         if respRow and len(respRow) > 0 and respRow[0]['usercount'] == 1:
#             uid = respRow[0]['uid']
#             uname = respRow[0]['uname']
#             token = generateStr(25)
#             query = """INSERT INTO t_token(uid, token, tokentype, tokenenddate, createddate) 
#             VALUES(%s, %s, 'forgot', NOW() + interval '1 day', NOW())"""
#             cursor.execute(query, (uid, token))
#             myConn.commit()
            
#             respdata = [{"uname": uname}]
#             resp = sendResponse(request, 3012, respdata, action)
#         else:
#             respdata = [{"uname": uname}]
#             resp = sendResponse(request, 3013, respdata, action)
#     except Exception as e:
#         action = jsons.get("action", "forgot")
#         respdata = [{"error": str(e)}]
#         resp = sendResponse(request, 5003, respdata, action)
#     finally:
#         if 'cursor' in locals():
#             cursor.close()
#         if 'myConn' in locals():
#             disconnectDB(myConn)
#         return JsonResponse(resp)


def dt_forgot(request):
    """Forgot password service"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    
    try:
        uname = jsons['uname'].lower()
    except:
        action = jsons.get('action', 'forgot')
        respdata = []
        resp = sendResponse(request, 3016, respdata, action)
        return JsonResponse(resp)
    
    try: 
        myConn = connectDB()
        cursor = myConn.cursor()
        
        query = """SELECT COUNT(*) AS usercount, MIN(uname) AS uname, MIN(uid) AS uid
                    FROM t_user
                    WHERE uname = %s AND isverified = True"""
        cursor.execute(query, (uname,))
        columns = cursor.description
        respRow = [{columns[index][0]: column for index, 
            column in enumerate(value)} for value in cursor.fetchall()]
        
        if respRow and len(respRow) > 0 and respRow[0]['usercount'] == 1:
            uid = respRow[0]['uid']
            uname = respRow[0]['uname']
            token = generateStr(25)

            # Insert token
            query = """INSERT INTO t_token(uid, token, tokentype, tokenenddate, createddate) 
            VALUES(%s, %s, 'forgot', NOW() + interval '1 day', NOW())"""
            cursor.execute(query, (uid, token))
            myConn.commit()

            # ⭐ SEND EMAIL HERE ⭐
            send_mail(
                subject="Нууц үг сэргээх",
                message="Та нууц үгээ шинэчлэх бол холбоос дээр дарна уу.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[uname],
                fail_silently=False,
                html_message=f"""
                    <a target='_blank' href="http://localhost:8080/reset?token={token}">
                        Нууц үг шинэчлэх
                    </a>
                """
            )
            
            respdata = [{"uname": uname}]
            resp = sendResponse(request, 3012, respdata, action)
        else:
            respdata = [{"uname": uname}]
            resp = sendResponse(request, 3013, respdata, action)
    except Exception as e:
        action = jsons.get("action", "forgot")
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 5003, respdata, action)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)
        return JsonResponse(resp)


def dt_resetpassword(request):
    """Reset password service"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    
    try:
        newpass = jsons['newpass']
        token = jsons['token']
    except:
        action = jsons.get('action', 'resetpassword')
        respdata = []
        resp = sendResponse(request, 3018, respdata, action)
        return JsonResponse(resp)
    
    try: 
        myConn = connectDB()
        cursor = myConn.cursor()
        
        query = """SELECT COUNT (t_user.uid) AS usercount
                , MIN(uname) AS uname
                , MAX(t_user.uid) AS uid
                , MAX(t_token.tokenid) AS tokenid
                FROM t_user INNER JOIN t_token
                ON t_user.uid = t_token.uid
                WHERE t_token.token = %s
                AND t_user.isverified = True
                AND t_token.tokenenddate > NOW()"""
        cursor.execute(query, (token,))
        columns = cursor.description
        respRow = [{columns[index][0]: column for index, 
            column in enumerate(value)} for value in cursor.fetchall()]
        
        if respRow and len(respRow) > 0 and respRow[0]['usercount'] == 1:
            uid = respRow[0]['uid']
            uname = respRow[0]['uname']
            tokenid = respRow[0]['tokenid']
            new_token = generateStr(40)
            
            query = """UPDATE t_user SET upassword = %s
                        WHERE t_user.uid = %s"""
            cursor.execute(query, (newpass, uid))
            myConn.commit()
            
            query = """UPDATE t_token 
                SET token = %s
                , tokenenddate = '1970-01-01' 
                WHERE tokenid = %s"""
            cursor.execute(query, (new_token, tokenid))
            myConn.commit()
            
            respdata = [{"uname": uname}]
            resp = sendResponse(request, 3019, respdata, action)
        else:
            respdata = []
            resp = sendResponse(request, 3020, respdata, action)
    except Exception as e:
        action = jsons.get("action", "resetpassword")
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 5005, respdata, action)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)
        return JsonResponse(resp)


def dt_changepassword(request):
    """Change password service (requires old password)"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    
    try:
        uname = jsons['uname'].lower()
        newpass = jsons['newpass']
        oldpass = jsons['oldpass']
    except:
        action = jsons.get('action', 'changepassword')
        respdata = []
        resp = sendResponse(request, 3021, respdata, action)
        return JsonResponse(resp)
    
    try: 
        myConn = connectDB()
        cursor = myConn.cursor()
        
        query = """SELECT COUNT(uid) AS usercount, MAX(uid) AS uid
                    , MIN(uname) AS uname
                    , MIN(lname) AS lname
                    , MAX(fname) AS fname
                    FROM t_user
                    WHERE uname=%s  
                    AND isverified=true
                    AND upassword=%s"""
        cursor.execute(query, (uname, oldpass))
        columns = cursor.description
        respRow = [{columns[index][0]: column for index, 
            column in enumerate(value)} for value in cursor.fetchall()]
        
        if respRow and len(respRow) > 0 and respRow[0]['usercount'] == 1:
            uid = respRow[0]['uid']
            uname = respRow[0]['uname']
            lname = respRow[0]['lname']
            fname = respRow[0]['fname']
            
            query = """UPDATE t_user SET upassword=%s
                        WHERE uid=%s"""
            cursor.execute(query, (newpass, uid))
            myConn.commit()
            
            respdata = [{"uname": uname, "lname": lname, "fname": fname}]
            resp = sendResponse(request, 3022, respdata, action)
        else:
            respdata = [{"uname": uname}]
            resp = sendResponse(request, 3023, respdata, action)
    except Exception as e:
        action = jsons.get("action", "changepassword")
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 5006, respdata, action)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)
        return JsonResponse(resp)

