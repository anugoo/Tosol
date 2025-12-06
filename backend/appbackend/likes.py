"""
Likes related views and functions
"""
import json
from django.http import JsonResponse
from backend.settings import sendResponse, disconnectDB, connectDB


def dt_toggle_like(request):
    """Toggle like/unlike for a property"""
    jsons = json.loads(request.body)
    action = jsons.get('action')

    try:
        zar_id = jsons.get('zar_id')
        uid = jsons.get('uid')

        if not zar_id or not uid:
            return JsonResponse(sendResponse(request, 3000, [{"error": "zar_id, uid шаардлагатай"}], action))

        myConn = connectDB()
        cursor = myConn.cursor()

        # Check if like already exists
        query = "SELECT like_id FROM t_zar_likes WHERE zarid = %s AND uid = %s"
        cursor.execute(query, (zar_id, uid))
        existing_like = cursor.fetchone()

        if existing_like:
            # Unlike: remove the like
            query = "DELETE FROM t_zar_likes WHERE zarid = %s AND uid = %s RETURNING like_id"
            cursor.execute(query, (zar_id, uid))
            myConn.commit()
            action_result = "unliked"
        else:
            # Like: add the like
            query = "INSERT INTO t_zar_likes (zarid, uid, createddate) VALUES (%s, %s, NOW()) RETURNING like_id"
            cursor.execute(query, (zar_id, uid))
            myConn.commit()
            action_result = "liked"

        # Get updated likes count
        query = "SELECT COUNT(*) as likes_count FROM t_zar_likes WHERE zarid = %s"
        cursor.execute(query, (zar_id,))
        likes_count = cursor.fetchone()[0]

        respdata = [{
            "action": action_result,
            "likes_count": likes_count,
            "zar_id": zar_id
        }]
        resp = sendResponse(request, 9001, respdata, action)

    except Exception as e:
        if 'myConn' in locals():
            myConn.rollback()
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 9002, respdata, action)
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


def dt_get_likes_count(request):
    """Get likes count for a property"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    zar_id = jsons.get('zar_id')

    if not zar_id:
        return JsonResponse(sendResponse(request, 3000, [{"error": "zar_id шаардлагатай"}], action))

    try:
        myConn = connectDB()
        cursor = myConn.cursor()

        query = "SELECT COUNT(*) as likes_count FROM t_zar_likes WHERE zarid = %s"
        cursor.execute(query, (zar_id,))
        likes_count = cursor.fetchone()[0]

        respdata = [{"likes_count": likes_count, "zar_id": zar_id}]
        resp = sendResponse(request, 9003, respdata, action)

    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 9004, respdata, action)
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


def dt_get_user_likes(request):
    """Get all properties liked by a user"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    uid = jsons.get('uid')

    if not uid:
        return JsonResponse(sendResponse(request, 3000, [{"error": "uid шаардлагатай"}], action))

    try:
        myConn = connectDB()
        cursor = myConn.cursor()

        query = """
            SELECT
                z.zid,
                z.z_title,
                z.z_price,
                z.z_address,
                d.dname AS district_name,
                h.hname AS hot_name,
                z.z_rooms,
                z.z_m2,
                z.z_createddate,
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
            FROM t_zar_likes l
            INNER JOIN t_zar z ON l.zarid = z.zid
            INNER JOIN t_hot h ON h.hid = z.z_hot
            INNER JOIN t_duureg d ON d.did = z.z_duureg
            LEFT JOIN t_zar_zurag tz ON z.zid = tz.zarid
            WHERE l.uid = %s AND z.z_isactive = TRUE
            GROUP BY z.zid, z.z_title, z.z_price, z.z_address, d.dname, h.hname, z.z_rooms, z.z_m2, z.z_createddate
            ORDER BY l.createddate DESC
        """

        cursor.execute(query, (uid,))
        columns = [col[0] for col in cursor.description]
        liked_properties = []

        for row in cursor.fetchall():
            prop_dict = dict(zip(columns, row))
            # Safely parse images JSON
            images = prop_dict.get('images', '[]')
            try:
                if isinstance(images, str):
                    prop_dict['images'] = json.loads(images) if images else []
                else:
                    prop_dict['images'] = images if images else []
            except (json.JSONDecodeError, TypeError, ValueError):
                prop_dict['images'] = []

            if prop_dict.get('z_createddate'):
                prop_dict['z_createddate'] = prop_dict['z_createddate'].strftime("%Y-%m-%d %H:%M:%S")

            liked_properties.append(prop_dict)

        resp = sendResponse(request, 9005, liked_properties, action)

    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 9006, respdata, action)
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


def dt_get_most_liked(request):
    """Get most liked properties for leaderboard"""
    jsons = json.loads(request.body)
    action = jsons.get('action')
    limit = int(jsons.get('limit', 10))

    try:
        myConn = connectDB()
        cursor = myConn.cursor()

        query = """
            SELECT
                z.zid,
                z.z_title,
                z.z_price,
                z.z_address,
                d.dname AS district_name,
                h.hname AS hot_name,
                z.z_rooms,
                z.z_m2,
                COUNT(l.like_id) as likes_count,
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
            LEFT JOIN t_zar_likes l ON z.zid = l.zarid
            INNER JOIN t_hot h ON h.hid = z.z_hot
            INNER JOIN t_duureg d ON d.did = z.z_duureg
            LEFT JOIN t_zar_zurag tz ON z.zid = tz.zarid
            WHERE z.z_isactive = TRUE
            GROUP BY z.zid, z.z_title, z.z_price, z.z_address, d.dname, h.hname, z.z_rooms, z.z_m2
            HAVING COUNT(l.like_id) > 0
            ORDER BY likes_count DESC, z.zid DESC
            LIMIT %s
        """

        cursor.execute(query, (limit,))
        columns = [col[0] for col in cursor.description]
        most_liked = []

        for row in cursor.fetchall():
            prop_dict = dict(zip(columns, row))
            # Safely parse images JSON
            images = prop_dict.get('images', '[]')
            try:
                if isinstance(images, str):
                    prop_dict['images'] = json.loads(images) if images else []
                else:
                    prop_dict['images'] = images if images else []
            except (json.JSONDecodeError, TypeError, ValueError):
                prop_dict['images'] = []

            most_liked.append(prop_dict)

        resp = sendResponse(request, 9007, most_liked, action)

    except Exception as e:
        respdata = [{"error": str(e)}]
        resp = sendResponse(request, 9008, respdata, action)
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
