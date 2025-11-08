from django.http.response import JsonResponse
from django.shortcuts import render
from datetime import datetime
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from backend.settings import  sendResponse ,disconnectDB, connectDB, resultMessages,generateStr


# Function to retrieve all products from the database

# Сагсанд нэмэх
def dt_getsystems(request):
    jsons = json.loads(request.body)
    action = jsons.get('action')

    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        cursor.execute('''SELECT s.sid, s.sname, t.tname, d.devname, s.unelgee, s.tailbar, 
                    EXTRACT(YEAR FROM s.ehugatsaa) as ehugatsaa, EXTRACT(YEAR FROM s.dhugatsaa) as dhugatsaa, s.isactive  FROM t_system s INNER JOIN t_turul t ON t.tid = s.tid
                    INNER JOIN t_dev d ON d.devid = s.devid''')
        columns = cursor.description # 
            # print(columns, "tuples")post
        respRow = [{columns[index][0]:column for index, 
            column in enumerate(value)} for value in cursor.fetchall()] 
        for i in range(0,len(respRow)):
            cursor.execute(f'''SELECT e.sname FROM t_related r INNER JOIN t_system s ON r.sid = s.sid
                    INNER JOIN t_system e ON r.relatesid=e.sid
                    Where s.sid = {respRow[i]['sid']}''')
            a = cursor.fetchall()
            l = []
            for j in a:
                l.append(j[0])
                print(j[0])
            print(l)
            respRow[i]['relate'] = l

        resp = sendResponse(request, 6001, respRow, action)
    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 6002, respdata, action)
    finally:
        cursor.close()
        disconnectDB(myConn)
    return JsonResponse(resp)



def dt_getlawlah(request):
    jsons = json.loads(request.body)
    action = jsons.get('action')

    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        cursor.execute('''SELECT * FROM t_turul''')
        columns = cursor.description # 
            # print(columns, "tuples")post
        turul = [{columns[index][0]:column for index, 
            column in enumerate(value)} for value in cursor.fetchall()]
            
        cursor.execute('''SELECT * FROM t_dev''')
        columns = cursor.description # 
            # print(columns, "tuples")post
        dev = [{columns[index][0]:column for index, 
            column in enumerate(value)} for value in cursor.fetchall()]

        cursor.execute('''SELECT sid, sname FROM t_system''')
        columns = cursor.description # 
            # print(columns, "tuples")post
        sys = [{columns[index][0]:column for index, 
            column in enumerate(value)} for value in cursor.fetchall()]

        respRow = {"turul" :turul, "dev":dev,"sys":sys}
        resp = sendResponse(request, 6003, respRow, action)
    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 6004, respdata, action)
    finally:
        cursor.close()
        disconnectDB(myConn)
    return JsonResponse(resp)

def dt_createsystem(request):
    jsons = json.loads(request.body)
    action = jsons.get("action")
    try:
        sname = jsons["sname"]
        tid = jsons["tid"]  # From t_turul
        devid = jsons["devid"]  # From t_dev
        unelgee = jsons["unelgee"]
        tailbar = jsons["tailbar"]
        ehugatsaa = jsons["ehugatsaa"]
        dhugatsaa = jsons["dhugatsaa"]
        isactive = jsons["isactive"]
        relate = jsons["relatedSystems"]
        print(relate)
        ehugatsaa = ehugatsaa + "-01-01"
        dhugatsaa = dhugatsaa + "-01-01"
        myConn = connectDB()
        cursor = myConn.cursor()
        cursor.execute(
            """INSERT INTO t_system (sname, tid, devid, unelgee, tailbar, ehugatsaa, dhugatsaa, isactive)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING sid""",
            [sname, tid, devid, unelgee, tailbar, ehugatsaa, dhugatsaa, isactive]
        )
        sid = cursor.fetchone()[0]
        myConn.commit()
        for i in relate:
            cursor.execute(
                """INSERT INTO t_related (sid,relatesid)
                VALUES (%s, %s)""",
                [sid, i]
            )
        myConn.commit()

        respdata = [{"sid": sid, "sname": sname}]
        resp = sendResponse(request, 6005, respdata, action)
    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 6006, respdata, action)
    finally:
        cursor.close()
        disconnectDB(myConn)
    return JsonResponse(resp)

def dt_deletesystem(request):
    cursor = None
    myConn = None
    try:
        jsons = json.loads(request.body)
        action = jsons.get("action")
        sid = int(jsons["sid"])
        myConn = connectDB()
        cursor = myConn.cursor()
        cursor.execute(
            f"DELETE FROM t_system WHERE sid = {sid}"  # Replace 'systems' with your actual table name
        )
        myConn.commit()
        respdata = {"sid": sid}
        resp = sendResponse(request, 6007, respdata, action)
    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 6008, respdata, action)
    finally:
        if cursor:
            cursor.close()
        if myConn:
            disconnectDB(myConn)
    return JsonResponse(resp)

def dt_editsystem(request):
    jsons = json.loads(request.body)
    action = jsons.get("action")
    try:
        sid = jsons["sid"]
        sname = jsons["sname"]
        tid = jsons["tid"]  # From t_turul
        devid = jsons["devid"]  # From t_dev
        unelgee = jsons["unelgee"]
        tailbar = jsons["tailbar"]
        ehugatsaa = jsons["ehugatsaa"]
        dhugatsaa = jsons["dhugatsaa"]
        isactive = jsons["isactive"]
        relate = jsons["relatedSystems"]
        print(relate)
        ehugatsaa = ehugatsaa + "-01-01"
        dhugatsaa = dhugatsaa + "-01-01"
        myConn = connectDB()
        cursor = myConn.cursor()
        cursor.execute(
            f"""UPDATE t_system 
                SET sname ='{sname}', 
                    tid = {tid}, 
                    devid = {devid}, 
                    unelgee = {unelgee}, 
                    tailbar = '{tailbar}', 
                    ehugatsaa = '{ehugatsaa}', 
                    dhugatsaa = '{dhugatsaa}', 
                    isactive = {isactive} 
                WHERE sid = {sid}"""
        )

        cursor.execute(
            f"""DELETE FROM t_related WHERE sid = {sid}"""
        )
        if relate:
            for i in relate:
                cursor.execute(
                    """INSERT INTO t_related (sid,relatesid)
                    VALUES (%s, %s)""",
                    [sid, i]
                )
        myConn.commit()
        respdata = [{"sid": sid, "sname": sname}]
        resp = sendResponse(request, 6005, respdata, action)
    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 6006, respdata, action)
    finally:
        cursor.close()
        disconnectDB(myConn)
    return JsonResponse(resp)



@csrf_exempt
def systemcheckService(request):
    if request.method == "POST":
        try:
            jsons = json.loads(request.body)
        except:
            action = "no action"
            respdata = []
            resp = sendResponse(request, 3003, respdata)  # Standard error response
            return JsonResponse(resp)  # Make sure to return JsonResponse here
            
        try:
            action = jsons["action"]
        except:
            action = "no action"
            respdata = []
            resp = sendResponse(request, 3005, respdata, action)  # Error if action is missing
            return JsonResponse(resp)

        if action == "getsystems":
            return dt_getsystems(request)
        elif action == "getlawlah":
            return dt_getlawlah(request)
        elif action == "createsystem":
            return dt_createsystem(request)
        elif action == "deletesystem":
            return dt_deletesystem(request)
        elif action == "editsystem":
            return dt_editsystem(request)
        elif action == "getturul":
            return dt_getturul(request)
        elif action == "getsupplier":
            return dt_getsupplier(request)
        else:
            action = "no action"
            respdata = []
            resp = sendResponse(request, 3001, respdata, action)
            return JsonResponse(resp)  # Ensure JsonResponse is returned here
    else:
        action = "no action"
        respdata = []
        resp = sendResponse(request, 3002, respdata, action)
        return JsonResponse(resp)

