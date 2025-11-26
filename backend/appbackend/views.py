from django.http.response import JsonResponse
from django.shortcuts import render
from datetime import datetime
from django.http import JsonResponse
import json
from django.conf import settings
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from backend.settings import sendResponse ,disconnectDB, connectDB, resultMessages,generateStr
import os
import base64
import uuid



def dt_getturul(request):
    try:
        jsons = json.loads(request.body)
        action = jsons.get('action')
    except json.JSONDecodeError:
        return JsonResponse(sendResponse(request, 6004, [{"error": "Invalid JSON"}], None))

    myConn = connectDB()
    try:
        with myConn.cursor() as cursor:
            # Turul
            cursor.execute("SELECT * FROM t_turul")
            columns = [col[0] for col in cursor.description]
            turul = [dict(zip(columns, row)) for row in cursor.fetchall()]

            # Tuluv
            cursor.execute("SELECT * FROM t_tuluv")
            columns = [col[0] for col in cursor.description]
            tuluv = [dict(zip(columns, row)) for row in cursor.fetchall()]

            # Hot
            cursor.execute("SELECT * FROM t_hot")
            columns = [col[0] for col in cursor.description]
            hot = [dict(zip(columns, row)) for row in cursor.fetchall()]

            # Duureg
            cursor.execute("SELECT * FROM t_duureg")
            columns = [col[0] for col in cursor.description]
            duureg = [dict(zip(columns, row)) for row in cursor.fetchall()]

            cursor.execute("SELECT * FROM t_hiits")
            columns = [col[0] for col in cursor.description]
            hiits = [dict(zip(columns, row)) for row in cursor.fetchall()]

        respRow = {"turul": turul, "tuluv": tuluv, "hot": hot, "duureg": duureg,"hiits": hiits }
        resp = sendResponse(request, 6003, respRow, action)

    except Exception as e:
        import traceback
        respdata = [{"error": str(e), "trace": traceback.format_exc()}]
        resp = sendResponse(request, 6004, respdata, action)

    finally:
        disconnectDB(myConn)

    return JsonResponse(resp)

# backend/appbackend/views.py
import json

def dt_getzar(request):
    jsons = json.loads(request.body)
    action = jsons.get('action')

    try:
        myConn = connectDB()
        cursor = myConn.cursor()

        query = """
SELECT 
    z.zid,
    z.z_title,
    t.tname AS type_name,
    tu.tname AS status_name,
    z.z_price,
    h.hname AS hot_name,
    d.dname AS district_name,
    z.z_address,
    z.z_rooms,
    z.z_bathroom,
    z.z_balcony,
    z.z_m2,
    z.z_floor,
    hi.h_name AS hiits_name,
    z.z_description,
    z.z_isactive,
    COALESCE(
        json_agg(
            json_build_object(
                'zurag_id', tz.zid,
                'image_path', tz.zurag
            )
        ) FILTER (WHERE tz.zid IS NOT NULL),
        '[]'
    ) AS images
FROM t_zar z

INNER JOIN t_turul t ON z.z_type = t.tid
INNER JOIN t_tuluv tu ON z.z_status = tu.tid
INNER JOIN t_hot h ON h.hid = z.z_hot
INNER JOIN t_duureg d ON z.z_duureg = d.did
INNER JOIN t_hiits hi ON hi.h_id = z.z_hiits
LEFT JOIN t_zar_zurag tz ON z.zid = tz.zarid
WHERE z.z_isactive = TRUE
GROUP BY 
    z.zid,z.z_title, t.tname, tu.tname, z.z_price,
    h.hname, d.dname, z.z_address, z.z_rooms, z.z_bathroom, z.z_balcony,
    z.z_m2, z.z_floor, hi.h_name, z.z_description, z.z_isactive
ORDER BY z.zid DESC;

        """

        cursor.execute(query)
        columns = [col[0] for col in cursor.description]
        zar_list = []

        for row in cursor.fetchall():
            zar_dict = dict(zip(columns, row))
            # JSON string → Python list
            images = zar_dict['images']
            zar_dict['images'] = json.loads(images) if isinstance(images, str) else images
            zar_list.append(zar_dict)

        resp = sendResponse(request, 7005, zar_list, action)

    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 7006, respdata, action)

    finally:
        cursor.close()
        disconnectDB(myConn)

    return JsonResponse(resp)


def dt_getzarbyid(request):
    jsons = json.loads(request.body)
    action = jsons.get('action')
    zid = jsons.get('zid')  # UI талаас ирж буй зарын ID

    if not zid:
        return JsonResponse(sendResponse(request, 7006, [{"error": "zid хоосон байна"}], action))

    try:
        myConn = connectDB()
        cursor = myConn.cursor()

        query = f"""
SELECT
    z.zid,
    z.uid,
    u.uname AS user_email,
    z.z_title,
    z.z_type,
    z.z_status,
    z.z_hot,
    z.z_duureg,
    z.z_hiits,
    t.tid AS type_id,
    tu.tid AS status_id,
    t.tname AS type_name,
    tu.tname AS status_name,
    z.z_price,
    h.hname AS hot_name,
    h.hid AS hot_id,
    d.dname AS district_name,
    d.did AS district_id,
    z.z_address,
    z.z_rooms,
    z.z_bathroom,
    z.z_balcony,
    z.z_m2,
    z.z_floor,
    hi.h_name AS hiits_name,
    hi.h_id AS hiits_id,
    z.z_description,
    z.z_isactive,
    COALESCE(
        json_agg(
            json_build_object(
                'zurag_id', tz.zid,
                'image_path',
                CASE
                    WHEN tz.zurag LIKE 'data:image%' THEN tz.zurag
                    ELSE CONCAT('data:image/jpeg;base64,', tz.zurag)
                END
            )
        ) FILTER (WHERE tz.zid IS NOT NULL),
        '[]'
    ) AS images
FROM t_zar z
INNER JOIN t_user u ON z.uid = u.uid
INNER JOIN t_turul t ON z.z_type = t.tid
INNER JOIN t_tuluv tu ON z.z_status = tu.tid
INNER JOIN t_hot h ON h.hid = z.z_hot
INNER JOIN t_duureg d ON z.z_duureg = d.did
INNER JOIN t_hiits hi ON hi.h_id = z.z_hiits
LEFT JOIN t_zar_zurag tz ON z.zid = tz.zarid
WHERE z.zid = {zid}
GROUP BY
    z.zid, 
    z.uid, 
    u.uname, 
    z.z_title,
    z.z_type,          -- ЭНД
    z.z_status,        -- ЭНД
    z.z_hot,           -- ЭНД
    z.z_duureg,        -- ЭНД
    z.z_hiits,         -- ЭНД
    t.tid, 
    tu.tid, 
    t.tname, 
    tu.tname, 
    z.z_price,
    h.hname, 
    h.hid, 
    d.dname, 
    d.did, 
    z.z_address, 
    z.z_rooms, 
    z.z_bathroom, 
    z.z_balcony,
    z.z_m2, 
    z.z_floor, 
    hi.h_name, 
    hi.h_id, 
    z.z_description, 
    z.z_isactive;
        """

        cursor.execute(query)
        columns = [col[0] for col in cursor.description]
        result = cursor.fetchone()

        if not result:
            resp = sendResponse(request, 7006, [{"error": "Тухайн ID-тэй зар олдсонгүй"}], action)
        else:
            zar_dict = dict(zip(columns, result))
            images = zar_dict["images"]
            zar_dict["images"] = json.loads(images) if isinstance(images, str) else images
            resp = sendResponse(request, 7005, [zar_dict], action)

    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 7006, respdata, action)

    finally:
        cursor.close()
        disconnectDB(myConn)

    return JsonResponse(resp)



def dt_addzar(request):
    action = None
    data = {}

    try:
        # 1. JSON эсвэл FormData вэ?
        if request.META.get('CONTENT_TYPE', '').startswith('application/json'):
            # JSON ирсэн бол (base64 зурагтай)
            try:
                payload = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse(sendResponse(request, 7002, {"error": "Invalid JSON"}, "add_zar"))

            action = payload.get('action')
            if action != "add_zar":
                return JsonResponse(sendResponse(request, 7001, {"error": "Invalid action"}, action))

            data = {
                "uid": payload.get('uid'),
                "z_title": payload.get('z_title'),
                "z_type": payload.get('z_type'),
                "z_status": payload.get('z_status'),
                "z_price": payload.get('z_price'),
                "z_hot": payload.get('z_hot'),
                "z_duureg": payload.get('z_duureg'),
                "z_address": payload.get('z_address'),
                "z_rooms": payload.get('z_rooms', '0'),
                "z_bathroom": payload.get('z_bathroom', '0'),
                "z_balcony": payload.get('z_balcony', '0'),
                "z_m2": payload.get('z_m2', '0'),
                "z_floor": payload.get('z_floor', '0'),
                "z_hiits": payload.get('z_hiits'),
                "z_description": payload.get('z_description', ''),
                "images_base64": payload.get('images', [])
            }

        else:
            # 2. FormData (multipart/form-data) — хуучин арга
            action = request.POST.get('action')
            if action != "add_zar":
                return JsonResponse(sendResponse(request, 7001, {"error": "Invalid action"}, action))

            data = {
                "uid": request.POST.get('uid'),
                "z_title": request.POST.get('z_title'),
                "z_type": request.POST.get('z_type'),
                "z_status": request.POST.get('z_status'),
                "z_price": request.POST.get('z_price'),
                "z_hot": request.POST.get('z_hot'),
                "z_duureg": request.POST.get('z_duureg'),
                "z_address": request.POST.get('z_address'),
                "z_rooms": request.POST.get('z_rooms', '0'),
                "z_bathroom": request.POST.get('z_bathroom', '0'),
                "z_balcony": request.POST.get('z_balcony', '0'),
                "z_m2": request.POST.get('z_m2', '0'),
                "z_floor": request.POST.get('z_floor', '0'),
                "z_hiits": request.POST.get('z_hiits'),
                "z_description": request.POST.get('z_description', ''),
                "uploaded_files": request.FILES.getlist('images')
            }

        # Шаардлагатай талбаруудыг шалгах
        required_fields = ['uid', 'z_title', 'z_type', 'z_status', 'z_price', 'z_hot', 'z_duureg']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse(sendResponse(request, 7003, {"error": f"{field} шаардлагатай"}, action))

        # DB холболт
        myConn = connectDB()
        cursor = myConn.cursor()

        # Зар оруулах
        insert_query = """
            INSERT INTO t_zar (
                uid, z_title, z_type, z_status, z_price, z_hot, z_duureg,
                z_address, z_rooms, z_bathroom, z_balcony, z_m2, z_floor,
                z_hiits, z_description, z_isactive
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
            RETURNING zid;
        """
        cursor.execute(insert_query, (
            data['uid'], data['z_title'], data['z_type'], data['z_status'],
            data['z_price'], data['z_hot'], data['z_duureg'], data['z_address'],
            data['z_rooms'], data['z_bathroom'], data['z_balcony'], data['z_m2'],
            data['z_floor'], data['z_hiits'], data['z_description']
        ))
        new_zid = cursor.fetchone()[0]

        saved_urls = []
        os.makedirs(os.path.join(settings.MEDIA_ROOT, "zar_images"), exist_ok=True)

        # Зураг хадгалах
        if "uploaded_files" in data:
            for file in data["uploaded_files"]:
                ext = os.path.splitext(file.name)[1].lower() or ".jpg"
                filename = f"{uuid.uuid4()}{ext}"
                path = os.path.join(settings.MEDIA_ROOT, "zar_images", filename)

                with open(path, "wb+") as f:
                    for chunk in file.chunks():
                        f.write(chunk)

                url = f"/media/zar_images/{filename}"
                saved_urls.append(url)
                cursor.execute("INSERT INTO t_zar_zurag (zarid,zurag) VALUES (%s, %s)", (new_zid, url))

        elif "images_base64" in data:
            for b64 in data["images_base64"]:
                if not b64 or not b64.startswith("data:image"):
                    continue

                try:
                    header, b64data = b64.split(";base64,")
                    ext = header.split("/")[-1].split(";")[0]
                    if ext not in ["jpg", "jpeg", "png", "gif", "webp"]:
                        ext = "jpg"

                    img_data = base64.b64decode(b64data)
                    filename = f"{uuid.uuid4()}.{ext}"
                    path = os.path.join(settings.MEDIA_ROOT, "zar_images", filename)

                    with open(path, "wb") as f:
                        f.write(img_data)

                    url = f"/media/zar_images/{filename}"
                    saved_urls.append(url)
                    cursor.execute("INSERT INTO t_zar_zurag (zarid, zurag) VALUES (%s, %s)", (new_zid, url))

                except Exception as e:
                    print("Base64 decode error:", e)
                    continue

        myConn.commit()
        resp = sendResponse(request, 7007, [{"zid": new_zid, "images": saved_urls}], action)

    except Exception as e:
        if 'myConn' in locals():
            myConn.rollback()
        print("dt_addzar error:", str(e))
        resp = sendResponse(request, 7008, {"error": str(e)}, action or "add_zar")

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)

    return JsonResponse(resp)


def dt_delete_zar(request):
    jsons = json.loads(request.body)
    action = jsons.get("action")
    zar_id = jsons.get("zar_id")

    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        # Зургуудаа устгах
        cursor.execute("DELETE FROM t_zar_zurag WHERE zarid = %s;", (zar_id,))
        # Үндсэн зар устгах
        cursor.execute("DELETE FROM t_zar WHERE zid = %s RETURNING zid;", (zar_id,))
        deleted = cursor.fetchone()
        myConn.commit()

        if deleted:
            resp = sendResponse(request, 7011, [{"zid": deleted[0]}], action)
        else:
            resp = sendResponse(request, 9002, [{"error": "Зар олдсонгүй"}], action)

    except Exception as e:
        myConn.rollback()
        resp = sendResponse(request, 7012, [{"error": str(e)}], action)
    finally:
        cursor.close()
        disconnectDB(myConn)

    return JsonResponse(resp)

def dt_update_zar(request):
    """
    POST request-д ажиллана.
    Зарын мэдээллийг засна, зураг нэмэх боломжтой.
    """
    jsons = json.loads(request.body)
    action = jsons.get('action')

    try:
        myConn = connectDB()
        cursor = myConn.cursor()

        if action != "update_zar":
            return JsonResponse(sendResponse(request, 3001, [{"error": "Тодорхойгүй action"}], action))

        # UI-аас ирэх өгөгдөл
        zid = jsons.get("zid")  # засах зарын ID
        if not zid:
            return JsonResponse(sendResponse(request, 3000, [{"error": "zid хоосон байна"}], action))

        # Засах боломжтой талбарууд
        fields = [
            "z_title", "z_type", "z_status", "z_price", "z_hot", "z_duureg",
            "z_address", "z_rooms", "z_bathroom", "z_balcony", "z_m2",
            "z_floor", "z_hiits", "z_description"
        ]

        # SQL динамик үүсгэх
        set_parts = []
        values = []
        for field in fields:
            if field in jsons:
                set_parts.append(f"{field}=%s")
                values.append(jsons[field])

        if set_parts:
            sql = f"UPDATE t_zar SET {', '.join(set_parts)} WHERE zid=%s RETURNING zid;"
            values.append(zid)
            cursor.execute(sql, tuple(values))
            updated = cursor.fetchone()
            if not updated:
                myConn.rollback()
                return JsonResponse(sendResponse(request, 7010, [{"error": "Зар олдсонгүй"}], action))

                # Шинэ зураг нэмэх
        images = jsons.get("images", [])
        if images:
            for img_base64 in images:
                # Давхардлыг шалгах
                cursor.execute(
                    "SELECT 1 FROM t_zar_zurag WHERE zarid = %s AND zurag = %s;",
                    (zid, img_base64)
                )
                if cursor.fetchone() is None:
                    cursor.execute(
                        "INSERT INTO t_zar_zurag (zarid, zurag) VALUES (%s, %s);",
                        (zid, img_base64)
                    )

        # Хэрвээ зураг устгах хүсэлт ирсэн бол
        remove_images = jsons.get("remove_images", [])  # id массив
        if remove_images:
            for img_id in remove_images:
                cursor.execute(
                    "DELETE FROM t_zar_zurag WHERE zid=%s AND zarid=%s;",
                    (img_id, zid)
                )

        myConn.commit()
        resp = sendResponse(request, 7011, [{"zid": zid}], action)

    except Exception as e:
        myConn.rollback()
        resp = sendResponse(request, 7008, [{"error": str(e)}], action)

    finally:
        cursor.close()
        disconnectDB(myConn)

    return JsonResponse(resp)


# views.py дээр нэмнэ үү
def dt_search_zar(request):
    """
    Хайлт: Бүх талбараар хайна (хоосон байвал алгасна)
    Хуудаслалттай (page, per_page)
    """
    try:
        # Request body-г шалгах
        if request.content_type == "application/json":
            payload = json.loads(request.body)
        else:
            payload = request.POST

        action = payload.get("action")
        if action != "search_zar":
            return JsonResponse(sendResponse(request, 3001, {"error": "Invalid action"}, action))

        # Хайлтын параметрүүд (бүгд optional)
        status = payload.get("status")        # 1=Худалдаа, 2=Түрээс, 3=Урьдчилсан
        type_id = payload.get("type")         # t_turul.tid
        hot = payload.get("hot")              # t_hot.hid
        duureg = payload.get("duureg")        # t_duureg.did
        min_price = payload.get("min")
        max_price = payload.get("max")
        from_date = payload.get("from")       # огноо
        to_date = payload.get("to")

        # Хуудаслалт
        try:
            page = max(1, int(payload.get("page", 1)))  # Хуудасны хамгийн бага утга 1
            per_page = max(1, int(payload.get("per_page", 12)))  # Хуудасны хэмжээ хамгийн багадаа 1
        except ValueError:
            return JsonResponse(sendResponse(request, 3002, {"error": "Invalid pagination parameters"}, action))

        offset = (page - 1) * per_page

        myConn = connectDB()
        cursor = myConn.cursor()

        # Нийт тоо авах SQL
        count_sql = "SELECT COUNT(*) FROM t_zar WHERE z_isactive = TRUE"
        params = []
        if status:
            count_sql += " AND z_status = %s"
            params.append(status)
        if type_id:
            count_sql += " AND z_type = %s"
            params.append(type_id)
        if hot:
            count_sql += " AND z_hot = %s"
            params.append(hot)
        if duureg:
            count_sql += " AND z_duureg = %s"
            params.append(duureg)
        if min_price:
            count_sql += " AND z_price >= %s"
            params.append(min_price)
        if max_price:
            count_sql += " AND z_price <= %s"
            params.append(max_price)
        if from_date:
            count_sql += " AND z_createddate >= %s"
            params.append(from_date)
        if to_date:
            count_sql += " AND z_createddate <= %s"
            params.append(to_date)

        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]
        total_pages = (total + per_page - 1) // per_page

        # Үндсэн хайлт хийх SQL
        sql = """
            SELECT 
                zid, z_title, z_price, z_m2, z_rooms, z_address, z_createddate,
                (SELECT hname FROM t_hot WHERE hid = t_zar.z_hot) as city_name,
                (SELECT dname FROM t_duureg WHERE did = t_zar.z_duureg) as district_name,
                (SELECT zurag FROM t_zar_zurag WHERE zarid = t_zar.zid ORDER BY zid LIMIT 1) as cover
            FROM t_zar 
            WHERE z_isactive = TRUE
        """
        if status:
            sql += " AND z_status = %s"
        if type_id:
            sql += " AND z_type = %s"
        if hot:
            sql += " AND z_hot = %s"
        if duureg:
            sql += " AND z_duureg = %s"
        if min_price:
            sql += " AND z_price >= %s"
        if max_price:
            sql += " AND z_price <= %s"
        if from_date:
            sql += " AND z_createddate >= %s"
        if to_date:
            sql += " AND z_createddate <= %s"

        sql += " ORDER BY z_createddate DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])

        cursor.execute(sql, params)
        rows = cursor.fetchall()

        # Хайлтын үр дүнг боловсруулах
        result = []
        for r in rows:
            result.append({
                "zid": r[0],
                "title": r[1],
                "price": str(r[2]),
                "m2": r[3] or 0,
                "rooms": r[4] or 0,
                "address": r[5] or "",
                "created": r[6].strftime("%Y-%m-%d"),
                "city": r[7] or "",
                "district": r[8] or "",
                "cover": r[9] or "/media/default.jpg"
            })

        resp_data = {
            "items": result,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages
            }
        }

        return JsonResponse(sendResponse(request, 7014, resp_data, action))

    except Exception as e:
        import traceback
        return JsonResponse(sendResponse(request, 7013, {"error": str(e), "trace": traceback.format_exc()}, "search_zar"))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)
#login service
def dt_login(request):
    jsons = json.loads(request.body) # get request body
    action = jsons['action'] # get action key from jsons
    # print(action)
    
    # url: http://localhost:8000/user/
    # Method: POST
    # Body: raw JSON
    
    # request body:
    # {
    #     "action": "login",
    #     "uname": "ganzoo@mandakh.edu.mn",
    #     "upassword":"73y483h4bhu34buhrbq3uhbi3aefgiu"
    # }
    
    # response:
    # {
    #     "resultCode": 1002,
    #     "resultMessage": "Login Successful",
    #     "data": [
    #         {
    #             "uname": "ganzoo@mandakh.edu.mn",
    #             "fname": "Ganzo",
    #             "lname": "U",
    #             "lastlogin": "2024-11-06T15:57:52.996+08:00"
    #         }
    #     ],
    #     "size": 1,
    #     "action": "login",
    #     "curdate": "2024/11/06 07:58:10"
    # }
    try:
        uname = jsons['uname'].lower() # get uname key from jsons
        upassword = jsons['upassword'] 
        print(upassword)# get upassword key from jsons
    except: # uname, upassword key ali neg ni baihgui bol aldaanii medeelel butsaana
        action = jsons['action']
        respdata = []
        resp = sendResponse(request, 3006, respdata, action) # response beldej baina. 6 keytei.
        return resp
    
    try: 
        myConn = connectDB() # database holbolt uusgej baina
        cursor = myConn.cursor() # cursor uusgej baina
        
        # Hereglegchiin ner, password-r nevtreh erhtei (isverified=True) hereglegch login hiij baigaag toolj baina.
        query = F"""SELECT COUNT(*) AS usercount, MIN(fname) AS fname, MAX(lname) AS lname FROM t_user 
                WHERE uname = '{uname}' 
                AND isverified = True 
                AND upassword = '{upassword}' 
                AND isbanned = False """ 
        #print(query)
        cursor.execute(query) # executing query
        columns = cursor.description #
        respRow = [{columns[index][0]:column for index, 
            column in enumerate(value)} for value in cursor.fetchall()] # respRow is list and elements are dictionary. dictionary structure is columnName : value
        print(respRow)
        cursor.close() # close the cursor. ALWAYS

        if respRow[0]['usercount'] == 1: # verified user oldson uyd login hiine
            cursor1 = myConn.cursor() # creating cursor1
            query = F"""UPDATE t_user 
                    SET lastlogin = NOW()
                    WHERE uname = '{uname}' AND isverified = True AND upassword = '{upassword}'"""
            
            # get logged user information
            query = F"""SELECT uid, uname, fname, lname, lastlogin,userrole
                    FROM t_user 
                    WHERE uname = '{uname}' AND isverified = True AND upassword = '{upassword}'"""
            
            cursor1.execute(query) # executing cursor1
            columns = cursor1.description # 
            # print(columns, "tuples")
            respRow = [{columns[index][0]:column for index, 
                column in enumerate(value)} for value in cursor1.fetchall()] # respRow is list. elements are dictionary. dictionary structure is columnName : value
            # print(respRow)
            
            uid = respRow[0]['uid'] #
            uname = respRow[0]['uname'] # 
            fname = respRow[0]['fname'] #
            lname = respRow[0]['lname'] #
            lastlogin = respRow[0]['lastlogin'] #
            userrole = respRow[0]['userrole'] #

            respdata = [{'uid': uid,'uname':uname, 'fname':fname, 'lname':lname, 'lastlogin':lastlogin,'userrole':userrole}] # creating response logged user information
            resp = sendResponse(request, 1002, respdata, action) # response beldej baina. 6 keytei.

            
            cursor1.execute(query) # executing query cursor1
            myConn.commit() # save update query database
            cursor1.close() # closing cursor1
            
        else: # if user name or password wrong 
            data = [{'uname':uname}] # he/she wrong username, password. just return username
            resp = sendResponse(request, 1004, data, action) # response beldej baina. 6 keytei.
    except:
        # login service deer aldaa garval ajillana. 
        action = jsons["action"]
        respdata = [] # hooson data bustaana.
        resp = sendResponse(request, 5001, respdata, action) # standartiin daguu 6 key-tei response butsaana
        
    finally:
        disconnectDB(myConn) # yamarch uyd database holbolt uussen bol holboltiig salgana. Uchir ni finally dotor baigaa
        return resp # response bustaaj baina
#dt_login



def dt_register(request):
    try:
        jsons = json.loads(request.body)
        action = jsons.get("action", "")
        uname = jsons["uname"].lower()
        lname = jsons["lname"].capitalize()
        fname = jsons["fname"].capitalize()
        upassword = jsons["upassword"]
    except KeyError:
        respdata = []
        return sendResponse(request, 3007, respdata, jsons.get("action", ""))

    conn = None
    try:
        conn = connectDB()
        cursor = conn.cursor()
        
        # Verify if user already exists
        query = f"SELECT COUNT(*) AS usercount FROM t_user WHERE uname = '{uname}' AND isverified = True"
        cursor.execute(query)
        columns = [col[0] for col in cursor.description]
        respRow = [{columns[i]: v for i, v in enumerate(row)} for row in cursor.fetchall()]
        cursor.close()

        if respRow[0]["usercount"] == 0:
            # Insert new user
            cursor = conn.cursor()
            query = f"""INSERT INTO t_user(uname, lname, fname, upassword, isverified, isbanned, createddate, lastlogin, userrole) 
                        VALUES('{uname}','{lname}','{fname}', '{upassword}', False, False, NOW(), '1970-01-01', 2) 
                        RETURNING uid"""
            cursor.execute(query)
            uid = cursor.fetchone()[0]
            conn.commit()
            cursor.close()

            # Generate token and save
            token = generateStr(20)
            cursor = conn.cursor()
            query = f"""INSERT INTO t_token(uid, token, tokentype, tokenenddate, createddate) 
                        VALUES({uid}, '{token}', 'register', NOW() + interval '1 day', NOW())"""
            cursor.execute(query)
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

            respdata = [{"uname": uname, "lname": lname, "fname": fname, "uid": uid}]
            return sendResponse(request, 200, respdata, action)

        else:
            respdata = [{"uname": uname, "fname": fname}]
            return sendResponse(request, 3008, respdata, action)

    except Exception as e:
        respdata = [{"aldaa": str(e)}]
        return sendResponse(request, 5002, respdata, action)
    
    finally:
        if conn:
            disconnectDB(conn)

# dt_register

# Nuuts ugee martsan bol duudah service
def dt_forgot(request):
    jsons = json.loads(request.body) # get request body
    action = jsons['action'] # get action key from jsons
    # print(action)
    resp = {}
    
    # url: http://localhost:8000/user/
    # Method: POST
    # Body: raw JSON
    
    # request body:
    # {
    #     "action": "forgot",
    #     "uname": "ganzoo@mandakh.edu.mn"
    # }
    
    # response: 
    # {
    #     "resultCode": 3012,
    #     "resultMessage": "Forgot password huselt ilgeelee",
    #     "data": [
    #         {
    #             "uname": "ganzoo@mandakh.edu.mn"
    #         }
    #     ],
    #     "size": 1,
    #     "action": "forgot",
    #     "curdate": "2024/11/06 08:00:32"
    # }
    try:
        uname = jsons['uname'].lower() # get uname key from jsons
    except: # uname key ali neg ni baihgui bol aldaanii medeelel butsaana
        action = jsons['action']
        respdata = []
        resp = sendResponse(request, 3016, respdata, action) # response beldej baina. 6 keytei.
        return resp
    
    try: 
        myConn = connectDB() # database holbolt uusgej baina
        cursor = myConn.cursor() # cursor uusgej baina
        # hereglegch burtgeltei esehiig shalgaj baina. Burtgelgui, verified hiigeegui hereglegch bol forgot password ajillahgui.
        query = f"""SELECT COUNT(*) AS usercount, MIN(uname) AS uname , MIN(uid) AS uid
                    FROM t_user
                    WHERE uname = '{uname}' AND isverified = True"""
        cursor.execute(query) # executing query
        cursor.description
        columns = cursor.description #
        respRow = [{columns[index][0]:column for index, 
            column in enumerate(value)} for value in cursor.fetchall()] # respRow is list and elements are dictionary. dictionary structure is columnName : value
        # print(respRow)
        
        
        if respRow[0]['usercount'] == 1: # verified hereglegch oldson bol nuuts ugiig sergeehiig zuvshuurnu. 
            uid = respRow[0]['uid']
            uname = respRow[0]['uname']
            token = generateStr(25) # forgot password-iin token uusgej baina. 25 urttai
            query = F"""INSERT INTO t_token(uid, token, tokentype, tokenenddate, createddate) 
            VALUES({uid}, '{token}', 'forgot', NOW() + interval \'1 day\', NOW() )""" # Inserting forgot token in t_token
            cursor.execute(query) # executing query
            myConn.commit() # saving DB
            
            # forgot password verify hiih mail
            # subject = "Nuuts ug shinechleh"
            # body = f"<a href='http://localhost:8080/verified?token={token}'>Martsan nuuts ugee shinechleh link</a>"
            # sendMail(uname, subject, body)
            
            
            # sending Response
            action = jsons['action']
            respdata = [{"uname":uname}]
            resp = sendResponse(request,3012,respdata,action )
            
        else: # verified user not found 
            action = jsons['action']
            respdata = [{"uname":uname}]
            resp = sendResponse(request,3013,respdata,action )
            
    except Exception as e: # forgot service deer dotood aldaa garsan bol ajillana.
        # forgot service deer aldaa garval ajillana. 
        action = jsons["action"]
        respdata = [{"error":str(e)}] # hooson data bustaana.
        resp = sendResponse(request, 5003, respdata, action) # standartiin daguu 6 key-tei response butsaana
    finally:
        cursor.close() # close the cursor. ALWAYS
        disconnectDB(myConn) # yamarch uyd database holbolt uussen bol holboltiig salgana. Uchir ni finally dotor baigaa
        return resp # response bustaaj baina
# dt_forgot

# Nuuts ugee martsan uyd resetpassword service-r nuuts ugee shinechilne
def dt_resetpassword(request):
    jsons = json.loads(request.body) # get request body
    action = jsons['action'] # get action key from jsons
    # print(action)
    resp = {}
    
    # url: http://localhost:8000/user/
    # Method: POST
    # Body: raw JSON
    
    # request body:
    #  {
    #     "action": "resetpassword",
    #     "token":"145v2n080t0lqh3i1dvpt3tgkrmn3kygqf5sqwnw",
    #     "newpass":"MandakhSchool"
    # }
    
    # response:
    # {
    #     "resultCode": 3019,
    #     "resultMessage": "martsan nuuts ugiig shinchille",
    #     "data": [
    #         {
    #             "uname": "ganzoo@mandakh.edu.mn"
    #         }
    #     ],
    #     "size": 1,
    #     "action": "resetpassword",
    #     "curdate": "2024/11/06 08:03:25"
    # }
    try:
        newpass = jsons['newpass'] # get newpass key from jsons
        token = jsons['token'] # get token key from jsons
    except: # newpass, token key ali neg ni baihgui bol aldaanii medeelel butsaana
        action = jsons['action']
        respdata = []
        resp = sendResponse(request, 3018, respdata, action) # response beldej baina. 6 keytei.
        return resp
    
    try: 
        myConn = connectDB() # database holbolt uusgej baina
        cursor = myConn.cursor() # cursor uusgej baina
        
        # Tuhain token deer burtgeltei batalgaajsan hereglegch baigaa esehiig shalgana. Neg l hereglegch songogdono esvel songogdohgui. Token buruu, hugatsaa duussan bol resetpassword service ajillahgui.
        query = f"""SELECT COUNT (t_user.uid) AS usercount
                , MIN(uname) AS uname
                , MAX(t_user.uid) AS uid
                , MAX(t_token.tokenid) AS tokenid
                FROM t_user INNER JOIN t_token
                ON t_user.uid = t_token.uid
                WHERE t_token.token = '{token}'
                AND t_user.isverified = True
                AND t_token.tokenenddate > NOW()"""
        cursor.execute(query) # executing query
        columns = cursor.description #
        respRow = [{columns[index][0]:column for index, 
            column in enumerate(value)} for value in cursor.fetchall()] # respRow is list and elements are dictionary. dictionary structure is columnName : value
        # print(respRow)
        if respRow[0]['usercount'] == 1: # token idevhtei, verified hereglegch oldson bol nuuts ugiig shinechlehiig zuvshuurnu.
            uid = respRow[0]['uid']
            uname = respRow[0]['uname']
            tokenid = respRow[0] ['tokenid'] 
            token = generateStr(40) # shine ajilladaggui token uusgej baina. 40 urttai. 
            query = F"""UPDATE t_user SET upassword = '{newpass}'
                        WHERE t_user.uid = {uid}""" # Updating user's new password in t_user
            cursor.execute(query) # executing query
            myConn.commit() # saving DB
            
            query = F"""UPDATE t_token 
                SET token = '{token}'
                , tokenenddate = '1970-01-01' 
                WHERE tokenid = {tokenid}""" # Updating token and tokenenddate in t_token. Token-iig idevhgui bolgoj baina
            cursor.execute(query) # executing query
            myConn.commit() # saving DB             
            
            # sending Response
            action = jsons['action']
            respdata = [{"uname":uname}]
            resp = sendResponse(request,3019,respdata,action )
            
        else: # token not found 
            action = jsons['action']
            respdata = []
            resp = sendResponse(request,3020,respdata,action )
            
    except Exception as e: # reset password service deer dotood aldaa garsan bol ajillana.
        # reset service deer aldaa garval ajillana. 
        action = jsons["action"]
        respdata = [{"error":str(e)}] # aldaanii medeelel bustaana.
        resp = sendResponse(request, 5005, respdata, action) # standartiin daguu 6 key-tei response butsaana
    finally:
        cursor.close() # close the cursor. ALWAYS
        disconnectDB(myConn) # yamarch uyd database holbolt uussen bol holboltiig salgana. Uchir ni finally dotor baigaa
        return resp # response bustaaj baina
#dt_resetpassword

# Huuchin nuuts ugee ashiglan Shine nuuts ugeer shinechleh service
def dt_changepassword(request):
    jsons = json.loads(request.body) # get request body
    action = jsons['action'] # get action key from jsons
    # print(action)
    resp = {}
    
    # url: http://localhost:8000/user/
    # Method: POST
    # Body: raw JSON
    
    # request body:
    # {
    #     "action": "changepassword",
    #     "uname": "ganzoo@mandakh.edu.mn",
    #     "oldpass":"a1b2c3d4",
    #     "newpass":"a1b2"
    # }
    
    # response: 
    # {
    #     "resultCode": 3022,
    #     "resultMessage": "nuuts ug amjilttai soligdloo ",
    #     "data": [
    #         {
    #             "uname": "ganzoo@mandakh.edu.mn",
    #             "lname": "U",
    #             "fname": "Ganzo"
    #         }
    #     ],
    #     "size": 1,
    #     "action": "changepassword",
    #     "curdate": "2024/11/06 08:04:18"
    # }
    try:
        uname = jsons['uname'].lower() # get uname key from jsons
        newpass = jsons['newpass'] # get newpass key from jsons
        oldpass = jsons['oldpass'] # get oldpass key from jsons
    except: # uname, newpass, oldpass key ali neg ni baihgui bol aldaanii medeelel butsaana
        action = jsons['action']
        respdata = []
        resp = sendResponse(request, 3021, respdata, action) # response beldej baina. 6 keytei.
        return resp
    
    try: 
        myConn = connectDB() # database holbolt uusgej baina
        cursor = myConn.cursor() # cursor uusgej baina
        # burtgeltei batalgaajsan hereglegchiin nuuts ug zuv esehiig shalgaj baina. Burtgelgui, verified hiigeegui, huuchin nuuts ug taarahgui hereglegch bol change password ajillahgui.
        query = f"""SELECT COUNT(uid) AS usercount ,MAX(uid) AS uid
                    ,MIN(uname) AS uname
                    ,MIN (lname) AS lname
                    ,MAX (fname) AS fname
                    FROM t_user
                    WHERE uname='{uname}'  
                    AND isverified=true
                    AND upassword='{oldpass}'"""
        cursor.execute(query) # executing query
        columns = cursor.description #
        respRow = [{columns[index][0]:column for index, 
            column in enumerate(value)} for value in cursor.fetchall()] # respRow is list and elements are dictionary. dictionary structure is columnName : value
        # print(respRow)
        if respRow[0]['usercount'] == 1: # Burtgeltei, batalgaajsan, huuchin nuuts ug taarsan hereglegch oldson bol nuuts ugiig shineer solihiig zuvshuurnu.
            uid = respRow[0]['uid']
            uname = respRow[0]['uname']
            lname = respRow[0]['lname']
            fname = respRow[0]['fname']
            
            query = F"""UPDATE t_user SET upassword='{newpass}'
                        WHERE uid={uid}""" # Updating user's new password using uid in t_user
            cursor.execute(query) # executing query
            myConn.commit() # saving DB
            
            # sending Response
            action = jsons['action']
            respdata = [{"uname":uname, "lname": lname, "fname":fname}]
            resp = sendResponse(request, 3022, respdata, action )
            
        else: # old password not match
            action = jsons['action']
            respdata = [{"uname":uname}]
            resp = sendResponse(request, 3023, respdata, action )
            
    except Exception as e: # change password service deer dotood aldaa garsan bol ajillana.
        # change service deer aldaa garval ajillana. 
        action = jsons["action"]
        respdata = [{"error":str(e)}] # hooson data bustaana.
        resp = sendResponse(request, 5006, respdata, action) # standartiin daguu 6 key-tei response butsaana
    finally:
        cursor.close() # close the cursor. ALWAYS
        disconnectDB(myConn) # yamarch uyd database holbolt uussen bol holboltiig salgana. Uchir ni finally dotor baigaa
        return resp # response bustaaj baina
# dt_changepassword

@csrf_exempt # method POST uyd ajilluulah csrf
def checkService(request): # hamgiin ehend duudagdah request shalgah service
    if request.method == "POST": # Method ni POST esehiig shalgaj baina
        try:
            # request body-g dictionary bolgon avch baina
            jsons = json.loads(request.body)
        except:
            # request body json bish bol aldaanii medeelel butsaana. 
            action = "no action"
            respdata = [] # hooson data bustaana.
            resp = sendResponse(request, 3003, respdata) # standartiin daguu 6 key-tei response butsaana
            return JsonResponse(resp) # response bustaaj baina
            
        try: 
            #jsons-s action-g salgaj avch baina
            action = jsons["action"]
        except:
            # request body-d action key baihgui bol aldaanii medeelel butsaana. 
            action = "no action"
            respdata = [] # hooson data bustaana.
            resp = sendResponse(request, 3005, respdata,action) # standartiin daguu 6 key-tei response butsaana
            return JsonResponse(resp)# response bustaaj baina
        
        # request-n action ni gettime
        if action == "getturul":
            return dt_getturul(request)
        elif action == "getzar":
            return dt_getzar(request)
            return JsonResponse(result)
        elif action == "getzarbyid":
            return dt_getzarbyid(request)
            return JsonResponse(result)
        elif action == "update_zar":
            return dt_update_zar(request)
            return JsonResponse(result)          
        elif action == "delete_zar":
            return dt_delete_zar(request)
            return JsonResponse(result)
        elif action == "search_zar":
            return dt_search_zar(request)
            return JsonResponse(result)

        elif action == "add_zar":
            return dt_addzar(request)
            return JsonResponse(result)
        # request-n action ni login bol ajillana    
        elif action == "login":
            result = dt_login(request)
            return JsonResponse(result)
        # request-n action ni register bol ajillana
        elif action == "register":
            result = dt_register(request)
            return JsonResponse(result)
        # request-n action ni forgot bol ajillana
        elif action == "forgot":
            result = dt_forgot(request)
            return JsonResponse(result)
        #requestiin action resetpassword-r ajillna
        elif action == "resetpassword":
            result = dt_resetpassword(request)
            return JsonResponse(result)
        #requestiin action changepassword-r ajillna
        elif action == "changepassword":
            result = dt_changepassword(request)
            return JsonResponse(result)
        # request-n action ni burtgegdeegui action bol else ajillana.
        else:
            action = "no action"
            respdata = []
            resp = sendResponse(request, 3001, respdata, action)
            return JsonResponse(resp)
    
    # Method ni GET esehiig shalgaj baina. register service, forgot password service deer mail yavuulna. Ene uyd link deer darahad GET method-r url duudagdana.
    elif request.method == "GET":
        # url: http://localhost:8000/users?token=erjhfbuegrshjwiefnqier
        # Method: GET
        # Body: NONE
        
        # request body: NONE
        
        # response:
        # {
        #     "resultCode": 3011,
        #     "resultMessage": "Forgot password verified",
        #     "data": [
        #         {
        #             "uid": 33,
        #             "uname": "ganzoo@mandakh.edu.mn",
        #             "tokentype": "forgot",
        #             "createddate": "2024-10-16T11:21:57.455+08:00"
        #         }
        #     ],
        #     "size": 1,
        #     "action": "forgot user verify",
        #     "curdate": "2024/11/06 08:06:25"
        # }
        
        token = request.GET.get('token') # token parameteriin utgiig avch baina.
        
        if (token is None):
            action = "no action" 
            respdata = []  # response-n data-g beldej baina. list turultei baih
            resp = sendResponse(request, 3015, respdata, action)
            return JsonResponse(resp)
            # response beldej baina. 6 keytei.
            
            
        try: 
            conn = connectDB() # database holbolt uusgej baina
            cursor = conn.cursor() # cursor uusgej baina
            
            # gadnaas orj irsen token-r mur songoj toolj baina. Tuhain token ni idevhtei baigaag mun shalgaj baina.
            query = F"""
                    SELECT COUNT(*) AS tokencount
                        , MIN(tokenid) AS tokenid
                        , MAX(uid) AS uid
                        , MIN(token) token
                        , MAX(tokentype) tokentype
                    FROM t_token 
                    WHERE token = '{token}' 
                            AND tokenenddate > NOW()"""
            # print (query)
            cursor.execute(query) # executing query
            # print(cursor.description)
            columns = cursor.description #
            respRow = [{columns[index][0]:column for index, 
                column in enumerate(value)} for value in cursor.fetchall()] # respRow is list and elements are dictionary. dictionary structure is columnName : value
            # print(respRow)
            uid = respRow[0]["uid"]
            tokentype = respRow[0]["tokentype"]
            tokenid = respRow[0]["tokenid"]
            
            if respRow[0]["tokencount"] == 1: # Hervee hargalzah token oldson baival ajillana.
                #tokentype ni 3 turultei. (register, forgot, login) 
                # End register, forgot hoyriig shagaj uzehed hangalttai. Uchir ni login type ni GET method-r hezee ch orj irehgui.
                if tokentype == "register": # Hervee tokentype ni register bol ajillana.
                    query = f"""SELECT uname, lname, fname, createddate 
                            FROM t_user
                            WHERE uid = {uid}""" # Tuhain neg hunii medeelliig avch baina.
                    cursor.execute(query) # executing query
                    
                    columns = cursor.description #
                    respRow = [{columns[index][0]:column for index, 
                        column in enumerate(value)} for value in cursor.fetchall()]
                    uname = respRow[0]['uname']
                    lname = respRow[0]['lname']
                    fname = respRow[0]['fname']
                    createddate = respRow[0]['createddate']
                    
                    # Umnu uname-r verified bolson hereglegch baival tuhain uname-r dahin verified bolgoj bolohgui. Iimees umnu verified hereglegch oldoh yosgui. 
                    query  = f"""SELECT COUNT(*) AS verifiedusercount 
                                , MIN(uname) AS uname
                            FROM t_user 
                            WHERE uname = '{uname}' AND isverified = True"""
                    cursor.execute(query) # executing query
                    columns = cursor.description #
                    respRow = [{columns[index][0]:column for index, 
                        column in enumerate(value)} for value in cursor.fetchall()]
                    
                    if respRow[0]['verifiedusercount'] == 0:
                        
                        # verified user oldoogui tul hereglegchiin verified bolgono.
                        query = f"UPDATE t_user SET isverified = true WHERE uid = {uid}"
                        cursor.execute(query) # executing query
                        conn.commit() # saving database
                        
                        token = generateStr(30) # huuchin token-oo uurchluh token uusgej baina
                        # huuchin token-g idevhgui bolgoj baina.
                        query = f"""UPDATE t_token SET token = '{token}', 
                                    tokenenddate = '1970-01-01' WHERE tokenid = {tokenid}"""
                        cursor.execute(query) # executing query
                        conn.commit() # saving database
                        
                        # token verified service-n response
                        action = "userverified"
                        respdata = [{"uid":uid,"uname":uname, "lname":lname,
                                    "fname":fname,"tokentype":tokentype
                                    , "createddate":createddate}]
                        resp = sendResponse(request, 3010, respdata, action) # response beldej baina. 6 keytei.
                    else: # user verified already. User verify his or her mail verifying again. send Response. No change in Database.
                        action = "user verified already"
                        respdata = [{"uname":uname,"tokentype":tokentype}]
                        resp = sendResponse(request, 3014, respdata, action) # response beldej baina. 6 keytei.
                elif tokentype == "forgot": # Hervee tokentype ni forgot password bol ajillana.
                    
                    query = f"""SELECT uname, lname, fname, createddate FROM t_user
                            WHERE uid = {uid} AND isverified = True""" # Tuhain neg hunii medeelliig avch baina.
                    cursor.execute(query) # executing query
                    columns = cursor.description #
                    respRow = [{columns[index][0]:column for index, 
                        column in enumerate(value)} for value in cursor.fetchall()]
                    
                    uname = respRow[0]['uname']
                    lname = respRow[0]['lname']
                    fname = respRow[0]['fname']
                    createddate = respRow[0]['createddate']
                    
                    # forgot password check token response
                    action = "forgot user verify"
                    respdata = [{"uid":uid,"uname":uname,  "tokentype":tokentype
                                , "createddate":createddate}]
                    resp = sendResponse(request, 3011, respdata, action) # response beldej baina. 6 keytei.
                else:
                    # token-ii turul ni forgot, register ali ali ni bish bol buruu duudagdsan gej uzne.
                    # login-ii token GET-r duudagdahgui. 
                    action = "no action"
                    respdata = []
                    resp = sendResponse(request, 3017, respdata, action) # response beldej baina. 6 keytei.
                
            else: # Hervee hargalzah token oldoogui bol ajillana.
                # token buruu esvel hugatsaa duussan . Send Response
                action = "notoken" 
                respdata = []
                resp = sendResponse(request, 3009, respdata, action) # response beldej baina. 6 keytei.
                
        except:
            # GET method dotood aldaa
            action = "no action" 
            respdata = []  # response-n data-g beldej baina. list turultei baih
            resp = sendResponse(request, 5004, respdata, action)
            # response beldej baina. 6 keytei.
        finally:
            cursor.close()
            disconnectDB(conn)
            return JsonResponse(resp)
    
    # Method ni POST, GET ali ali ni bish bol ajillana
    else:
        #GET, POST-s busad uyd ajillana
        action = "no action"
        respdata = []
        resp = sendResponse(request, 3002, respdata, action)
        return JsonResponse(resp)