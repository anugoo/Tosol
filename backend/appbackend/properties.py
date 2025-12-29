"""
Property (Zar) related views and functions
"""
import json
from django.http import JsonResponse
from django.conf import settings
from backend.settings import sendResponse, disconnectDB, connectDB
import os
import base64
import uuid


def dt_getturul(request):
    """Get property types, statuses, cities, districts, and construction types"""
    try:
        jsons = json.loads(request.body)
        action = jsons.get('action')
    except json.JSONDecodeError:
        return JsonResponse(sendResponse(request, 6004, [{"error": "Invalid JSON"}], None))

    myConn = connectDB()
    try:
        with myConn.cursor() as cursor:
            cursor.execute("SELECT * FROM t_turul")
            columns = [col[0] for col in cursor.description]
            turul = [dict(zip(columns, row)) for row in cursor.fetchall()]

            cursor.execute("SELECT * FROM t_tuluv")
            columns = [col[0] for col in cursor.description]
            tuluv = [dict(zip(columns, row)) for row in cursor.fetchall()]

            cursor.execute("SELECT * FROM t_hot")
            columns = [col[0] for col in cursor.description]
            hot = [dict(zip(columns, row)) for row in cursor.fetchall()]

            cursor.execute("SELECT * FROM t_duureg")
            columns = [col[0] for col in cursor.description]
            duureg = [dict(zip(columns, row)) for row in cursor.fetchall()]

            cursor.execute("SELECT * FROM t_hiits")
            columns = [col[0] for col in cursor.description]
            hiits = [dict(zip(columns, row)) for row in cursor.fetchall()]

        respRow = {"turul": turul, "tuluv": tuluv, "hot": hot, "duureg": duureg, "hiits": hiits}
        resp = sendResponse(request, 6003, respRow, action)

    except Exception as e:
        import traceback
        respdata = [{"error": str(e), "trace": traceback.format_exc()}]
        resp = sendResponse(request, 6004, respdata, action)
    finally:
        disconnectDB(myConn)

    return JsonResponse(resp)


def dt_getzar(request):
    """Get all active properties with pagination"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    page = int(jsons.get('page', 1))
    limit = int(jsons.get('limit', 9))
    offset = (page - 1) * limit

    try:
        myConn = connectDB()
        cursor = myConn.cursor()

        query = """
        SELECT 
            z.zid,
            z.uid,
            u.uname AS user_email,
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
        LEFT JOIN t_user u ON z.uid = u.uid
        WHERE z.z_isactive = TRUE
        GROUP BY 
            z.zid, z.uid, u.uname, z.z_title, t.tname, tu.tname, z.z_price,
            h.hname, d.dname, z.z_address, z.z_rooms, z.z_bathroom, z.z_balcony,
            z.z_m2, z.z_floor, hi.h_name, z.z_description, z.z_isactive
        ORDER BY z.zid DESC
        LIMIT %s OFFSET %s;
        """

        cursor.execute(query, (limit, offset))
        columns = [col[0] for col in cursor.description]
        zar_list = []

        for row in cursor.fetchall():
            zar_dict = dict(zip(columns, row))
            images = zar_dict.get('images', '[]')
            try:
                zar_dict['images'] = json.loads(images) if isinstance(images, str) else (images if images else [])
            except (json.JSONDecodeError, TypeError):
                zar_dict['images'] = []
            zar_list.append(zar_dict)

        resp = sendResponse(request, 7005, zar_list, action)

    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        respdata = [{"error": str(e), "detail": error_detail}]
        resp = sendResponse(request, 7006, respdata, action)
    finally:
        if 'cursor' in locals():
            try:
                cursor.close()
            except:
                pass
        if 'myConn' in locals():
            try:
                disconnectDB(myConn)
            except:
                pass

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
            u.phone AS user_phone,
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
            u.phone,
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


def dt_get_my_ads(request):
    """Get all ads posted by a specific user"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    uid = jsons.get('uid')

    if not uid:
        return JsonResponse(sendResponse(request, 7006, [{"error": "uid хоосон байна"}], action))

    try:
        myConn = connectDB()
        cursor = myConn.cursor()

        query = """
        SELECT 
            z.zid,
            z.uid,
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
            z.z_createddate,
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
        WHERE z.uid = %s
        GROUP BY 
            z.zid, z.uid, z.z_title, t.tname, tu.tname, z.z_price,
            h.hname, d.dname, z.z_address, z.z_rooms, z.z_bathroom, z.z_balcony,
            z.z_m2, z.z_floor, hi.h_name, z.z_description, z.z_isactive, z.z_createddate
        ORDER BY z.z_createddate DESC;
        """

        cursor.execute(query, (uid,))
        columns = [col[0] for col in cursor.description]
        zar_list = []

        for row in cursor.fetchall():
            zar_dict = dict(zip(columns, row))
            images = zar_dict.get('images', '[]')
            try:
                zar_dict['images'] = json.loads(images) if isinstance(images, str) else (images if images else [])
            except (json.JSONDecodeError, TypeError):
                zar_dict['images'] = []
            zar_list.append(zar_dict)

        resp = sendResponse(request, 7005, zar_list, action)

    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 7006, respdata, action)
    finally:
        cursor.close()
        disconnectDB(myConn)

    return JsonResponse(resp)


def dt_addzar(request):
    """Add new property - requires authentication"""
    action = None
    data = {}

    try:
        if request.META.get('CONTENT_TYPE', '').startswith('application/json'):
            try:
                payload = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse(sendResponse(request, 7002, {"error": "Invalid JSON"}, "add_zar"))

            action = payload.get('action')
            if action != "add_zar":
                return JsonResponse(sendResponse(request, 7001, {"error": "Invalid action"}, action))

            uid = payload.get('uid')
            if not uid:
                return JsonResponse(sendResponse(request, 3000, [{"error": "uid хоосон байна. Нэвтэрнэ үү"}], action))

            data = {
                "uid": uid,
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

        required_fields = ['uid', 'z_title', 'z_type', 'z_status', 'z_price', 'z_hot', 'z_duureg']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse(sendResponse(request, 7003, {"error": f"{field} шаардлагатай"}, action))

        myConn = connectDB()
        cursor = myConn.cursor()

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


def dt_update_zar(request):
    """Update property - only owner can update"""
    jsons = json.loads(request.body)
    action = jsons.get('action')

    try:
        myConn = connectDB()
        cursor = myConn.cursor()

        if action != "update_zar":
            return JsonResponse(sendResponse(request, 3001, [{"error": "Тодорхойгүй action"}], action))

        zid = jsons.get("zid")
        uid = jsons.get("uid")  # Current user ID

        if not zid:
            return JsonResponse(sendResponse(request, 3000, [{"error": "zid хоосон байна"}], action))
        
        if not uid:
            return JsonResponse(sendResponse(request, 3000, [{"error": "uid хоосон байна. Нэвтэрнэ үү"}], action))

        # Verify ownership
        cursor.execute("SELECT uid FROM t_zar WHERE zid = %s", (zid,))
        result = cursor.fetchone()
        if not result:
            return JsonResponse(sendResponse(request, 7010, [{"error": "Зар олдсонгүй"}], action))
        
        # Ensure uid is compared correctly (handle both int and string)
        owner_uid = result[0]
        if str(owner_uid) != str(uid):
            return JsonResponse(sendResponse(request, 7009, [{"error": "Та энэ зарыг засах эрхгүй"}], action))

        fields = [
            "z_title", "z_type", "z_status", "z_price", "z_hot", "z_duureg",
            "z_address", "z_rooms", "z_bathroom", "z_balcony", "z_m2",
            "z_floor", "z_hiits", "z_description"
        ]

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

        images = jsons.get("images", [])
        if images:
            for img_base64 in images:
                cursor.execute(
                    "SELECT 1 FROM t_zar_zurag WHERE zarid = %s AND zurag = %s;",
                    (zid, img_base64)
                )
                if cursor.fetchone() is None:
                    cursor.execute(
                        "INSERT INTO t_zar_zurag (zarid, zurag) VALUES (%s, %s);",
                        (zid, img_base64)
                    )

        remove_images = jsons.get("remove_images", [])
        if remove_images:
            for img_id in remove_images:
                cursor.execute(
                    "DELETE FROM t_zar_zurag WHERE zid=%s AND zarid=%s;",
                    (img_id, zid)
                )

        myConn.commit()
        resp = sendResponse(request, 7011, [{"zid": zid}], action)

    except Exception as e:
        if 'myConn' in locals():
            myConn.rollback()
        resp = sendResponse(request, 7008, [{"error": str(e)}], action)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)

    return JsonResponse(resp)


def dt_delete_zar(request):
    """Delete property - only owner can delete"""
    jsons = json.loads(request.body)
    action = jsons.get("action")
    zar_id = jsons.get("zar_id")
    uid = jsons.get("uid")  # Current user ID

    try:
        myConn = connectDB()
        cursor = myConn.cursor()
        
        if not uid:
            return JsonResponse(sendResponse(request, 3000, [{"error": "uid хоосон байна. Нэвтэрнэ үү"}], action))
        
        # Verify ownership
        cursor.execute("SELECT uid FROM t_zar WHERE zid = %s", (zar_id,))
        result = cursor.fetchone()
        if not result:
            return JsonResponse(sendResponse(request, 9002, [{"error": "Зар олдсонгүй"}], action))
        
        # Ensure uid is compared correctly
        owner_uid = result[0]
        if str(owner_uid) != str(uid):
            return JsonResponse(sendResponse(request, 7009, [{"error": "Та энэ зарыг устгах эрхгүй"}], action))

        cursor.execute("DELETE FROM t_zar_zurag WHERE zarid = %s;", (zar_id,))
        cursor.execute("DELETE FROM t_zar WHERE zid = %s RETURNING zid;", (zar_id,))
        deleted = cursor.fetchone()
        myConn.commit()

        if deleted:
            resp = sendResponse(request, 7011, [{"zid": deleted[0]}], action)
        else:
            resp = sendResponse(request, 9002, [{"error": "Зар олдсонгүй"}], action)

    except Exception as e:
        if 'myConn' in locals():
            myConn.rollback()
        resp = sendResponse(request, 7012, [{"error": str(e)}], action)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'myConn' in locals():
            disconnectDB(myConn)

    return JsonResponse(resp)



def dt_search_zar(request):
    """Search properties with all filters, including title, with pagination"""
    try:
        # JSON payload авах
        if request.content_type == "application/json":
            payload = json.loads(request.body)
        else:
            payload = request.POST

        action = payload.get("action")
        if action != "search_zar":
            return JsonResponse(sendResponse(request, 3001, {"error": "Invalid action"}, action))

        # 🔹 Filter-үүд авах
        status = payload.get("status")
        type_id = payload.get("type")
        hot = payload.get("hot")
        duureg = payload.get("duureg")
        min_price = payload.get("min")
        max_price = payload.get("max")
        from_date = payload.get("from")
        to_date = payload.get("to")
        title = payload.get("title", "").strip()
        title1 = payload.get("title", "").strip()  # 🔹 Нэрээр хайх

        # Pagination
        try:
            page = max(1, int(payload.get("page", 1)))
            per_page = max(1, int(payload.get("per_page", 12)))
        except ValueError:
            return JsonResponse(sendResponse(request, 3002, {"error": "Invalid pagination parameters"}, action))
        offset = (page - 1) * per_page

        # DB холболт
        myConn = connectDB()
        cursor = myConn.cursor()

        # 🔹 Count query
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
        if title:
            count_sql += " AND z_title LIKE %s"
            params.append(f"%{title}%")

        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]
        total_pages = (total + per_page - 1) // per_page

        # 🔹 Main query
        sql = """
            SELECT 
                zid, z_title, z_price, z_m2, z_rooms, z_bathroom, z_address, z_createddate,
                (SELECT hname FROM t_hot WHERE hid = t_zar.z_hot) as city_name,
                (SELECT dname FROM t_duureg WHERE did = t_zar.z_duureg) as district_name,
                (SELECT zurag FROM t_zar_zurag WHERE zarid = t_zar.zid ORDER BY zid LIMIT 1) as cover,
                z_status, z_type
            FROM t_zar 
            WHERE z_isactive = TRUE
        """
        # 🔹 Filters нэмэх
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
        if title:
            sql += " AND z_title LIKE %s"
        

        sql += " ORDER BY z_createddate DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])

        cursor.execute(sql, params)
        rows = cursor.fetchall()

        # 🔹 Result format
        result = []
        for r in rows:
            result.append({
                "zid": r[0],
                "title": r[1],
                "price": str(r[2]),
                "m2": r[3] or 0,
                "rooms": r[4] or 0,
                "baths": r[5] or 0,
                "address": r[6] or "",
                "created": r[7].strftime("%Y-%m-%d") if r[7] else "",
                "city": r[8] or "",
                "district": r[9] or "",
                "cover": r[10] or "/media/default.jpg",
                "status": r[11],
                "type": r[12],
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


